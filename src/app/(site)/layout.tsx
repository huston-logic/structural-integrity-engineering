import { SiteChrome } from "@/components/layout/SiteChrome";

/** Every page with the site header and footer. The root layout holds the document shell. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
