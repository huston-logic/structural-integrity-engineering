"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 1400;
/** How much of the figure must be in view before it counts. */
const VISIBLE = 0.6;
// Close to the reference's cubic-bezier(.2,.7,.2,1): fast start, long settle.
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** The figure's width in digits, as min-w-ch-N classes (written out so Tailwind sees them). */
const MIN_WIDTH = ["min-w-ch-1", "min-w-ch-2", "min-w-ch-3", "min-w-ch-4"] as const;

/**
 * A figure that counts up from 0 the first time it scrolls into view (option G reference). The real value is in the
 * HTML twice: visually hidden for screen readers, and as the visible figure, which is what shows without JavaScript,
 * under reduced motion and when the figure is already on screen as the page loads. Only a figure below the fold is
 * reset to 0 (out of sight) and counted up when it enters the viewport.
 */
export function CountUp({ value, className = "" }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let first = true;
    const count = () => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / DURATION_MS, 1);
        setShown(Math.round(easeOut(t) * value));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (first) {
          first = false;
          if (entry.isIntersecting) {
            observer.disconnect();
            return;
          }
          setShown(0);
          return;
        }
        if (entry.intersectionRatio >= VISIBLE) {
          observer.disconnect();
          count();
        }
      },
      { threshold: VISIBLE },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <>
      <span className="sr-only">{value}</span>
      {/* Held at the final value's width (tabular digits are 1ch), so nothing beside it moves while it counts. */}
      <span
        ref={ref}
        aria-hidden="true"
        className={`inline-block tabular-nums ${MIN_WIDTH[Math.min(String(value).length, MIN_WIDTH.length) - 1]} ${className}`}
      >
        {shown}
      </span>
    </>
  );
}
