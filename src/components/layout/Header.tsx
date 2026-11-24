import { Container } from "@/components/hl/Container";
import { HeaderNav } from "./HeaderNav";
import { Logo } from "./Logo";

/**
 * Sticky site header: the wordmark on the left, the menu on the right. Solid dusk, the color of the home photo's sky,
 * so on the home page it reads as part of the hero.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-dusk">
      <Container className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6">
        <div className="flex min-h-16 items-center py-2 lg:min-h-[84px]">
          <Logo />
        </div>
        <HeaderNav />
      </Container>
    </header>
  );
}
