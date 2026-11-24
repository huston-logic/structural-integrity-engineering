import type { Metadata } from "next";
import { ServicePage } from "@/components/hl/ServicePage";
import { glazingPage } from "@/content/service-pages";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  ...glazingPage.meta,
  path: "/services/glazing-and-mullion-engineering",
});

export default function GlazingPage() {
  return <ServicePage page={glazingPage} />;
}
