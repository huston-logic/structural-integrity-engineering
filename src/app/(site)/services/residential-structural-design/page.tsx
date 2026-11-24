import type { Metadata } from "next";
import { ServicePage } from "@/components/hl/ServicePage";
import { residentialPage } from "@/content/service-pages";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  ...residentialPage.meta,
  path: "/services/residential-structural-design",
});

export default function ResidentialPage() {
  return <ServicePage page={residentialPage} />;
}
