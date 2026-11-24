import type { Metadata } from "next";
import { ServicePage } from "@/components/hl/ServicePage";
import { commercialPage } from "@/content/service-pages";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  ...commercialPage.meta,
  path: "/services/low-rise-commercial-structural-design",
});

export default function CommercialPage() {
  return <ServicePage page={commercialPage} />;
}
