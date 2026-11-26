// Runs after `next build` (see package.json `build`): stamps ./out with the commit it was built from
// (out/site-version.json, with whether drafts were built) and, on a Workers Builds production build, removes the /blocks showcase from ./out.
// CI and preview builds keep /blocks so the accessibility and Lighthouse checks still scan it.
// While the blog page (src/content/pages/blog.json) is not live, it also removes the /blog files: the blog route must build at
// least one address for a static export, so Next writes a 404 shell at /blog and an empty feed, which are not a blog
// (docs/SITE-DIFFERENCES.md, D12).
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isProductionBuild } from "../src/lib/build-target.ts";

/** Writes <outDir>/site-version.json and, when env.WORKERS_CI_BRANCH is the production branch, removes the showcase. `blogLive` false removes /blog. */
export function finishBuild({ outDir, env, productionBranch, blogLive = true }) {
  const commit = env.WORKERS_CI_COMMIT_SHA || env.GITHUB_SHA || null;
  const showcaseRemoved = isProductionBuild(env, productionBranch);
  // Drafts are built everywhere except production (src/lib/drafts.ts uses the same rule), so a build that says drafts: true is not a production build.
  const drafts = !showcaseRemoved;
  writeFileSync(join(outDir, "site-version.json"), `${JSON.stringify({ commit, builtAt: new Date().toISOString(), drafts })}\n`);
  if (showcaseRemoved) {
    for (const name of ["blocks.html", "blocks.txt", "blocks"]) rmSync(join(outDir, name), { recursive: true, force: true });
  }
  if (!blogLive) {
    for (const name of ["blog.html", "blog.txt", "blog"]) rmSync(join(outDir, name), { recursive: true, force: true });
  }
  return { commit, showcaseRemoved, drafts, blogRemoved: !blogLive };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const { siteConfig } = await import(pathToFileURL(join(root, "site.config.ts")).href);
  const { readPageFiles } = await import(pathToFileURL(join(root, "src/lib/page-files.ts")).href);
  const blogLive = readPageFiles(root).some(({ data }) => data?.path === "/blog" && data?.status === "live");
  const result = finishBuild({ outDir: join(root, "out"), env: process.env, productionBranch: siteConfig.domain.productionBranch, blogLive });
  console.log(`Build stamp: ${result.commit ?? "no commit known"}${result.showcaseRemoved ? "; /blocks removed (production build)" : ""}${result.blogRemoved ? "; /blog removed (the blog page is archived)" : ""}`);
  if (result.drafts) console.log("Drafts included (not a production build)");
}
