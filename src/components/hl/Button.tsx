import { Text } from "@/components/ui/Text";
import { HlLink } from "./HlLink";

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "default" | "compact";

type ButtonStyle = { variant?: ButtonVariant; size?: ButtonSize; fullWidthOnMobile?: boolean };

const base = "inline-flex items-center justify-center rounded-pill text-center font-bold transition-colors";
const variants: Record<ButtonVariant, string> = {
  /** Amber pill, night label (8.5:1). The one action that matters on a screen. */
  primary: "bg-amber text-night hover:bg-amber-lit",
  /** Outlined pill: mist outline and snow label, both turning amber on hover. For a second, quieter action. */
  secondary: "border-btn border-mist text-snow hover:border-amber hover:text-amber",
};
const sizes: Record<ButtonSize, string> = {
  default: "min-h-13.5 px-7.5 text-btn",
  /** The header's Request a quote: still a 44px target. */
  compact: "min-h-11 px-5 text-label leading-none",
};

/**
 * The button classes (docs/STYLE-GUIDE.md §7.10), for a link (Button) or a real <button> such as the form's submit.
 * Focus shows the amber ring from globals.css, which follows the pill shape.
 */
export function buttonClass({ variant = "primary", size = "default", fullWidthOnMobile = false }: ButtonStyle = {}) {
  return `${base} ${variants[variant]} ${sizes[size]} ${fullWidthOnMobile ? "w-full md:w-auto" : ""}`;
}

type ButtonProps = ButtonStyle & {
  href: string;
  /** The label exactly as written in the copy. */
  children: string;
  className?: string;
  onClick?: () => void;
};

/** A link that looks like a button: primary (amber) or secondary (outlined). */
export function Button({ href, children, variant, size, fullWidthOnMobile, className = "", onClick }: ButtonProps) {
  return (
    <HlLink href={href} onClick={onClick} className={`${buttonClass({ variant, size, fullWidthOnMobile })} ${className}`}>
      <Text>{children}</Text>
    </HlLink>
  );
}
