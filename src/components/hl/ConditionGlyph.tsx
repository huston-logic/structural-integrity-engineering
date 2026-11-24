import type { ReactNode } from "react";
import type { ConditionGlyphName } from "@/content/home";

/** The four design-condition glyphs from the option G reference (64 x 40, 2px amber strokes, round caps). */
const glyphs: Record<ConditionGlyphName, ReactNode> = {
  // Snow load: three arrows bearing down on a roof line.
  snow: (
    <>
      <line x1="4" y1="36" x2="60" y2="36" />
      <line x1="12" y1="4" x2="12" y2="28" />
      <polyline points="7,23 12,28 17,23" />
      <line x1="32" y1="4" x2="32" y2="28" />
      <polyline points="27,23 32,28 37,23" />
      <line x1="52" y1="4" x2="52" y2="28" />
      <polyline points="47,23 52,28 57,23" />
    </>
  ),
  // Wind: three arrows pushing against a wall.
  wind: (
    <>
      <line x1="60" y1="4" x2="60" y2="36" />
      <line x1="4" y1="10" x2="52" y2="10" />
      <polyline points="47,5 52,10 47,15" />
      <line x1="4" y1="20" x2="52" y2="20" />
      <polyline points="47,15 52,20 47,25" />
      <line x1="4" y1="30" x2="52" y2="30" />
      <polyline points="47,25 52,30 47,35" />
    </>
  ),
  // Seismic: a ground-motion trace.
  seismic: <polyline points="2,20 8,20 12,8 18,32 24,6 30,34 36,10 42,28 48,16 52,20 62,20" />,
  // Temperature: a member with movement arrows at both ends.
  temperature: (
    <>
      <rect x="20" y="12" width="24" height="16" />
      <line x1="4" y1="20" x2="16" y2="20" />
      <polyline points="8,16 4,20 8,24" />
      <line x1="48" y1="20" x2="60" y2="20" />
      <polyline points="56,16 60,20 56,24" />
    </>
  ),
};

/** Decorative: the heading beside it names the condition. */
export function ConditionGlyph({ name }: { name: ConditionGlyphName }) {
  return (
    <svg viewBox="0 0 64 40" aria-hidden="true" focusable="false" className="h-10 w-16">
      <g fill="none" stroke="var(--hl-amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {glyphs[name]}
      </g>
    </svg>
  );
}
