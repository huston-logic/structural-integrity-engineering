import { photos } from "./photos";

// Services page copy, verbatim from the copy deck ("Services pages" > "Services"). The deck gives no SEO title or
// description for this page, so they stay placeholders until task 11.
export const servicesMeta = {
  title: "[[Services page SEO title]]",
  description: "[[Services page SEO description]]",
};

/** The hero photo: a 800px-wide copy for phones, the full file from 768px up. */
export const servicesHero = {
  title: "Structural engineering services",
  intro: "Fast, accurate, permit-ready plans for homes, low-rise commercial buildings and glazing systems.",
  photo: photos.engineerPlans,
  photoSmall: photos.engineerPlansSmall,
};

export const serviceChoices = {
  heading: "Choose your service",
  items: [
    {
      title: "Residential structural design",
      body: "Custom homes, remodels and additions, decks, foundations, retaining walls, lateral checks.",
      href: "/services/residential-structural-design",
      photo: photos.chaletSnowCard,
    },
    {
      title: "Low-rise commercial",
      body: "Small retail and office, tenant improvement scopes, framing and lateral design, connection details, permit coordination.",
      href: "/services/low-rise-commercial-structural-design",
      photo: photos.commercialCraneCard,
    },
    {
      title: "Glazing and mullion engineering",
      body: "Storefronts, mullion spans and deflection, anchorage, thermal movement; shop drawings and calculations.",
      href: "/services/glazing-and-mullion-engineering",
      photo: photos.curtainWallCard,
    },
  ],
};

export const whoWeServe = {
  heading: "Who we serve",
  items: [
    "Architects looking for coordinated structural sets that fit the design intent.",
    "Homeowners who need reliable engineering for remodels, additions or new homes.",
    "Builders and contractors who value quick responses, clear drawings and practical field solutions.",
    "Developers managing several projects who need efficient, repeatable design support.",
    "Glazing and storefront contractors who need accurate, code-compliant calculations and anchor details.",
    "Owners and facility managers looking for structural evaluations, letters or retrofit recommendations.",
  ],
};

export const toolsAndCodes = {
  heading: "Tools and codes",
  body: "All work is produced in AutoCAD and Revit for clean coordination with architects and general contractors. We design to IBC and ASCE 7 loads, verify glass strength with ASTM E1300, size aluminum members per the Aluminum Design Manual, and design anchorage with AISC and ACI, as the project and jurisdiction require.",
};

/** The six numbered steps: the one real sequence on the site. */
export const howWeWork = {
  heading: "How we work",
  steps: [
    {
      title: "Share your plans",
      body: "Send drawings, sketches or site photos. We review the scope, ask the right questions and outline what a permit-ready package needs.",
    },
    {
      title: "Scope and quote in 48 hours",
      body: "Within two business days you get a clear proposal with deliverables, pricing and schedule.",
    },
    {
      title: "Design and analysis",
      body: "All calculations and drawings in AutoCAD or Revit, coordinated with your architect or contractor.",
    },
    {
      title: "Review and revisions",
      body: "Every design is checked for code compliance and constructability, and adjusted quickly with your team.",
    },
    {
      title: "Permit-ready package",
      body: "Sealed drawings and calculations, organized, labeled and ready to submit.",
    },
    {
      title: "Support through approval",
      body: "We stay available for plan check comments and revisions so your schedule holds.",
    },
  ],
};

export const whereWeWork = {
  heading: "Where we work",
  body: "Currently serving Colorado and Alaska. Need help in another state? We'll get licensed quickly and handle local requirements so your schedule stays intact.",
};

/** The glazing set from the deck. Dylan's Residential and Commercial answers did not come through, so they launch without. */
export const faq = {
  heading: "Questions",
  items: [
    {
      question: "What do you need to start?",
      answer: "System type, elevations and spans, project location or design pressures, substrate details, and any specified deflection or drift limits.",
    },
    {
      question: "Can you establish design pressures?",
      answer: "Yes. If needed, we calculate pressures per ASCE 7 from the project geometry and exposure; otherwise we design to the values provided.",
    },
    {
      question: "Do you check glass thickness and layups?",
      answer: "Yes, per ASTM E1300 and the project specifications, including special cases like guards and impact glazing.",
    },
    {
      question: "Do you stamp drawings?",
      answer: "We stamp calculations and drawings in Alaska and Colorado. For other states, we'll arrange licensure on request.",
    },
    {
      question: "How fast is delivery?",
      answer: "We guarantee a 48-hour response and offer expedited schedules depending on scope.",
    },
  ],
};
