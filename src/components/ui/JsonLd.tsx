import { serializeJsonLd } from "@/lib/serialize-jsonld";

/**
 * The only place `dangerouslySetInnerHTML` is allowed: JSON-LD must be emitted as raw JSON text.
 * The payload is built from fixed fields in this repo (the site's own settings, and a post's title and dates as the owner
 * wrote them), never from markup, and `serializeJsonLd` escapes "<" so no text can close the script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
