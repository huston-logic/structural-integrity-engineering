type HeroDrawingProps = {
  labels: { cantilever: string; clearSpan: string; wind: string };
};

/** The class that starts an element `seconds` into the drawing (hl.css: draw-at-N, N in hundredths of a second). */
const at = (seconds: number) => `draw-at-${Math.round(seconds * 100)}`;

/** One wind arrow pointing left at the house, `y` in photo pixels. */
function WindArrow({ y, start }: { y: number; start: number }) {
  return (
    <g className={`hl-draw-push ${at(start)}`}>
      <line className="hl-ln" x1="1960" y1={y} x2="1700" y2={y} />
      <polyline className="hl-ln" points={`1724,${y - 16} 1700,${y} 1724,${y + 16}`} />
    </g>
  );
}

/**
 * The amber line drawing over the home photo (option G reference, coordinates copied exactly). The viewBox is the
 * photo's own pixel grid (dusk-home.jpg, 2000 x 2499), so it must sit in the same box as the photo. Decorative: the
 * labels repeat what the photo shows, so the whole drawing is hidden from assistive technology. The roof line, the floor
 * line and the columns draw themselves, then the dimension lines fade in, the wind arrows push in and the labels appear
 * (hl.css §9). The wind arrows and their label are left out of the phone crop (`hl-hero-wide`).
 */
export function HeroDrawing({ labels }: HeroDrawingProps) {
  return (
    <svg viewBox="0 0 2000 2499" aria-hidden="true" focusable="false">
      <g className="hl-lines">
        <polyline className={`hl-draw hl-ln ${at(0.4)}`} pathLength={1} points="95,1551 114,1044 1205,940 1997,1489" />
        <polyline className={`hl-draw hl-ln ${at(0.9)}`} pathLength={1} points="95,1551 1213,1532 1612,1661" />
        <line className={`hl-draw hl-thin ${at(1.2)}`} pathLength={1} x1="95" y1="1493" x2="1141" y2="1443" />
        <line className={`hl-draw hl-ln ${at(1.5)}`} pathLength={1} x1="232" y1="1580" x2="232" y2="1840" />
        <line className={`hl-draw hl-ln ${at(1.55)}`} pathLength={1} x1="300" y1="1580" x2="300" y2="1840" />
        <line className={`hl-draw hl-ln ${at(1.6)}`} pathLength={1} x1="1217" y1="1548" x2="1217" y2="1822" />
      </g>
      <g className={`hl-draw-fade hl-lines ${at(2)}`}>
        <line className="hl-thin hl-dash-10" x1="300" y1="1850" x2="300" y2="1960" />
        <line className="hl-thin hl-dash-10" x1="1217" y1="1832" x2="1217" y2="1960" />
        <line className="hl-ln" x1="300" y1="1938" x2="1217" y2="1938" />
        <line className="hl-ln" x1="288" y1="1950" x2="312" y2="1926" />
        <line className="hl-ln" x1="1205" y1="1950" x2="1229" y2="1926" />
        <line className="hl-ln" x1="95" y1="1610" x2="232" y2="1610" />
        <line className="hl-ln" x1="83" y1="1622" x2="107" y2="1598" />
        <line className="hl-ln" x1="220" y1="1622" x2="244" y2="1598" />
      </g>
      <g className="hl-hero-wide hl-lines">
        <WindArrow y={1040} start={2.4} />
        <WindArrow y={1100} start={2.5} />
        <WindArrow y={1160} start={2.6} />
      </g>
      <g className={`hl-draw-fade ${at(2.7)}`}>
        <text className="hl-lbl" x="758" y="1912" textAnchor="middle">
          {labels.clearSpan}
        </text>
        <text className="hl-lbl" x="95" y="1676">
          {labels.cantilever}
        </text>
        <text className="hl-lbl hl-hero-wide" x="1830" y="1004" textAnchor="middle">
          {labels.wind}
        </text>
      </g>
    </svg>
  );
}
