import type { EditorConfig } from "../config.ts";
import type { AnyBlockDefinition } from "../../src/blocks/schema.ts";
import type { GitHub } from "./github.ts";
import type { ChangeView, ProposalView } from "./views.ts";

export type { ChangeView, ProposalView };

export type ToolResult<T = unknown> = { text: string; data: T; isError?: boolean };
export type Owner = { email: string };
export type AssetsLike = { fetch(request: Request): Promise<Response> };

export interface EditorDeps {
  config: EditorConfig;
  github: GitHub;
  kv: KVNamespace;
  assets: AssetsLike;
  registry: readonly AnyBlockDefinition[];
  thanksLinks: readonly { where: string; href: string }[];
  now: () => Date;
  fetch?: typeof fetch;
  randomId?: () => string;
}

export interface Editor {
  overview(): Promise<ToolResult>;
  page(path: string): Promise<ToolResult>;
  catalog(): Promise<ToolResult>;
  guide(): Promise<ToolResult>;
  propose(input: { summary: string; operations: unknown }, owner: Owner): Promise<ToolResult>;
  preview(proposalId: string): Promise<ToolResult>;
  publish(proposalId: string, confirmation: string, owner: Owner): Promise<ToolResult>;
  status(change: number): Promise<ToolResult>;
  recent(): Promise<ToolResult<ChangeView[]>>;
  undo(change: number, owner: Owner): Promise<ToolResult>;
  discard(proposalId: string): Promise<ToolResult>;
  requestFeature(input: { request: string; laneReason: string }, owner: Owner): Promise<ToolResult>;
  waiting(): Promise<ToolResult<ProposalView[]>>;
}

export const GITHUB_DOWN = "GitHub could not be reached right now, so nothing was changed. Try again in a minute.";
