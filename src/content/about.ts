import { photos } from "@/content/photos";
import { seo } from "@/content/seo";

/** About page copy, verbatim from the copy deck (About and Contact > About). */
export const aboutMeta = seo.about;

export const aboutHero = {
  title: "Structural design, simplified.",
  intro: "Responsive communication, modern tools and permit-ready plans you can build on.",
};

export const whatWeAre =
  "Structural Integrity Engineering is a structural engineering practice specializing in custom residential design, low-rise commercial projects and glazing and mullion engineering. We provide fast, accurate and affordable permit-ready drawings and calculations for builders, architects and homeowners in Colorado.";

export const principal = {
  heading: "Meet our principal engineer",
  body: "Dylan Gassmann is the founder and principal engineer of Structural Integrity Engineering. Based in Colorado Springs, he brings a decade of hands-on experience in structural engineering for residential and commercial projects. He believes great engineering should move projects forward: quickly, clearly and affordably.",
  photo: photos.dylanPortrait,
};

/** The one place the site lists licensing (Dylan is licensed in Colorado and Alaska); everywhere else says Colorado. */
export const standard = {
  heading: "One standard",
  line: "Licensed in Colorado and Alaska.",
  photo: photos.coloradoPikesPeak,
};

export const mission = {
  heading: "Our mission",
  body: "To ensure the integrity and performance of every structure we design, combining technical excellence with practical efficiency.",
};
