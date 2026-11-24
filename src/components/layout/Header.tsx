import { Container } from "@/components/hl/Container";
import { HeaderNav } from "./HeaderNav";
import { Logo } from "./Logo";

/** Sticky site header: logo on the left, the page links on the right. */
export function Header() {
  return (
    <header className="hl-header sticky top-0 z-40">
      <Container className="grid grid-cols-[auto_1fr] items-center">
        <div className="flex h-[60px] items-center md:h-[72px]">
          <Logo />
        </div>
        <HeaderNav />
      </Container>
    </header>
  );
}
