import type { Metadata } from "next";
import { Button } from "@/components/hl/Button";
import { Container } from "@/components/hl/Container";
import { ContactForm } from "@/components/hl/ContactForm";
import { PageHero } from "@/components/hl/PageHero";
import { TextLink } from "@/components/hl/TextLink";
import { Text } from "@/components/ui/Text";
import { contactHero, contactMeta, scheduler, whatHappensNext } from "@/content/contact";
import { siteConfig } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";
import { NONE } from "@/lib/optional-setting";

export const metadata: Metadata = pageMetadata({ ...contactMeta, path: "/contact-us" });

const h2 = "text-[28px] font-semibold leading-tight tracking-[-0.02em]";

/** Contact: the scheduler column, the note form, then what happens next. */
export default function ContactPage() {
  const noScheduler = siteConfig.schedulerUrl === NONE;
  return (
    <div className="relative overflow-x-clip">
      <PageHero eyebrow={contactHero.eyebrow} title={contactHero.title} intro={contactHero.intro} />

      <section className="pb-12 md:pb-16">
        <Container
          className={`grid items-start gap-12 min-[900px]:gap-12 ${noScheduler ? "" : "min-[900px]:grid-cols-[5fr_7fr]"}`}
        >
          {noScheduler ? null : (
          <div id="book" className="scroll-mt-24">
            <h2 className={h2}>
              <Text>{scheduler.heading}</Text>
            </h2>
            <p className="mt-4 max-w-[48ch] text-body">
              <Text>{scheduler.body}</Text>
            </p>
            <div className="mt-6">
              {siteConfig.schedulerUrl ? (
                <Button href={siteConfig.schedulerUrl} fullWidthOnMobile>
                  {scheduler.buttonLabel}
                </Button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-[54px] w-full cursor-not-allowed items-center justify-center rounded-pill border-[1.5px] border-mist px-[30px] text-btn font-bold text-mist md:w-auto"
                  >
                    {scheduler.buttonLabel}
                  </button>
                  <p className="mt-4 text-small">
                    <Text>{scheduler.placeholder}</Text>
                  </p>
                </>
              )}
            </div>
          </div>
          )}
          <ContactForm />
        </Container>
      </section>

      <section aria-labelledby="next-title" className="py-12 md:py-16">
        <Container>
          <h2 id="next-title" className="text-h2">
            <Text>{whatHappensNext.heading}</Text>
          </h2>
          <ol className="mt-8 max-w-[64ch] space-y-5 text-[17px] leading-[1.55]">
            {whatHappensNext.steps.map((step, index) => (
              <li key={step.lead} className="flex gap-4">
                <span aria-hidden="true" className="w-6 shrink-0 text-h4 font-semibold text-amber">
                  {index + 1}
                </span>
                <span>
                  <strong>
                    <Text>{step.lead}</Text>
                  </strong>{" "}
                  <Text>{step.body}</Text>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-8 flex flex-wrap items-center gap-x-2 text-[17px]">
            <Text>{whatHappensNext.emailLabel}</Text>{" "}
            {siteConfig.email ? (
              <TextLink inline href={`mailto:${siteConfig.email}`}>
                {siteConfig.email}
              </TextLink>
            ) : null}
          </p>
        </Container>
      </section>
    </div>
  );
}
