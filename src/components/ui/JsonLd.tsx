import { serializeJsonLd } from "@/lib/serialize-jsonld";

/**
 * The only place `dangerouslySetInnerHTML` is allowed: JSON-LD must be emitted as raw JSON text.
 * The payload is built from static objects in this repo, and "<" is escaped so it can never close the script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
