// The motion every site block shares. This site's sections already move with their own CSS (the `.reveal` and
// `.reveal-zoom` rules in hl.css), so the renderer's entrance would double them. Import-free: the registry check loads it.
export const ownReveals = {
  entrance: "none",
  reason: "This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.",
} as const;

// The amber line drawing on each page's first block (hl.css, hl-draw) is the page's one focal animation. It is drawn by
// a transition from `@starting-style`, not by a keyframe, so these blocks declare no `signature` (which names a keyframe).
