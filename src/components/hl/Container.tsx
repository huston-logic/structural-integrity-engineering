import type { ReactNode } from "react";

/** The page column (docs/STYLE-GUIDE.md §4): up to 1320px wide with 48px side padding (22px on phones). */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-page px-5.5 md:px-12 ${className}`}>{children}</div>;
}
