import type { CSSProperties, ReactElement, ReactNode } from "react";

/** The drawings. `about` and `contact` sit on the page; the other four lie over the page's hero photo (600 x 400, 3:2). */
export type PageDrawingName = "services" | "about" | "contact" | "residential" | "commercial" | "glazing";

const delay = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` });
const dashed: CSSProperties = { strokeDasharray: "7 7" };

/**
 * One line that draws itself (hl.css §9, `hl-draw`); `at` is its start in seconds. Over a photo a dark under-stroke
 * (`hl-art-halo`, shown only on `hl-art-photo` drawings) keeps the amber readable on any photo.
 */
function Draw({ points, at, thin }: { points: string; at: number; thin?: boolean }) {
  const thinClass = thin ? " hl-art-thin" : "";
  return (
    <>
      <polyline className={`hl-draw hl-art-halo${thinClass}`} pathLength={1} points={points} style={delay(at)} />
      <polyline className={`hl-draw${thinClass}`} pathLength={1} points={points} style={delay(at)} />
    </>
  );
}

/** Dimensions and other lines that fade in together, under their dark under-stroke. */
function Fade({ at, children }: { at: number; children: ReactNode }) {
  return (
    <g className="hl-draw-fade" style={delay(at)}>
      <g className="hl-art-halo">{children}</g>
      {children}
    </g>
  );
}

/** A dimension line with a slanted tick across each end, as on a drawing set; it fades in with the other dimensions. */
function Dimension({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const tick = (x: number, y: number) => `${x - 6},${y + 6} ${x + 6},${y - 6}`;
  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <polyline points={tick(x1, y1)} />
      <polyline points={tick(x2, y2)} />
    </>
  );
}

function Services() {
  return (
    <>
      {/* A house, a braced frame and a window wall: the three services, small in the photo's top left. */}
      <g transform="translate(26 28) scale(0.42)" style={{ "--hl-art-w": 7 } as CSSProperties}>
        <Draw points="20,250 460,250" at={0.3} />
        <Draw points="30,250 30,170 90,120 150,170 150,250" at={0.6} />
        <Draw points="30,170 150,170" at={0.9} thin />
        <Draw points="180,250 180,130 300,130 300,250" at={1.0} />
        <Draw points="170,130 310,130" at={1.2} />
        <Draw points="180,250 300,130" at={1.3} thin />
        <Draw points="180,130 300,250" at={1.4} thin />
        <Draw points="330,250 330,130 450,130 450,250" at={1.5} />
        <Draw points="370,130 370,250" at={1.7} thin />
        <Draw points="410,130 410,250" at={1.75} thin />
        <Draw points="330,170 450,170" at={1.8} thin />
        <Draw points="330,210 450,210" at={1.85} thin />
      </g>
      <PhotoSpan at={2} />
    </>
  );
}

function About() {
  return (
    <>
      <g>
        <Draw points="150,60 330,60 330,90 255,90 255,210 330,210 330,240 150,240 150,210 225,210 225,90 150,90 150,60" at={0.4} />
      </g>
      <Fade at={1.6}>
        <line x1="240" y1="40" x2="240" y2="262" style={dashed} />
        <line x1="338" y1="60" x2="388" y2="60" style={dashed} />
        <line x1="338" y1="240" x2="388" y2="240" style={dashed} />
        <Dimension x1={380} y1={60} x2={380} y2={240} />
        <line x1="150" y1="248" x2="150" y2="278" style={dashed} />
        <line x1="330" y1="248" x2="330" y2="278" style={dashed} />
        <Dimension x1={150} y1={270} x2={330} y2={270} />
      </Fade>
    </>
  );
}

function Contact() {
  const arrows = [80, 133, 187, 240, 293, 347, 400];
  return (
    <>
      <g>
        <Draw points="40,170 440,170" at={0.4} />
        <Draw points="40,170 24,200 56,200 40,170" at={0.9} />
        <Draw points="440,170 424,200 456,200 440,170" at={1.0} />
        <Draw points="80,90 400,90" at={1.2} thin />
        {arrows.map((x, i) => (
          <g key={x}>
            <Draw points={`${x},90 ${x},158`} at={1.35 + i * 0.07} thin />
            <Draw points={`${x - 6},146 ${x},158 ${x + 6},146`} at={1.5 + i * 0.07} thin />
          </g>
        ))}
      </g>
      <Fade at={2.1}>
        <line x1="40" y1="212" x2="40" y2="240" style={dashed} />
        <line x1="440" y1="212" x2="440" y2="240" style={dashed} />
        <Dimension x1={40} y1={232} x2={440} y2={232} />
      </Fade>
    </>
  );
}

/** A dimension line along the bottom of a photo, shared by the three photo drawings. */
function PhotoSpan({ at }: { at: number }) {
  return (
    <Fade at={at}>
      <line x1="40" y1="350" x2="40" y2="378" style={dashed} />
      <line x1="560" y1="350" x2="560" y2="378" style={dashed} />
      <Dimension x1={40} y1={370} x2={560} y2={370} />
    </Fade>
  );
}

function Residential() {
  return (
    <>
      <g>
        <Draw points="40,160 150,80 260,160" at={0.5} />
        <Draw points="150,80 150,160" at={1.0} thin />
        <Draw points="40,160 260,160" at={1.1} thin />
      </g>
      <PhotoSpan at={1.6} />
    </>
  );
}

function Commercial() {
  return (
    <>
      <g>
        <Draw points="380,70 380,320 560,320 560,70 380,70" at={0.5} />
        <Draw points="380,70 560,320" at={1.1} thin />
        <Draw points="560,70 380,320" at={1.25} thin />
      </g>
      <PhotoSpan at={1.7} />
    </>
  );
}

function Glazing() {
  return (
    <>
      <g>
        <Draw points="470,60 470,320" at={0.5} />
        <path className="hl-draw hl-art-halo hl-art-thin" pathLength={1} d="M470,60 Q530,190 470,320" style={delay(1.1)} />
        <path className="hl-draw hl-art-thin" pathLength={1} d="M470,60 Q530,190 470,320" style={delay(1.1)} />
        <Draw points="410,60 410,320" at={1.3} thin />
        <Draw points="530,60 530,320" at={1.4} thin />
      </g>
      <PhotoSpan at={1.8} />
    </>
  );
}

const drawings: Record<PageDrawingName, { viewBox: string; Art: () => ReactElement }> = {
  services: { viewBox: "0 0 600 400", Art: Services },
  about: { viewBox: "0 0 480 300", Art: About },
  contact: { viewBox: "0 0 480 300", Art: Contact },
  residential: { viewBox: "0 0 600 400", Art: Residential },
  commercial: { viewBox: "0 0 600 400", Art: Commercial },
  glazing: { viewBox: "0 0 600 400", Art: Glazing },
};

/**
 * The one drawing on an inner page (docs/STYLE-GUIDE.md §9): amber line work that draws itself when the page loads, in
 * the home hero's own timing (`hl-draw`, `hl-draw-fade`), then holds still. Decorative and label-free, so it is hidden
 * from assistive technology and adds no copy. Its box has the viewBox's aspect ratio from the first paint, so nothing
 * shifts. Without motion or without CSS animation support the finished drawing shows.
 */
export function PageDrawing({ name, className = "" }: { name: PageDrawingName; className?: string }) {
  // The four photo drawings always lie over the photo's box (the parent is `relative`); the other two take their size from `className`.
  const photo = name !== "about" && name !== "contact";
  const box = photo ? "pointer-events-none absolute inset-0 h-full w-full" : "h-auto w-full";
  const { viewBox, Art } = drawings[name];
  return (
    <svg viewBox={viewBox} aria-hidden="true" focusable="false" className={`hl-art ${photo ? "hl-art-photo " : ""}${box} ${className}`}>
      <Art />
    </svg>
  );
}
