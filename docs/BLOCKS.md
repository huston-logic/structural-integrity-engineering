# Blocks

<!-- This file is generated. Do not edit it by hand; run `npm run blocks:catalog`. -->

This file is generated from the block library (`src/blocks/` and `src/site-blocks/`). Do not edit it by hand: run
`npm run blocks:catalog`. The same facts for programs are in `docs/blocks.json`. `npm run check:content` fails when
either file is out of date.

A page is one file in `src/content/pages/` with an ordered list of blocks. Each block is a designed section: pick a
type, optionally a variant, and fill in its content.

## Page rules

- **Page file.** One file per page in src/content/pages/. home.json is the home page (/); every other file is named after its path (about-us.json is /about-us); for a path with two levels the / is written as -- (services--glazing.json is /services/glazing). Paths are lowercase words joined by hyphens, one or two levels deep, and each is used once.
- **Page keys.** `path`: "/" or a one-segment path like "/services". Must match the file name. `title`: The page's search-result title, 1 to 70 characters. `description`: The page's search-result description, 1 to 170 characters. `status`: "live" or "archived". `menu` (optional): Where the page appears in the menu: { label, order, places }. `blocks`: The page's sections, in order: at most 20.
- **Menu.** `label`: The words in the menu, 1 to 24 characters. `order`: A number; lower numbers come first. `places`: Any of "header", "footer", "legal". A page appears in the menu only if it has a menu entry. At most 6 live pages may be in the header.
- **Block keys.** `type`: The name of a block in this catalog. `variant` (optional): One of the block's variants; the first is used when it is left out. `anchor` (optional): A lowercase name (letters, digits, hyphens; starts with a letter; at most 40 characters) that links can point to as /page#name. Unique on the page. `content`: The block's fields, as listed in its entry.
- **Status.** `live`: the page is built, listed in the menu places it asks for, and in the sitemap. `archived`: the page leaves the build, the menu and the sitemap. The file and its content stay, and setting it back to live restores it. A link to an archived page fails the check.
- **Required pages.** `/` and `/contact-us` must exist and stay live. Reserved paths no page may take: `/blocks`, `/api`, `/contact-us/thanks`, `/og.png`, `/icon.svg`, `/sitemap.xml`, `/robots.txt`, `/404`, `/index`, `/_not-found`, `/_next`.
- **The first block.** The first block must be a block whose position is "first" (the hero). It carries the page's one H1, so a page has exactly one.
- **Focal animation.** At most one block per page may carry a signature (focal) animation.
- **Length.** At most 20 blocks on a page.
- **Text.** Text is plain. Only **bold** and [[placeholder]] marks are allowed. No HTML tags, no HTML entities, no markdown links and no control characters (line breaks, tabs, hidden characters).
- **Links.** Allowed: An internal path (/name) or a path with an anchor (/name#anchor) that points to a live page, and to an anchor that exists on it. An https:// address. A mailto: address. A tel: number. "@booking": the site's booking link (the scheduler when set, otherwise /contact-us#book). Never: `javascript:`, `data:`, `http:`, `//host`, or any other kind of address (a `//host` address has no scheme).
- **Images.** An image is { src, alt } with an optional focus: center, top, bottom, left or right. The file must exist under /images/ and be a jpg, png or webp. Each image slot has a shape (3:2, 4:3, 4:5, 1:1 or 16:9) and the picture is cropped to it; focus says which part to keep. The alt text must really describe the picture, so it can't be empty or only a generic word. Formats: jpg, png, webp. Alt text that is only one of these words is rejected: image, img, photo, picture, graphic, icon, logo, alt, alt text, todo, tbd, untitled, placeholder.
- **Files.** A link may point to a PDF under /files/ that exists, such as /files/price-sheet-k3x9q2mz.pdf. Visitors download it.
- **Video.** A video address must be from YouTube or Vimeo. The player is rebuilt from the video's id, not from the address that was pasted. Allowed player origins: https://www.youtube-nocookie.com, https://player.vimeo.com.

## Hero (`hero`)

The top of a page: a small line above, the page headline, a short introduction and, if wanted, one button.

**Where it can go:** first on the page, once.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Left-aligned, with a soft glow in the top-right corner.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `eyebrow` | Small line above the headline | no | up to 60 characters |
| `title` | Headline. The page's one main heading. | yes | up to 90 characters |
| `intro` | Introduction | no | up to 320 characters |
| `action` | Button | no | button words up to 40 characters, and a link |

**Motion:** No entrance motion. The first block is the first paint, so it shows at once and never waits on motion.

**Example:**

```json
{
  "eyebrow": "A short line that sets the scene",
  "title": "A headline that says what this page is about",
  "intro": "One or two sentences that say more about the page.",
  "action": {
    "label": "A label that says what the button does",
    "href": "@booking"
  }
}
```

## Highlights (`highlights`)

A heading and a set of short ideas, each with a title and a few lines of text, and optionally a photo above each. Good for services, reasons or features.

**Where it can go:** anywhere, up to 3 times.

**Variants** (set with `variant`; the first is used when it is left out):

- `two-column` (default): The ideas sit in two columns (one column on phones), with soft dividers.
- `three-column`: The ideas sit in three columns on wide screens (with three or more ideas), two on tablets, one on phones.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 90 characters |
| `items` | Ideas | yes | 2 to 9 items (give every item image, or none) |
| `items[].title` | Title | yes | up to 70 characters |
| `items[].body` | Text | yes | up to 280 characters |
| `items[].image` | Photo. Cropped to a 3 by 2 shape. Give every idea a photo, or none. | no | a picture under /images/ with real alt text, shape 3:2 |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that says what this section covers",
  "items": [
    {
      "title": "A short title for the first idea",
      "body": "A sentence or two that explains the first idea in plain words."
    },
    {
      "title": "A short title for the second idea",
      "body": "A sentence or two that explains the second idea in plain words."
    },
    {
      "title": "A short title for the third idea",
      "body": "A sentence or two that explains the third idea in plain words."
    }
  ]
}
```

## Text section (`prose`)

A heading with a few paragraphs under it. Good for a story, a background or a longer explanation.

**Where it can go:** anywhere, up to 4 times; it sits close under the hero.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Paragraphs in a comfortable reading width.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 90 characters |
| `paragraphs` | Paragraphs | yes | 1 to 8 items, each up to 900 characters |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that says what this section covers",
  "paragraphs": [
    "A paragraph of plain text that describes itself.",
    "A second paragraph, also plain text, that continues the thought."
  ]
}
```

## Questions and answers (`faq`)

A heading and a list of questions that open to show their answers.

**Where it can go:** anywhere, once.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Questions open and close one by one; works without JavaScript.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 90 characters |
| `items` | Questions | yes | 1 to 12 items |
| `items[].question` | Question | yes | up to 140 characters |
| `items[].answer` | Answer | yes | up to 900 characters |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that introduces the questions",
  "items": [
    {
      "question": "A question a visitor might ask?",
      "answer": "A plain answer that describes itself."
    },
    {
      "question": "Another question a visitor might ask?",
      "answer": "A second plain answer."
    }
  ]
}
```

## Closing call to action (`closing-cta`)

The last block on a page: a heading, a line of text and one button that says what to do next.

**Where it can go:** last on the page, once.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Left-aligned, with a soft glow that blends it into the page.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 90 characters |
| `body` | Text | no | up to 280 characters |
| `action` | Button | yes | button words up to 40 characters, and a link |
| `note` | Small note under the button | no | up to 160 characters |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that invites the next step",
  "body": "One or two plain sentences that say what happens next.",
  "action": {
    "label": "A label that says what the button does",
    "href": "/contact-us"
  },
  "note": "A small reassuring line"
}
```

## Contact form (`contact-form`)

A booking column next to the site's contact form. The form itself is wired to the site's own settings.

**Where it can go:** anywhere, once; it sits close under the hero.

**Fixed anchor:** `#book` (links can point to it; it cannot be changed).

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): The booking column on the left, the form on the right (stacked on phones).

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Booking heading | yes | up to 60 characters |
| `body` | Booking text | yes | up to 400 characters |
| `buttonLabel` | Booking button label | yes | up to 40 characters |
| `unsetNote` | Note shown while no booking link is set. Visitors see this instead of a working button until the site's booking link is set up. | yes | up to 120 characters |

**Motion:** No entrance motion. People type here, so the form stays still and is usable the moment it appears.

**Example:**

```json
{
  "heading": "A short heading about booking a time",
  "body": "A sentence or two that says what a booking is for.",
  "buttonLabel": "A label that says what the button does",
  "unsetNote": "A note that says the booking link is not set up yet"
}
```

## Numbered steps (`steps`)

A heading and a short numbered list that says what happens, step by step. It can end with an email line.

**Where it can go:** anywhere, up to 2 times.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Numbers in green on the left, text in a comfortable reading width.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 90 characters |
| `steps` | Steps | yes | 2 to 6 items |
| `steps[].lead` | Bold opening words | yes | up to 80 characters |
| `steps[].body` | Text | yes | up to 400 characters |
| `emailLabel` | Words before the email address. When given, the line shows the site's email address after these words. | no | up to 80 characters |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that says what happens next",
  "steps": [
    {
      "lead": "The first step.",
      "body": "A sentence that describes the first step."
    },
    {
      "lead": "The second step.",
      "body": "A sentence that describes the second step."
    }
  ]
}
```

## Policy sections (`legal-sections`)

A run of titled sections for a policy or terms page, with an optional line at the end such as a last-updated date.

**Where it can go:** anywhere, once; it sits close under the hero.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Sections one after another in a comfortable reading width.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `sections` | Sections | yes | 1 to 20 items |
| `sections[].heading` | Section title | yes | up to 90 characters |
| `sections[].body` | Section text | yes | up to 3000 characters |
| `footnote` | Line at the end | no | up to 160 characters |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "sections": [
    {
      "heading": "A short title for the first section",
      "body": "Plain text that describes what this section covers."
    },
    {
      "heading": "A short title for the second section",
      "body": "More plain text for the second section."
    }
  ],
  "footnote": "A short line at the end of the page"
}
```

## Video (`video`)

One video from YouTube or Vimeo, with a title and a short caption. It plays on the page when a visitor presses play.

**Where it can go:** anywhere, up to 4 times.

**Needs JavaScript:** The play button swaps in the player only when it is pressed, so nothing loads from YouTube or Vimeo before that.

**Variants** (set with `variant`; the first is used when it is left out):

- `wide` (default): As wide as the page column.
- `inset`: Narrower and centered, the width of a reading column.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `url` | Video address. A YouTube or Vimeo address. | yes | a YouTube or Vimeo address |
| `title` | Title | yes | up to 80 characters |
| `caption` | Caption | no | up to 200 characters |
| `poster` | Cover picture. Shown before play. Without one the video shows a plain dark panel. | no | a picture under /images/ with real alt text, shape 16:9 |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  "title": "A short title that says what the video shows",
  "caption": "A sentence that says what to expect before pressing play."
}
```

## Video grid (`video-grid`)

Two to six videos from YouTube or Vimeo side by side, each with a title and a short caption.

**Where it can go:** anywhere, up to 2 times.

**Needs JavaScript:** The play button swaps in the player only when it is pressed, so nothing loads from YouTube or Vimeo before that.

**Variants** (set with `variant`; the first is used when it is left out):

- `two-column` (default): The videos sit in two columns (one column on phones).
- `three-column`: The videos sit in three columns on wide screens (with three or more videos), two on tablets, one on phones.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading. Names the group of videos for everyone, including screen reader users. | yes | up to 90 characters |
| `videos` | Videos | yes | 2 to 6 items |
| `videos[].url` | Video address. A YouTube or Vimeo address. | yes | a YouTube or Vimeo address |
| `videos[].title` | Title | yes | up to 80 characters |
| `videos[].caption` | Caption | no | up to 200 characters |
| `videos[].poster` | Cover picture | no | a picture under /images/ with real alt text, shape 16:9 |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that introduces the videos",
  "videos": [
    {
      "url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
      "title": "A short title for the first video",
      "caption": "A sentence about the first video."
    },
    {
      "url": "https://vimeo.com/1084537",
      "title": "A short title for the second video",
      "caption": "A sentence about the second video."
    },
    {
      "url": "https://youtu.be/aqz-KE-bpKQ",
      "title": "A short title for the third video",
      "caption": "A sentence about the third video."
    }
  ]
}
```

## Photo with text (`photo-text`)

One photo beside a heading, a few paragraphs and an optional button. Good for an about section, a place or a service.

**Where it can go:** anywhere, up to 4 times.

**Variants** (set with `variant`; the first is used when it is left out):

- `photo-start` (default): The photo sits on the left on wide screens, the text on the right. On phones the photo is above the text.
- `photo-end`: The photo sits on the right on wide screens, the text on the left. On phones the photo is above the text.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `image` | Photo. Cropped to a 4 by 3 shape. | yes | a picture under /images/ with real alt text, shape 4:3 |
| `heading` | Heading | yes | up to 90 characters |
| `paragraphs` | Paragraphs | yes | 1 to 4 items, each up to 600 characters |
| `action` | Button | no | button words up to 40 characters, and a link |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "image": {
    "src": "/images/examples/vase-and-pears.jpg",
    "alt": "Abstract still life: a pale vase and two pears in soft window light"
  },
  "heading": "A short heading that says what the photo is about",
  "paragraphs": [
    "A few sentences that tell the story behind the photo in plain words.",
    "A second paragraph for the detail a visitor would ask about next."
  ],
  "action": {
    "label": "A short button label",
    "href": "/contact-us"
  }
}
```

## Photo gallery (`gallery`)

Two to twelve photos in a grid, each with an optional caption. The photos do not open larger.

**Where it can go:** anywhere, up to 2 times.

**Variants** (set with `variant`; the first is used when it is left out):

- `three-column` (default): The photos sit three across on wide screens and two across on tablets and phones.
- `two-column`: The photos sit two across on wide screens and tablets, and one across on phones.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading. Names the group of photos for everyone, including screen reader users. | yes | up to 90 characters |
| `intro` | Introduction | no | up to 280 characters |
| `photos` | Photos | yes | 2 to 12 items |
| `photos[].image` | Photo. Cropped to a 3 by 2 shape. | yes | a picture under /images/ with real alt text, shape 3:2 |
| `photos[].caption` | Caption | no | up to 140 characters |

**Motion:** Rises gently into place as it scrolls into view (it shows at once for visitors who prefer reduced motion).

**Example:**

```json
{
  "heading": "A short heading that names the photos",
  "intro": "A sentence that says what the photos show.",
  "photos": [
    {
      "image": {
        "src": "/images/examples/vase-and-pears.jpg",
        "alt": "Abstract still life: a pale vase and two pears in soft window light"
      },
      "caption": "A short caption for the first photo."
    },
    {
      "image": {
        "src": "/images/examples/bowl-and-lemons.jpg",
        "alt": "Abstract still life: a shallow bowl with three lemons on a pale table"
      },
      "caption": "A short caption for the second photo."
    },
    {
      "image": {
        "src": "/images/examples/jug-and-cups.jpg",
        "alt": "Abstract still life: a tall jug beside two small cups in morning light"
      }
    },
    {
      "image": {
        "src": "/images/examples/stacked-books.jpg",
        "alt": "Abstract still life: a stack of books with a round glass paperweight on top"
      },
      "caption": "A short caption for the fourth photo."
    },
    {
      "image": {
        "src": "/images/examples/candle-and-plate.jpg",
        "alt": "Abstract still life: a candle in front of a plate, with a long soft shadow"
      },
      "caption": "A short caption for the fifth photo."
    },
    {
      "image": {
        "src": "/images/examples/window-light.jpg",
        "alt": "Abstract still life: a round stool and a plant pot beneath a bright window"
      }
    }
  ]
}
```

## Home hero (`home-hero`)

The home page's first screen: a centered headline, a line under it and a button, in the sky of a dusk photo with an amber line drawing on the house.

**Where it can go:** first on the page, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Centered text over the photo's sky; the line drawing draws itself, then holds still.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `title` | Headline. The page's one main heading. | yes | up to 60 characters |
| `intro` | Line under the headline | yes | up to 200 characters |
| `action` | Button | yes | button words up to 30 characters, and a link |
| `photo` | Photo. The dusk house photo. The line drawing is drawn for this picture, so keep it. | yes | a picture under /images/ with real alt text, shape 4:5 |
| `labels` | Labels on the drawing | yes | a group of fields |
| `labels.cantilever` | Cantilever | yes | up to 24 characters |
| `labels.clearSpan` | Clear span | yes | up to 24 characters |
| `labels.wind` | Wind | yes | up to 24 characters |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "title": "Strength you can build on.",
  "intro": "Structural engineering for homes, low-rise commercial buildings and glazing systems in Colorado.",
  "action": {
    "label": "Request a quote",
    "href": "/contact-us"
  },
  "photo": {
    "src": "/images/dusk-home.jpg",
    "alt": "A modern two-story house with a white upper floor, wood soffits and glass walls, lit from inside at dusk above a snowy slope."
  },
  "labels": {
    "cantilever": "Cantilever",
    "clearSpan": "Clear span",
    "wind": "Wind"
  }
}
```

## Photo hero (`photo-hero`)

A page top with the headline and a line on the left and a photo on the right that carries the page's amber line drawing.

**Where it can go:** first on the page, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Text and photo side by side from 1024 px wide, stacked on phones.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `title` | Headline. The page's one main heading. | yes | up to 60 characters |
| `intro` | Line under the headline | yes | up to 200 characters |
| `photo` | Photo. A new photo needs a line in src/content/photos.ts. | yes | a picture under /images/ with real alt text, shape 3:2 |
| `drawing` | Line drawing | yes | one of "services" |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "title": "Structural engineering services",
  "intro": "Fast, accurate, permit-ready plans for homes, low-rise commercial buildings and glazing systems.",
  "photo": {
    "src": "/images/engineer-plans.jpg",
    "alt": "An engineer in a hard hat points at a floor plan pinned to a concrete column inside an unfinished building."
  },
  "drawing": "services"
}
```

## Service page hero (`service-hero`)

The top of a service page: the headline and a line, the overview paragraph, and a hero photo that carries the page's amber line drawing.

**Where it can go:** first on the page, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Phones: headline, photo, overview. From 1024 px wide: text on the left, photo beside it.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `title` | Headline. The page's one main heading. | yes | up to 50 characters |
| `intro` | Line under the headline | yes | up to 200 characters |
| `overview` | Overview paragraph | yes | up to 500 characters |
| `photo` | Hero photo. A 3:2 photo. A new photo needs a line in src/content/photos.ts. | yes | a picture under /images/ with real alt text, shape 3:2 |
| `drawing` | Line drawing | yes | one of "residential", "commercial", "glazing" |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "title": "Residential structural design",
  "intro": "Permit-ready plans for custom homes, remodels, additions, decks and foundations. Fast, accurate and affordable.",
  "overview": "We engineer residential structures to pass plan check and build cleanly in the field. From removing a load-bearing wall to a new custom home, the goal is simple: move your project forward quickly and correctly.",
  "photo": {
    "src": "/images/framing-wood-900.jpg",
    "alt": "Looking up at a wood roof frame of rafters and beams against a blue sky with clouds."
  },
  "drawing": "residential"
}
```

## Page hero (`page-hero`)

A plain page top on dusk: the headline and a line, with an amber line drawing beside them if the page has one.

**Where it can go:** first on the page, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Left-aligned text; the drawing sits under it on phones and beside it from 1024 px wide.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `title` | Headline. The page's one main heading. | yes | up to 60 characters |
| `intro` | Line under the headline | no | up to 240 characters |
| `drawing` | Line drawing. Leave out for a page with no drawing. | no | one of "about" |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "title": "Structural design, simplified.",
  "intro": "Responsive communication, modern tools and permit-ready plans you can build on.",
  "drawing": "about"
}
```

## Contact page (`contact-hero-form`)

The whole contact page: the headline and a line with the direct email and phone, and the six-field form beside them. The form is wired to the site's own settings.

**Where it can go:** first on the page, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): From 900 px wide the text stays in the left column while the form fills the right; on phones they stack.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `title` | Headline. The page's one main heading. | yes | up to 40 characters |
| `intro` | Line under the headline | yes | up to 240 characters |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "title": "Let's get in touch.",
  "intro": "We're here to help you move forward with clarity and confidence. Send us your plans or questions and we'll respond as fast as we can."
}
```

## Design conditions (`conditions`)

A deep band with a heading and a line, then up to six short items in columns, each under a rule with its own amber glyph.

**Where it can go:** anywhere, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Four columns from 900 px wide (two on phones); each item rises into view.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 60 characters |
| `intro` | Line beside the heading | yes | up to 200 characters |
| `items` | Conditions | yes | 2 to 6 items |
| `items[].glyph` | Glyph. The amber line picture drawn above the title. | yes | one of "snow", "wind", "seismic", "temperature" |
| `items[].title` | Title | yes | up to 40 characters |
| `items[].body` | Text | yes | up to 140 characters |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "heading": "Built for every condition",
  "intro": "In Colorado, our experience with cold climates, wind and seismic conditions means every project is built to last.",
  "items": [
    {
      "glyph": "snow",
      "title": "Heavy snow",
      "body": "Roof framing, beams and connections sized for heavy snow loads."
    },
    {
      "glyph": "wind",
      "title": "High wind",
      "body": "Lateral systems and uplift connections checked against the wind at your site."
    },
    {
      "glyph": "seismic",
      "title": "Seismic activity",
      "body": "Shear walls, hold-downs and foundations that work together when the ground moves."
    },
    {
      "glyph": "temperature",
      "title": "Temperature swings",
      "body": "Details that allow for movement through extreme temperature shifts."
    }
  ]
}
```

## Photo cards (`service-cards`)

A heading with a line beside it, then up to six cards: a tall photo, a title that links to a page and a short text.

**Where it can go:** anywhere, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Three columns from 900 px wide; the whole card is the link. The photos ease in as they cross the screen.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 60 characters |
| `intro` | Line beside the heading | yes | up to 240 characters |
| `items` | Cards | yes | 2 to 6 items |
| `items[].title` | Title | yes | up to 40 characters |
| `items[].body` | Text | yes | up to 220 characters |
| `items[].href` | Page the card opens | yes | a link (see Page rules) |
| `items[].photo` | Photo. A 4:5 crop. A new photo needs a line in src/content/photos.ts. | yes | a picture under /images/ with real alt text, shape 4:5 |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "heading": "What we design",
  "intro": "We partner with architects, builders and homeowners to keep projects moving with clear drawings, responsive communication and clean calculations.",
  "items": [
    {
      "title": "Residential",
      "body": "Structural and foundation designs for custom homes, master plans, remodels, additions and decks, tailored for permitting and construction.",
      "href": "/services/residential-structural-design",
      "photo": {
        "src": "/images/chalet-snow-card.jpg",
        "alt": "A stone and log house with a car parked at the end of a deep snow drift in the driveway."
      }
    },
    {
      "title": "Low-rise commercial",
      "body": "Structural and foundation designs for retail, office and tenant improvements, tailored for permitting and construction.",
      "href": "/services/low-rise-commercial-structural-design",
      "photo": {
        "src": "/images/commercial-crane-card.jpg",
        "alt": "A multi-story wood-framed building under construction, wrapped in house wrap, with a yellow tower crane above it."
      }
    },
    {
      "title": "Glazing and mullion",
      "body": "Redlines and structural calculations for glazing, mullion, facade, storefront, curtainwall and sunshade systems.",
      "href": "/services/glazing-and-mullion-engineering",
      "photo": {
        "src": "/images/curtain-wall-card.jpg",
        "alt": "Looking up at the glass curtain wall of a tall building, with the sky and clouds reflected in the panels."
      }
    }
  ]
}
```

## Service choices (`service-choices`)

A deep band with a heading and up to six linked cards, each a photo, a title and a short text.

**Where it can go:** anywhere, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Three columns from 768 px wide; the photos ease in as they cross the screen.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 60 characters |
| `items` | Choices | yes | 2 to 6 items |
| `items[].title` | Title | yes | up to 50 characters |
| `items[].body` | Text | yes | up to 200 characters |
| `items[].href` | Page the card opens | yes | a link (see Page rules) |
| `items[].photo` | Photo file. A path under /images/, such as /images/chalet-snow-640.jpg. Decoration beside the title, so it has no alt text. A new photo needs a line in src/content/photos.ts. | yes | up to 120 characters |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "heading": "Choose your service",
  "items": [
    {
      "title": "Residential structural design",
      "body": "Custom homes, remodels and additions, decks, foundations, retaining walls, lateral checks.",
      "href": "/services/residential-structural-design",
      "photo": "/images/chalet-snow-640.jpg"
    },
    {
      "title": "Low-rise commercial",
      "body": "Small retail and office, tenant improvement scopes, framing and lateral design, connection details, permit coordination.",
      "href": "/services/low-rise-commercial-structural-design",
      "photo": "/images/commercial-crane-640.jpg"
    },
    {
      "title": "Glazing and mullion engineering",
      "body": "Storefronts, mullion spans and deflection, anchorage, thermal movement; shop drawings and calculations.",
      "href": "/services/glazing-and-mullion-engineering",
      "photo": "/images/curtain-wall-640.jpg"
    }
  ]
}
```

## Figures and reasons (`figures-and-reasons`)

One deep band: big amber figures that count up as they scroll into view, then a heading and a grid of short reasons.

**Where it can go:** anywhere, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Figures in columns from 900 px wide; reasons in two columns with fading dividers, no boxes.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `figures` | Figures | yes | 2 to 3 items |
| `figures[].value` | Number. Digits only, such as 48. It counts up from 0 on screen; the real number is always in the page. | yes | up to 4 characters |
| `figures[].unit` | Word beside the number | yes | up to 20 characters |
| `figures[].body` | Line under the number | yes | up to 120 characters |
| `heading` | Heading above the reasons | yes | up to 60 characters |
| `items` | Reasons | yes | 2 to 6 items |
| `items[].title` | Title | yes | up to 40 characters |
| `items[].body` | Text | yes | up to 200 characters |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "figures": [
    {
      "value": "48",
      "unit": "hours",
      "body": "to a clear proposal with deliverables, pricing and schedule"
    },
    {
      "value": "10",
      "unit": "years",
      "body": "of hands-on structural engineering"
    }
  ],
  "heading": "Why builders call us back",
  "items": [
    {
      "title": "Fast and responsive",
      "body": "Questions don't sit unanswered. We respond to RFIs quickly to keep the project moving."
    },
    {
      "title": "Permit-ready packages",
      "body": "Clear drawings and stamped calculations that satisfy the submittal requirements."
    }
  ]
}
```

## Heading and dot list (`split-list`)

A heading in a narrow left column with a list of short points beside it, each with an amber dot.

**Where it can go:** anywhere, up to 3 times. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `dusk` (default): On the page's dusk color.
- `deep`: On the deeper band color.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 40 characters |
| `items` | Points | yes | 1 to 10 items, each up to 240 characters |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "heading": "Who we serve",
  "items": [
    "Architects looking for coordinated structural sets that fit the design intent.",
    "Homeowners who need reliable engineering for remodels, additions or new homes.",
    "Builders and contractors who value quick responses, clear drawings and practical field solutions."
  ]
}
```

## Heading and paragraph (`split-text`)

A heading in a narrow left column with one paragraph beside it, on the deeper band color.

**Where it can go:** anywhere, up to 2 times. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): A compact deep band; the heading stacks above the paragraph on phones.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 40 characters |
| `body` | Paragraph | yes | up to 700 characters |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "heading": "Tools and codes",
  "body": "All work is produced in AutoCAD and Revit for clean coordination with architects and general contractors. We design to IBC and ASCE 7 loads, as the project and jurisdiction require."
}
```

## Numbered steps (`how-we-work`)

A heading and a numbered list of steps in two columns, then a second heading with a paragraph under a divider.

**Where it can go:** anywhere, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Steps in two columns with fading dividers; the number is amber.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 40 characters |
| `steps` | Steps | yes | 2 to 8 items |
| `steps[].title` | Title | yes | up to 50 characters |
| `steps[].body` | Text | yes | up to 240 characters |
| `where` | Closing note under the steps | yes | a group of fields |
| `where.heading` | Heading | yes | up to 40 characters |
| `where.body` | Paragraph | yes | up to 320 characters |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "heading": "How we work",
  "steps": [
    {
      "title": "Share your plans",
      "body": "Send drawings, sketches or site photos. We review the scope and ask the right questions."
    },
    {
      "title": "Scope and quote in 48 hours",
      "body": "Within two business days you get a clear proposal with deliverables, pricing and schedule."
    }
  ],
  "where": {
    "heading": "Where we work",
    "body": "Currently serving Colorado. Need help in another state? We'll get licensed quickly and handle local requirements."
  }
}
```

## Questions beside a heading (`split-faq`)

A heading in a narrow left column with questions that open to show their answers beside it.

**Where it can go:** anywhere, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Questions open and close one by one; works without JavaScript.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 60 characters |
| `items` | Questions | yes | 1 to 12 items |
| `items[].question` | Question | yes | up to 140 characters |
| `items[].answer` | Answer | yes | up to 500 characters |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "heading": "Glazing questions",
  "items": [
    {
      "question": "What do you need to start?",
      "answer": "System type, elevations and spans, project location or design pressures, and any specified deflection limits."
    },
    {
      "question": "Do you stamp drawings?",
      "answer": "We stamp calculations and drawings in Colorado. For other states, we'll arrange licensure on request."
    }
  ]
}
```

## What we do (`what-we-do`)

A deep band with a heading and a ruled list of the work, each with an optional line of detail, and one or two photos beside it.

**Where it can go:** anywhere, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): The list on the left, the photos staying in view beside it from 1024 px wide.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 40 characters |
| `items` | Work | yes | 1 to 10 items |
| `items[].title` | Title | yes | up to 70 characters |
| `items[].body` | Detail. Leave out for a list of names alone; the titles then show larger. | no | up to 200 characters |
| `photos` | Photos | yes | 1 to 2 items, each a picture under /images/ with real alt text, shape 4:5 |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "heading": "What we do",
  "items": [
    {
      "title": "Custom and luxury homes",
      "body": "Framing and lateral plans that work with the design; gravity, wind and seismic calculations."
    },
    {
      "title": "Foundations",
      "body": "Spread footings, drilled piers and caissons, micropiles, helical piers."
    }
  ],
  "photos": [
    {
      "src": "/images/remodel-framing-640.jpg",
      "alt": "Wood wall studs in an interior under construction, with sheathing and a window opening visible behind them."
    },
    {
      "src": "/images/rebar-800.jpg",
      "alt": "Steel reinforcing bars bent into a cage, seen from below against a pale sky beside a concrete wall."
    }
  ]
}
```

## How we work, short (`how-we-work-teaser`)

A heading that links to the full steps, with the first step written out beside it.

**Where it can go:** anywhere, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): A compact deep band; the heading stacks above the step on phones.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading (a link) | yes | up to 40 characters |
| `href` | Page the heading opens | yes | a link (see Page rules) |
| `stepTitle` | Step title | yes | up to 50 characters |
| `stepBody` | Step text | yes | up to 300 characters |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "heading": "How we work",
  "href": "/services",
  "stepTitle": "Share your plans",
  "stepBody": "Send drawings, sketches or site photos. We review the scope, ask the right questions and outline what a permit-ready package needs."
}
```

## Statement (`statement`)

One large paragraph on a deep band: a single statement of what the practice is.

**Where it can go:** anywhere, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Large text in a narrow column.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `text` | Statement | yes | up to 500 characters |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "text": "Structural Integrity Engineering is a structural engineering practice specializing in custom residential design, low-rise commercial projects and glazing and mullion engineering."
}
```

## Profile (`profile`)

A portrait photo beside a heading and a paragraph about a person.

**Where it can go:** anywhere, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Photo on the left from 1024 px wide, above the text on phones.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 60 characters |
| `body` | Paragraph | yes | up to 600 characters |
| `photo` | Portrait. Shown whole, not trimmed: a portrait close to 4:5 (the current one is 3:4) keeps the layout. A new photo needs a line in src/content/photos.ts. | yes | a picture under /images/ with real alt text, shape 4:5 |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "heading": "Meet our principal engineer",
  "body": "Dylan Gassmann is the founder and principal engineer of Structural Integrity Engineering. Based in Colorado Springs, he brings a decade of hands-on experience in structural engineering for residential and commercial projects.",
  "photo": {
    "src": "/images/dylan-portrait.jpg",
    "alt": "Portrait of Dylan Gassmann, principal engineer, smiling in front of a brick wall."
  }
}
```

## Standard and mission (`standard-and-mission`)

One deep band: a heading over a wide photo with a line of licensing under it, then a divider and the mission.

**Where it can go:** anywhere, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): The photo eases in as it crosses the screen.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `standard` | Standard | yes | a group of fields |
| `standard.heading` | Heading | yes | up to 40 characters |
| `standard.line` | Line under the photo | yes | up to 100 characters |
| `standard.photo` | Wide photo. A 3:2 photo. A new photo needs a line in src/content/photos.ts. | yes | a picture under /images/ with real alt text, shape 3:2 |
| `mission` | Mission | yes | a group of fields |
| `mission.heading` | Heading | yes | up to 40 characters |
| `mission.body` | Paragraph | yes | up to 300 characters |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "standard": {
    "heading": "One standard",
    "line": "Licensed in Colorado and Alaska.",
    "photo": {
      "src": "/images/colorado-pikes-peak.jpg",
      "alt": "A snow-dusted mountain rising above a line of evergreen trees under a pale blue sky."
    }
  },
  "mission": {
    "heading": "Our mission",
    "body": "To ensure the integrity and performance of every structure we design, combining technical excellence with practical efficiency."
  }
}
```

## Policy sections (`policy-sections`)

Plain headed sections of text in a narrow reading column, then a closing line such as the date the policy was last updated.

**Where it can go:** anywhere, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): One column, about 64 characters wide.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `sections` | Sections | yes | 1 to 14 items |
| `sections[].heading` | Heading | yes | up to 60 characters |
| `sections[].body` | Text | yes | up to 900 characters |
| `footnote` | Closing line | no | up to 120 characters |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "sections": [
    {
      "heading": "How we use it",
      "body": "To answer your request and work with you on your project. We do not sell it, and we do not use it for advertising."
    },
    {
      "heading": "How long we keep it",
      "body": "For as long as we need it to answer you and work on your project."
    }
  ],
  "footnote": "Last updated November 24, 2026."
}
```

## Contact band (`contact-band`)

The band that ends a page: a centered headline, a line, the Request a quote button, then the phone number and email from the site settings.

**Where it can go:** last on the page, once. This is one of this site's own blocks.

**Variants** (set with `variant`; the first is used when it is left out):

- `default` (default): Centered on dusk. The photo behind it, if any, is set in src/content/shared.ts.

**Fields** (inside `content`):

| Field | What it is | Required | Limits |
| --- | --- | --- | --- |
| `heading` | Heading | yes | up to 60 characters |
| `body` | Line under the heading | yes | up to 160 characters |
| `action` | Button | yes | button words up to 30 characters, and a link |

**Motion:** No entrance motion. This site's sections reveal themselves with CSS (reveal and reveal-zoom in hl.css), so a second entrance would double it.

**Example:**

```json
{
  "heading": "Ready to get started?",
  "body": "Quick replies, clean drawings, and fair pricing.",
  "action": {
    "label": "Request a quote",
    "href": "/contact-us"
  }
}
```
