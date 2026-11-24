// Copy shared by every page (copy deck, Home: "Contact band (ends every page)" and "Footer"). The phone number, email
// and company name come from site.config.ts.

/** The contact band at the end of every page (ContactBand). Its button is `requestQuote` in nav.ts. */
export const contactBand = {
  heading: "Ready to get started?",
  body: "Quick replies, clean drawings, and fair pricing.",
  /**
   * Optional background photo (copy deck: dusk-home-wide.jpg, a crop of the home photo; this is its 1200px, heavily
   * compressed copy, since it sits under an 88% dusk wash). A site path under public/images/ with its pixel size; null
   * shows the plain dusk band. Decorative, so it has no alt text. It loads lazily and is never on the first screen.
   */
  photo: { src: "/images/dusk-home-wide-1200.jpg", width: 1200, height: 750 } as {
    src: string;
    width: number;
    height: number;
  } | null,
};

export const footer = {
  /** Dylan's own line, kept word for word. */
  line: "Build smarter. Build faster.",
};
