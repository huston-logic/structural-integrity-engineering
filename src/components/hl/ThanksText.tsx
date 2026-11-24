"use client";

import { useSyncExternalStore } from "react";
import { Text } from "@/components/ui/Text";
import { thanks } from "@/content/contact";
import { parseHandoff, readHandoff } from "@/lib/contact-handoff";

const subscribe = () => () => {};

/**
 * The thanks page heading or intro (docs/website-plan.md B7b), personalised from what the contact form left in
 * sessionStorage. The static HTML (and a visit without a submission) shows the plain "Got it, thanks." version.
 */
export function ThanksText({ part }: { part: "heading" | "body" }) {
  const { firstName, autoReplyFailed } = parseHandoff(useSyncExternalStore(subscribe, readHandoff, () => null));
  if (part === "heading") return <Text>{firstName ? thanks.headingWithName.replace("{firstName}", firstName) : thanks.heading}</Text>;
  return <Text>{autoReplyFailed ? thanks.bodyAutoReplyFailed : thanks.body}</Text>;
}
