import { Container } from "@/components/hl/Container";
import { TextLink } from "@/components/hl/TextLink";
import { Text } from "@/components/ui/Text";
import { footerLinks, privacyLink } from "@/content/nav";
import { footer } from "@/content/shared";
import { siteConfig } from "@/content/site";
import { settingUrl } from "@/lib/optional-setting";
import { telHref } from "@/lib/phone";
import { Logo } from "./Logo";

/**
 * Site footer (copy deck, "Footer"): the menu links, email, phone, "Build smarter. Build faster." and the copyright
 * line, on deep teal under the dusk contact band.
 */
export function Footer() {
  const linkedIn = settingUrl(siteConfig.linkedInUrl);
  const tel = telHref(siteConfig.phone);
  return (
    <footer className="bg-dusk-deep">
      <Container className="pb-10 pt-20 md:pt-24">
        <div className="grid gap-x-12 gap-y-14 md:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
          <div className="md:col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-6 max-w-[12em] text-h3 font-medium">
              <Text>{footer.line}</Text>
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="space-y-1">
              {footerLinks.map((item) => (
                <li key={item.href}>
                  <TextLink href={item.href}>{item.label}</TextLink>
                  {item.children ? (
                    <ul className="mb-2 border-l border-rule pl-4">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <TextLink href={child.href} muted>
                            {child.label}
                          </TextLink>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>

          <ul className="space-y-1">
            {siteConfig.email ? (
              <li>
                <TextLink href={`mailto:${siteConfig.email}`} className="break-words [overflow-wrap:anywhere]">
                  {siteConfig.email}
                </TextLink>
              </li>
            ) : null}
            {tel ? (
              <li>
                <TextLink href={tel}>{siteConfig.phone}</TextLink>
              </li>
            ) : null}
            {linkedIn ? (
              <li>
                <TextLink href={linkedIn}>LinkedIn</TextLink>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="mt-16 flex flex-col-reverse gap-2 border-t border-rule pt-6 text-fine text-mist sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {siteConfig.copyrightYear} <Text>{siteConfig.legalName}</Text>
          </p>
          <TextLink href={privacyLink.href} inline className="inline-flex min-h-11 items-center">
            {privacyLink.label}
          </TextLink>
        </div>
      </Container>
    </footer>
  );
}
