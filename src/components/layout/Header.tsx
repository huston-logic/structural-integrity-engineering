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
        {/* --hl-header-h (64px, 84px from lg) is the header's height; the home hero slides up under it (hl.css §5). */}
        <div className="flex min-h-(--hl-header-h) items-center py-2">
          <Logo />
        </div>
        <HeaderNav />
      </Container>
    </header>
  );
}
