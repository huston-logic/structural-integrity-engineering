import { photoFiles } from "@/content/photos";

type PhotoCopy = { src: string; width: number; height: number };
export type PhotoFile = { width: number; height: number; small?: PhotoCopy; phone?: PhotoCopy };

const files: Readonly<Record<string, PhotoFile>> = photoFiles;

/** The size (and smaller copies) of a photo a page names by path. A photo with no entry in src/content/photos.ts stops the build. */
export function photoFile(src: string): PhotoFile {
  const file = files[src];
  if (!file) throw new Error(`The photo "${src}" has no size yet. Add a line for it to src/content/photos.ts (its width and height in pixels).`);
  return file;
}

/** A page's photo as the image tags need it: path, size and the alt text written in the page file. */
export function photoWithAlt(photo: { src: string; alt: string }): PhotoCopy & { alt: string } {
  const { width, height } = photoFile(photo.src);
  return { src: photo.src, width, height, alt: photo.alt };
}
