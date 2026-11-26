import { pathForFile } from "../../src/blocks/schema.ts";
import { log } from "../env.ts";
import { addedPlaceholders, buildChangeList, matchBlockIds } from "./change-list.ts";
import { GitHubError, type Pull } from "./github.ts";
import { isObject } from "./json.ts";
import { applyOperations, deepEqual } from "./operations.ts";
import { catalogResult, guideResult, overviewResult, pageResult } from "./read-tools.ts";
import { filesFor, isPageFile, readSite, validateSet } from "./site-reader.ts";
import { BRANCH_PREFIX, changeTitle, createStatusReader, deployedReader, editorPulls, isEditorPull, statusLine, type ChangeStatus } from "./status.ts";
import { GITHUB_DOWN, type ChangeView, type Editor, type EditorDeps, type Owner, type ProposalView, type ToolResult } from "./types.ts";
import { AGENCY_NAME } from "./words.ts";

/**
 * The code behind every owner chat tool. Proposals are drafts in KV; nothing reaches the repo until publish, and publish
 * opens one pull request that the site's required checks must pass before it merges. Text returned to the AI never holds a
 * token, key, URL query, email or GitHub response body.
 */

const PROPOSAL_TTL = 259_200;
const ID_RE = /^[a-z0-9]{8}$/;
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/;
const EXPIRED = "That proposal has expired or does not exist. Propose it again.";
const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const KINDS = ["change", "undo", "withdraw"];
const PREVIEW_COUNT_TTL = 172_800;
const SWEEP_LIMIT = 10;

interface Proposal {
  id: string;
  kind: "change" | "undo" | "withdraw";
  summary: string;
  createdAt: string;
  email: string;
  baseCommit: string;
  pagesTree: string;
  imagesTree: string;
  files: { path: string; content: string }[];
  changeList: string;
  undoOf?: number;
  withdraw?: number;
  preview?: { branch: string; commit: string };
}

const error = (text: string, data: Record<string, unknown> = {}): ToolResult => ({ text, data, isError: true });
const isCount = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value > 0;
const defuse = (text: string): string => text.replace(/@/g, "@​");

/** A stored draft, or null when any field the tools rely on is missing or the wrong type (treated as expired). */
function parseProposal(value: unknown, id: string): Proposal | null {
  if (!isObject(value) || value.id !== id) return null;
  const { kind, summary, createdAt, email, baseCommit, pagesTree, imagesTree, files, changeList, undoOf, withdraw, preview } = value;
  const strings = [summary, createdAt, email, baseCommit, pagesTree, imagesTree, changeList];
  if (typeof kind !== "string" || !KINDS.includes(kind) || !strings.every((item) => typeof item === "string")) return null;
  if (!Array.isArray(files) || !files.every((file) => isObject(file) && typeof file.path === "string" && typeof file.content === "string")) return null;
  if (undoOf !== undefined && !isCount(undoOf)) return null;
  if (kind === "withdraw" ? !isCount(withdraw) : withdraw !== undefined) return null;
  if (preview !== undefined && !(isObject(preview) && typeof preview.branch === "string" && typeof preview.commit === "string")) return null;
  return value as unknown as Proposal;
}

function refusal(problems: string[]): ToolResult {
  return error(`This change can't be made as asked:\n${problems.join("\n")}\nNothing was changed.`, { problems });
}

function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => ID_ALPHABET[byte % ID_ALPHABET.length]).join("");
}

function pullBody(proposal: Proposal, confirmation: string): string {
  const list = defuse(proposal.changeList);
  const longestRun = Math.max(0, ...(list.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(Math.max(3, longestRun + 1));
  const said = confirmation.split(/\r?\n/).map((line) => `> ${defuse(line)}`);
  return [
    "Needs your eyes: none",
    "",
    "Made by the site editor and approved by the site owner in chat.",
    "The owner said:",
    ...said,
    "",
    `Proposal ${proposal.id}.`,
    "",
    `${fence}text`,
    list,
    fence,
  ].join("\n");
}

export function createEditor(deps: EditorDeps): Editor {
  const { config, github, kv, assets, registry, thanksLinks, now } = deps;
  const doFetch = deps.fetch ?? fetch;
  const makeId = deps.randomId ?? newId;
  const statuses = createStatusReader({ config, github, kv, now });
  const deployed = () => deployedReader(assets, config.siteUrl);

  async function guarded(work: () => Promise<ToolResult>, failure: () => string = () => GITHUB_DOWN): Promise<ToolResult> {
    try {
      return await work();
    } catch (caught) {
      if (caught instanceof GitHubError) return error(failure(), { reason: "github" });
      throw caught;
    }
  }

  async function load(id: string): Promise<Proposal | null> {
    if (typeof id !== "string" || !ID_RE.test(id)) return null;
    return parseProposal(await kv.get(`proposal:${id}`, "json"), id);
  }
  const save = (proposal: Proposal) => kv.put(`proposal:${proposal.id}`, JSON.stringify(proposal), { expirationTtl: PROPOSAL_TTL });

  const previewLink = (id: string): string | null =>
    config.workersSubdomain === null ? null : `https://change-owner-${id}-${config.workerName}.${config.workersSubdomain}.workers.dev`;

  function startOfToday(): number {
    const d = now();
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  const madeToday = (pulls: Pull[]): number => pulls.filter((pull) => Date.parse(pull.createdAt) >= startOfToday()).length;

  /** Closes a pull request the editor opened and deletes its branch. Best effort: each step has its own try/catch. */
  async function stopPull(pull: Pull): Promise<void> {
    try {
      await github.closePull(pull.number);
    } catch {
      log("editor_stop_failed", { step: "close" });
    }
    try {
      await github.deleteBranch(pull.headRef);
    } catch {
      log("editor_stop_failed", { step: "branch" });
    }
  }

  /** Deletes up to 10 leftover change branches that have no open pull request and no waiting proposal. Never throws. */
  async function sweep(): Promise<void> {
    try {
      const [branches, open] = await Promise.all([github.listBranches(BRANCH_PREFIX), github.listPulls("open")]);
      const inUse = new Set(open.map((pull) => pull.headRef));
      let removed = 0;
      for (const branch of branches) {
        if (removed >= SWEEP_LIMIT) break;
        if (inUse.has(branch.name) || !branch.name.startsWith(BRANCH_PREFIX)) continue;
        if ((await kv.get(`proposal:${branch.name.slice(BRANCH_PREFIX.length)}`)) !== null) continue;
        try {
          await github.deleteBranch(branch.name);
          removed += 1;
        } catch {
          log("editor_sweep_failed", { step: "delete" });
        }
      }
    } catch {
      log("editor_sweep_failed", { step: "list" });
    }
  }

  const previewsKey = (): string => `previews:${now().toISOString().slice(0, 10)}`;

  async function store(input: Omit<Proposal, "id" | "createdAt">): Promise<ToolResult> {
    const proposal: Proposal = { ...input, id: makeId(), createdAt: now().toISOString() };
    await save(proposal);
    const text = `Proposal ${proposal.id}: ${proposal.summary}\n\n${proposal.changeList}\n\nNothing has changed yet. Show this list to the owner exactly as written. Publish only after they say yes to it.`;
    return { text, data: { proposal_id: proposal.id, summary: proposal.summary, change_list: proposal.changeList } };
  }

  function checkSummary(summary: unknown): string | null {
    if (typeof summary !== "string" || summary.trim().length < 1 || summary.length > 100) return "The summary must be 1 to 100 characters.";
    if (CONTROL.test(summary)) return "The summary must be one plain line, with no line breaks or hidden characters.";
    if (summary.includes("[[")) return "The summary may not contain [[ ]] placeholders.";
    return null;
  }

  async function undoMerged(pull: Pull, owner: Owner): Promise<ToolResult> {
    const merge = pull.mergeCommitSha;
    if (merge === null) return error(`I can't find where change ${pull.number} landed on the site, so I can't undo it. Ask ${AGENCY_NAME}.`);
    const snapshot = await readSite(github);
    const paths = (await github.pullFiles(pull.number)).map((file) => file.path).filter(isPageFile);
    const parent = await github.commitParent(merge);
    const after = new Map(snapshot.pages);
    const problems: string[] = [];
    for (const path of paths) {
      const [current, atMerge, before] = await Promise.all([github.fileAt(snapshot.commit, path), github.fileAt(merge, path), github.fileAt(parent, path)]);
      if (current === null) continue;
      if (current !== atMerge) {
        problems.push(`A later change touched ${pathForFile(path)} after change ${pull.number}. Undo the later change first.`);
        continue;
      }
      try {
        const restored: unknown = before === null ? { ...(JSON.parse(current) as Record<string, unknown>), status: "archived" } : JSON.parse(before);
        const own = isObject(restored) && typeof restored.path === "string" ? restored.path : pathForFile(path);
        after.set(own, restored);
      } catch {
        problems.push(`${pathForFile(path)} cannot be read, so it cannot be restored. Ask ${AGENCY_NAME}.`);
      }
    }
    if (problems.length > 0) return error(problems.join("\n"), { problems });
    const touched = [...after.keys()].filter((path) => !deepEqual(snapshot.pages.get(path), after.get(path)));
    if (touched.length === 0) return { text: `Change ${pull.number} has already been undone, so there is nothing to change.`, data: { change: pull.number } };
    const invalid = validateSet(snapshot, after, registry, thanksLinks);
    if (invalid.length > 0) return refusal(invalid);
    const changeList = buildChangeList(snapshot.pages, after, matchBlockIds(snapshot.pages, after), registry);
    return store({
      kind: "undo",
      summary: `Undo change ${pull.number}`,
      email: owner.email,
      baseCommit: snapshot.commit,
      pagesTree: snapshot.pagesTree,
      imagesTree: snapshot.imagesTree,
      files: filesFor(snapshot, after, touched),
      changeList,
      undoOf: pull.number,
    });
  }

  async function publishWithdraw(proposal: Proposal): Promise<ToolResult> {
    const number = proposal.withdraw ?? 0;
    const pull = await github.getPull(number);
    if (!pull || pull.state !== "open") {
      await kv.delete(`proposal:${proposal.id}`);
      return error(`Change ${number} is no longer waiting, so there is nothing to withdraw.`);
    }
    await github.closePull(number);
    await github.deleteBranch(pull.headRef);
    await kv.delete(`proposal:${proposal.id}`);
    log("editor_withdraw", { change: number });
    return { text: `Change ${number} was withdrawn. Nothing changed on the site.`, data: { change: number } };
  }

  async function publishChange(proposal: Proposal, confirmation: string, opened: { value: boolean }): Promise<ToolResult> {
    const today = madeToday(await editorPulls(github, config, "all"));
    if (today >= config.dailyChangeLimit) return error(`This site has had ${today} changes today, the daily limit. Try again tomorrow, or ask ${AGENCY_NAME}.`);
    const [inFlight] = await editorPulls(github, config, "open");
    if (inFlight) {
      const stuck = (await statuses.read(inFlight, deployed())).state === "stuck";
      return error(
        stuck
          ? `Change ${inFlight.number} is stuck: a check found a problem, so it can't go live. Withdraw it first (ask me to undo change ${inFlight.number}), then publish this.`
          : `Change ${inFlight.number} is still going live. Publish this when it is live.`,
      );
    }

    const snapshot = await readSite(github);
    if (snapshot.pagesTree !== proposal.pagesTree || snapshot.imagesTree !== proposal.imagesTree) {
      return error("The site changed since this was proposed. Propose it again.");
    }
    const branch = `${BRANCH_PREFIX}${proposal.id}`;
    const reusable = proposal.preview !== undefined && proposal.baseCommit === snapshot.commit && (await github.branchHead(branch)) === proposal.preview.commit;
    if (!reusable) {
      const commit = await github.createCommit({ baseCommit: snapshot.commit, files: proposal.files, message: `content: ${proposal.summary}` });
      await github.setBranch(branch, commit);
    }
    opened.value = true;
    const pull = await github.openPull({ head: branch, title: defuse(`change: ${proposal.summary}`), body: pullBody(proposal, confirmation) });

    // From here a pull request exists: every way out either leaves it queued or stops it, never half open.
    const stopped = async (text: string, event: string): Promise<ToolResult> => {
      await stopPull(pull);
      log(event, { change: pull.number });
      return error(text);
    };
    try {
      const bot = config.github.botLogin;
      if (bot === null || pull.author.toLowerCase() !== bot.toLowerCase()) {
        return await stopped(`The site editor's settings don't match its GitHub App, so nothing was published. ${AGENCY_NAME} needs to fix the editor's settings.`, "editor_bot_mismatch");
      }
      const open = await editorPulls(github, config, "open");
      if (open.some((other) => other.number < pull.number)) {
        return await stopped("Another change was published at the same moment. This one was stopped; try again when that one is live.", "editor_race_stopped");
      }
      const queued = await github.enableAutoMerge(pull.nodeId);
      if (queued === "not_allowed") {
        return await stopped(`Auto-merge is turned off for this site's repository, so nothing was published. ${AGENCY_NAME} needs to turn it on.`, "editor_auto_merge_off");
      }
      if (queued === "clean") {
        // Merging by hand here would skip the checks, so the pull request stays open for the owner of the repository.
        await kv.delete(`proposal:${proposal.id}`);
        log("editor_no_required_checks", { change: pull.number });
        return error(`This site's required checks aren't set up, so the change was not published. It is waiting for ${AGENCY_NAME}.`, { change: pull.number });
      }
    } catch (caught) {
      await stopPull(pull);
      if (caught instanceof GitHubError) return error("The change was opened but could not be queued, so it was stopped. Nothing is live.", { reason: "github" });
      throw caught;
    }
    await kv.delete(`proposal:${proposal.id}`);
    log("editor_publish", { change: pull.number });
    return {
      text: `Published as change ${pull.number}. It goes live after the site's checks pass, usually in about 5 minutes. It is not live yet.`,
      data: { change: pull.number },
    };
  }

  const statusResult = (status: ChangeStatus): ToolResult => ({ text: statusLine(status), data: status });
  const validChange = (change: unknown): change is number => typeof change === "number" && Number.isInteger(change) && change > 0;
  const noChange = (change: number): ToolResult => error(`There is no change ${change} on this site.`);

  return {
    async overview() {
      return guarded(async () => {
        const [snapshot, pulls] = await Promise.all([readSite(github), editorPulls(github, config, "all")]);
        const open = pulls.find((pull) => pull.state === "open");
        const inFlight = open ? { change: open.number, state: (await statuses.read(open, deployed())).state } : null;
        const changesLeftToday = Math.max(0, config.dailyChangeLimit - madeToday(pulls));
        await sweep();
        return overviewResult({ snapshot, registry, site: { name: config.siteName, url: config.siteUrl }, inFlight, changesLeftToday });
      }, () => "GitHub could not be reached right now, so I can't read the site. Try again in a minute.");
    },

    async page(path) {
      return guarded(async () => pageResult(String(path), await readSite(github), registry), () => "GitHub could not be reached right now, so I can't read the page. Try again in a minute.");
    },

    async catalog() {
      return catalogResult(registry);
    },

    async guide() {
      return guarded(async () => {
        const head = await github.headOfMain();
        const [lanes, voice] = await Promise.all([github.fileAt(head.commit, "docs/EDITING-LANES.md"), github.fileAt(head.commit, "docs/VOICE-GUIDE.md")]);
        return guideResult(lanes, voice);
      }, () => "GitHub could not be reached right now, so I can't read the guide. Try again in a minute.");
    },

    async propose(input, owner) {
      const bad = checkSummary(input.summary);
      if (bad) return error(bad);
      return guarded(async () => {
        const snapshot = await readSite(github);
        const applied = applyOperations(snapshot.pages, input.operations);
        if (!applied.ok) return refusal(applied.problems);
        if (applied.touched.length === 0) return refusal(["The operations change nothing on the site."]);
        const problems = [...addedPlaceholders(snapshot.pages, applied.after), ...validateSet(snapshot, applied.after, registry, thanksLinks)];
        if (problems.length > 0) return refusal(problems);
        return store({
          kind: "change",
          summary: input.summary.trim(),
          email: owner.email,
          baseCommit: snapshot.commit,
          pagesTree: snapshot.pagesTree,
          imagesTree: snapshot.imagesTree,
          files: filesFor(snapshot, applied.after, applied.touched),
          changeList: buildChangeList(snapshot.pages, applied.after, applied.ids, registry, applied.moved),
        });
      });
    },

    async preview(id) {
      if (config.workersSubdomain === null) return { text: "Preview links are not set up for this site yet.", data: { link: null, ready: false } };
      const proposal = await load(id);
      if (!proposal) return error(EXPIRED);
      if (proposal.kind === "withdraw") return { text: "A withdrawal has nothing to preview.", data: { link: null, ready: false } };
      return guarded(async () => {
        let preview = proposal.preview;
        if (!preview) {
          const used = Number(await kv.get(previewsKey())) || 0;
          if (used >= config.dailyChangeLimit) return error(`This site has had ${used} previews today, the daily limit. Publish or try tomorrow.`);
          await sweep();
          const branch = `${BRANCH_PREFIX}${proposal.id}`;
          const commit = await github.createCommit({ baseCommit: proposal.baseCommit, files: proposal.files, message: `preview: ${proposal.summary}` });
          await github.setBranch(branch, commit);
          preview = { branch, commit };
          await kv.put(previewsKey(), String(used + 1), { expirationTtl: PREVIEW_COUNT_TTL });
          await save({ ...proposal, preview });
        }
        const link = previewLink(proposal.id) as string;
        let ready = false;
        try {
          const response = await doFetch(`${link}/site-version.json`, { signal: AbortSignal.timeout(5000) });
          const data: unknown = response.ok ? await response.json() : null;
          ready = isObject(data) && data.commit === preview.commit;
        } catch {
          ready = false;
        }
        const text = ready ? `The preview is ready: ${link}` : `The preview is being built (usually 1 to 2 minutes): ${link}. It may not open until then.`;
        return { text, data: { link, ready } };
      });
    },

    async publish(id, confirmation) {
      const proposal = await load(id);
      if (!proposal) return error(EXPIRED);
      const words = typeof confirmation === "string" ? confirmation.trim() : "";
      if (words.length < 1 || words.length > 500) return error("Pass the owner's own words saying yes, 1 to 500 characters, as the confirmation.");
      const opened = { value: false };
      return guarded(
        () => (proposal.kind === "withdraw" ? publishWithdraw(proposal) : publishChange(proposal, words, opened)),
        () => (opened.value ? "GitHub could not be reached right now, so the change was not opened. Nothing is live." : GITHUB_DOWN),
      );
    },

    async status(change) {
      if (!validChange(change)) return error("The change number must be a whole number such as 12.");
      return guarded(async () => {
        const pull = await github.getPull(change);
        if (!pull || !isEditorPull(pull, config)) return noChange(change);
        return statusResult(await statuses.read(pull, deployed()));
      }, () => "GitHub could not be reached right now, so I can't check. Try again in a minute.");
    },

    async recent(): Promise<ToolResult<ChangeView[]>> {
      try {
        const pulls = (await editorPulls(github, config, "all")).slice(0, 10);
        const read = deployed();
        const changes: ChangeView[] = await Promise.all(
          pulls.map(async (pull): Promise<ChangeView> => {
            try {
              return await statuses.read(pull, read);
            } catch {
              log("editor_status_failed", { change: pull.number });
              return { change: pull.number, title: changeTitle(pull), state: "unknown", publishedAt: pull.createdAt };
            }
          }),
        );
        const text = changes.length === 0 ? "No changes have been published yet." : changes.map((c) => `${statusLine(c)} (${c.title})`).join("\n");
        return { text, data: changes };
      } catch (caught) {
        if (!(caught instanceof GitHubError)) throw caught;
        return { text: "GitHub could not be reached right now, so I can't list changes. Try again in a minute.", data: [], isError: true };
      }
    },

    async undo(change, owner) {
      if (!validChange(change)) return error("The change number must be a whole number such as 12.");
      return guarded(async () => {
        const pull = await github.getPull(change);
        if (!pull || !isEditorPull(pull, config)) return noChange(change);
        if (pull.state === "open") {
          const changeList = `Withdraws change ${change} (${changeTitle(pull)}). It never went live, so nothing on the site changes.`;
          return store({ kind: "withdraw", summary: `Withdraw change ${change}`, email: owner.email, baseCommit: "", pagesTree: "", imagesTree: "", files: [], changeList, withdraw: change });
        }
        if (!pull.merged) return error(`Change ${change} never went live, so there is nothing to undo.`);
        return undoMerged(pull, owner);
      });
    },

    async discard(id) {
      const proposal = await load(id);
      if (!proposal) return { text: `There is no proposal ${String(id).slice(0, 20)} waiting; it may already be gone.`, data: { discarded: false } };
      return guarded(async () => {
        if (proposal.preview) await github.deleteBranch(proposal.preview.branch);
        await kv.delete(`proposal:${proposal.id}`);
        return { text: `Proposal ${proposal.id} was discarded.`, data: { discarded: true } };
      });
    },

    async requestFeature(input) {
      const request = typeof input.request === "string" ? input.request.trim() : "";
      const reason = typeof input.laneReason === "string" ? input.laneReason.trim() : "";
      if (request.length < 1 || request.length > 2000) return error("The request must be 1 to 2,000 characters.");
      if (reason.length > 500) return error("The reason must be at most 500 characters.");
      return guarded(async () => {
        const title = defuse(`Owner request: ${request.replace(/\s+/g, " ").slice(0, 60)}`);
        const body = [
          "A site owner asked for something the block library cannot do.",
          "",
          ...request.split(/\r?\n/).map((line) => `> ${defuse(line)}`),
          "",
          `Why it needs ${AGENCY_NAME} (from the owner's AI app): ${defuse(reason)}`,
          "",
          `Date: ${now().toISOString().slice(0, 10)}. Recorded by the site editor.`,
        ].join("\n");
        const issue = await github.openIssue({ title, body, labels: ["owner-request"] });
        return {
          text: `Recorded for ${AGENCY_NAME} as request ${issue.number}. This needs ${AGENCY_NAME}: the site's sections can't do it. ${AGENCY_NAME} has the request and will say what it takes.`,
          data: { request: issue.number },
        };
      }, () => "GitHub could not be reached right now, so the request was not recorded. Try again in a minute.");
    },

    async waiting(): Promise<ToolResult<ProposalView[]>> {
      try {
        const listed = await kv.list({ prefix: "proposal:" });
        const found = await Promise.all(listed.keys.map((key) => load(key.name.slice("proposal:".length))));
        const proposals: ProposalView[] = found
          .filter((p): p is Proposal => p !== null)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .map((p) => ({ id: p.id, summary: p.summary, createdAt: p.createdAt, changeList: p.changeList, previewLink: p.preview ? previewLink(p.id) : null }));
        const text =
          proposals.length === 0
            ? "Nothing is waiting for the owner's yes."
            : proposals.map((p) => `Proposal ${p.id}: ${p.summary}${p.previewLink ? ` (preview: ${p.previewLink})` : ""}\n${p.changeList}`).join("\n\n");
        return { text, data: proposals };
      } catch {
        log("editor_waiting_failed");
        return { text: "The waiting list could not be read right now. Try again in a minute.", data: [], isError: true };
      }
    },
  };
}
