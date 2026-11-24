import type { ReactNode } from "react";
import { Text } from "@/components/ui/Text";
import { Container } from "./Container";
import { Glow } from "./Glow";

type ClosingCtaProps = {
  /** The heading text. */
  heading: string;
  body?: string;
  /** The action (a Button, optionally followed by a TextLink). */
  children: ReactNode;
  /** The microcopy line under the action. */
  note?: string;
};

/** Closing call to action: not a band; a seam glow blends it into the page. Left-aligned. */
export function ClosingCta({ heading, body, children, note }: ClosingCtaProps) {
  return (
    <section className="relative py-16 md:py-24">
      <Glow variant="seam" className="left-1/2 top-[-260px] -ml-[650px]" />
      <Container className="relative z-10">
        <h2 className="max-w-[17em] font-ui text-h2 font-bold">
          <Text>{heading}</Text>
        </h2>
        {body ? (
          <p className="mt-4 max-w-[60ch] text-blurb">
            <Text>{body}</Text>
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">{children}</div>
        {note ? (
          <p className="mt-6 text-[15px] text-ink-2">
            <Text>{note}</Text>
          </p>
        ) : null}
      </Container>
    </section>
  );
}
