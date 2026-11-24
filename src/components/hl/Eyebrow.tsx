import type { ReactNode } from "react";

/** The small line above a heading: amber, semibold, sentence case. Only where the copy has one. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-small font-semibold text-amber ${className}`}>{children}</p>;
}
