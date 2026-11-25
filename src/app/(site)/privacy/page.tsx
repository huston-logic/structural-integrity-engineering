import type { Metadata } from "next";
import { Container } from "@/components/hl/Container";
import { PageHero } from "@/components/hl/PageHero";
import { Text } from "@/components/ui/Text";
import { privacy, privacyMeta } from "@/content/privacy";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...privacyMeta, path: "/privacy" });

/** The privacy policy: short, plain sections in src/content/privacy.ts. */
export default function PrivacyPage() {
  return (
    <div className="relative overflow-x-clip">
      <PageHero title={privacy.heading} intro={privacy.intro} />
      <section className="pb-16 md:pb-24">
        <Container>
          <div className="max-w-[64ch] space-y-8 text-body">
            {privacy.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-h3">{section.heading}</h2>
                <p className="mt-3">
                  <Text>{section.body}</Text>
                </p>
              </div>
            ))}
            <p>
              <Text>{privacy.lastUpdated}</Text>
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}
