import { Text } from "@/components/ui/Text";
import { CellDividers } from "./CellDividers";
import { FadingDivider } from "./FadingDivider";
import { Section } from "./Section";

type HowWeWorkProps = {
  heading: string;
  steps: readonly { title: string; body: string }[];
  where: { heading: string; body: string };
  headingId: string;
};

/** The numbered steps (the one real sequence on the site), then "Where we work" under a divider in the same column grid as the sections around it. */
export function HowWeWork({ heading, steps, where, headingId }: HowWeWorkProps) {
  const whereId = `${headingId}-where`;
  return (
    <Section tone="dusk" labelledBy={headingId}>
      <h2 id={headingId} className="max-w-em-22 text-h2">
        <Text>{heading}</Text>
      </h2>
      <ol role="list" className="mt-12 grid list-none gap-x-12 gap-y-14 md:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step.title} className="relative flex gap-4 md:gap-6">
            <span aria-hidden="true" className="w-step-number shrink-0 text-h2 font-light leading-none text-amber md:w-step-number-md">
              {index + 1}
            </span>
            <div>
              <h3 className="text-h4 font-semibold">
                <Text>{step.title}</Text>
              </h3>
              <p className="mt-2 text-small text-mist">
                <Text>{step.body}</Text>
              </p>
            </div>
            <CellDividers index={index} total={steps.length} md={2} />
          </li>
        ))}
      </ol>
      <FadingDivider className="mt-20" />
      {/* The same heading column as the SplitSections around it. */}
      <div className="mt-20 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <h2 id={whereId} className="max-w-em-12 text-h2">
          <Text>{where.heading}</Text>
        </h2>
        <p className="max-w-em-40 text-body text-mist lg:pt-3">
          <Text>{where.body}</Text>
        </p>
      </div>
    </Section>
  );
}
