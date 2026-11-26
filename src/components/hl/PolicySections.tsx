import { Text } from "@/components/ui/Text";
import { Container } from "./Container";

type PolicySectionsProps = {
  sections: readonly { heading: string; body: string }[];
  footnote?: string;
};

/** The privacy policy's plain sections, one heading and one paragraph each, in a narrow reading column. */
export function PolicySections({ sections, footnote }: PolicySectionsProps) {
  return (
    <section className="pb-16 md:pb-24">
      <Container>
        <div className="max-w-measure space-y-8 text-body">
          {sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-h3">{section.heading}</h2>
              <p className="mt-3">
                <Text>{section.body}</Text>
              </p>
            </div>
          ))}
          {footnote ? (
            <p>
              <Text>{footnote}</Text>
            </p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
