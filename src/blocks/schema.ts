// Block schema: what a block is, what fields it takes and how a page file is shaped. Import-free (plain Node and Next
// both load it), so no aliases, enums or parameter properties. Content types are inferred from the field schema, so a
// component's props and the content check can never disagree.

export const MENU_PLACES = ["header", "footer", "legal"] as const;
export type MenuPlace = (typeof MENU_PLACES)[number];

/**
 * The contact page and its thanks page. The one place these two addresses are written: this site keeps the addresses of
 * its old website (docs/SITE-DIFFERENCES.md, D1), the template uses /contact and /contact/thanks.
 */
export const CONTACT_PATH = "/contact-us";
export const THANKS_PATH = "/contact-us/thanks";

/** Paths a page may not take: routes the site already owns. */
export const RESERVED_PATHS = ["/blocks", "/api", THANKS_PATH, "/og.png", "/icon.svg", "/sitemap.xml", "/robots.txt", "/404", "/index", "/_not-found", "/_next"] as const;
/** Pages that must exist and be live: the booking fallback and the form live on the contact page. */
export const REQUIRED_LIVE = ["/", CONTACT_PATH] as const;
/** The site's booking link (the scheduler, else the contact page's #book). */
export const BOOKING_LINK = "@booking";

/** Alt text that says nothing. Same entries as `genericAltText` in scripts/change-scope-rules.mjs (a test keeps them equal). */
export const GENERIC_ALT_WORDS = [
  "image",
  "img",
  "photo",
  "picture",
  "graphic",
  "icon",
  "logo",
  "alt",
  "alt text",
  "todo",
  "tbd",
  "untitled",
  "placeholder",
];

/** The shapes an image slot can have (width:height). Each image field names one; the picture is cropped to it. */
export const IMAGE_SHAPES = ["3:2", "4:3", "4:5", "1:1", "16:9"] as const;
export type ImageShape = (typeof IMAGE_SHAPES)[number];
/** Where a cropped picture keeps its focus. */
export const IMAGE_FOCUS = ["center", "top", "bottom", "left", "right"] as const;
export type ImageFocus = (typeof IMAGE_FOCUS)[number];
/** A PDF a link may point to: /files/<lowercase words and digits joined by hyphens>.pdf */
export const FILE_LINK_RE = /^\/files\/[a-z0-9]+(?:-[a-z0-9]+)*\.pdf$/;

type FieldBase = { label: string; help?: string };
/** A field is required unless it says `required: false`. */
type Optionality = { required?: boolean };

export type TextField = FieldBase & Optionality & { kind: "text"; max: number; min?: number };
export type LinkField = FieldBase & Optionality & { kind: "link" };
export type ActionField = FieldBase & Optionality & { kind: "action"; labelMax: number };
export type ImageField = FieldBase & Optionality & { kind: "image"; shape: ImageShape };
export type VideoField = FieldBase & Optionality & { kind: "video" };
export type BooleanField = FieldBase & Optionality & { kind: "boolean" };
export type ChoiceField = FieldBase & Optionality & { kind: "choice"; options: readonly string[] };
export type ListField = FieldBase & Optionality & {
  kind: "list";
  of: Field;
  min: number;
  max: number;
  /** Optional fields of the list's items that every item gives or none does (for example a photo on every idea). */
  together?: readonly string[];
};
export type ObjectField = FieldBase & Optionality & { kind: "object"; fields: Fields };

export type Field = TextField | LinkField | ActionField | ImageField | VideoField | BooleanField | ChoiceField | ListField | ObjectField;
export type Fields = { readonly [name: string]: Field };

type Simplify<T> = { [K in keyof T]: T[K] } & {};
type RequiredKeys<F> = { [K in keyof F]: F[K] extends { required: false } ? never : K }[keyof F];
type OptionalKeys<F> = { [K in keyof F]: F[K] extends { required: false } ? K : never }[keyof F];

type ValueOf<T> = T extends { kind: "text" | "link" | "video" }
  ? string
  : T extends { kind: "action" }
    ? { label: string; href: string }
    : T extends { kind: "image" }
      ? { src: string; alt: string; focus?: ImageFocus }
      : T extends { kind: "boolean" }
        ? boolean
        : T extends { kind: "choice"; options: infer O extends readonly string[] }
          ? O[number]
          : T extends { kind: "list"; of: infer I }
            ? ValueOf<I>[]
            : T extends { kind: "object"; fields: infer G extends Fields }
              ? ContentOf<G>
              : never;

/** The content a block holds, inferred from its fields: required fields are plain, optional ones are `?`. */
export type ContentOf<F extends Fields> = Simplify<{ [K in RequiredKeys<F>]: ValueOf<F[K]> } & { [K in OptionalKeys<F>]?: ValueOf<F[K]> }>;

export type Placement = {
  position: "first" | "last" | "any";
  maxPerPage: number;
  /** "none": the block's own component carries its spacing (this site's bands; docs/SITE-DIFFERENCES.md, D4). */
  rhythm: "hero" | "section" | "compact" | "none";
  joinsHero?: boolean;
};

export type Motion = ({ entrance: "default" } | { entrance: "none"; reason: string }) & {
  /** The page's one focal animation: names an @keyframes hl-signature-<keyframes> in hl.css. */
  signature?: { keyframes: string; reason: string };
};

export type Variant = { name: string; description: string };

export type BlockDefinition<F extends Fields = Fields> = {
  type: string;
  title: string;
  description: string;
  source: "library" | "site";
  fields: F;
  variants: readonly Variant[];
  placement: Placement;
  motion: Motion;
  fixedAnchor?: string;
  /** Why the block needs client JavaScript; required when its folder holds a "use client" file. */
  interactive?: string;
  example: ContentOf<F>;
};

/** A definition of any block, as the registry and the check see it. */
export type AnyBlockDefinition = Omit<BlockDefinition, "example"> & { example: unknown };

/** Declares a block. The `const` parameter keeps the field schema exact so `ContentOf` can read it. */
export function defineBlock<const F extends Fields>(definition: BlockDefinition<F>): BlockDefinition<F> {
  return definition;
}

export type BlockInstance = {
  type: string;
  variant?: string;
  anchor?: string;
  content: Record<string, unknown>;
};

export type PageMenu = { label: string; order: number; places: readonly MenuPlace[] };

export type PageData = {
  path: string;
  title: string;
  description: string;
  status: "live" | "archived";
  menu?: PageMenu;
  blocks: BlockInstance[];
};

/**
 * The path a page file holds: `home.json` is `/`, `about-us.json` is `/about-us`, and a `--` in the name is a `/` in the
 * path (`services--glazing.json` is `/services/glazing`). A slug never holds `--`, so the two directions are exact.
 */
export function pathForFile(file: string): string {
  const name = file.replace(/^.*\//, "").replace(/\.json$/, "");
  return name === "home" ? "/" : `/${name.replaceAll("--", "/")}`;
}

/** The file name for a path: `/` is `home.json`, `/about-us` is `about-us.json`, `/services/glazing` is `services--glazing.json`. */
export function fileForPath(path: string): string {
  return path === "/" ? "home.json" : `${path.slice(1).replaceAll("/", "--")}.json`;
}
