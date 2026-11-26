import { Text } from "@/components/ui/Text";
import { Section } from "./Section";

/** One large statement on a deep band (About: what the practice is). */
export function Statement({ text }: { text: string }) {
  return (
    <Section tone="deep">
      <p className="max-w-em-34 text-h3 font-normal leading-snug">
        <Text>{text}</Text>
      </p>
    </Section>
  );
}
