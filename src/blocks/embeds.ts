// The single allowlist of video sites. Import-free so Node scripts and Next share it. A video address is parsed to a
// provider and an id; the address that is embedded or linked is always rebuilt from those, never taken from the input.

export type VideoRef = { provider: "youtube" | "vimeo"; id: string; hash?: string };

export const embedOrigins = ["https://www.youtube-nocookie.com", "https://player.vimeo.com"] as const;

export const videoProviders = [
  { name: "YouTube", example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { name: "Vimeo", example: "https://vimeo.com/76979871" },
] as const;

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{1,12}$/;
const VIMEO_HASH = /^[0-9a-f]{10}$/;

function segments(pathname: string): string[] {
  return pathname.replace(/\/$/, "").split("/").slice(1);
}

function youtubeId(id: string | undefined): VideoRef | null {
  return id !== undefined && YOUTUBE_ID.test(id) ? { provider: "youtube", id } : null;
}

/** The video a pasted address points to, or null when it is not on the allowlist. Extra parameters (t, si, list) are ignored. */
export function parseVideoUrl(input: unknown): VideoRef | null {
  if (typeof input !== "string" || input.length > 300 || /\s/.test(input)) return null;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username !== "" || url.password !== "" || url.port !== "") return null;
  const host = url.hostname.toLowerCase();
  const parts = segments(url.pathname);

  if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
    if (parts.length === 1 && parts[0] === "watch") return youtubeId(url.searchParams.get("v") ?? undefined);
    if (parts.length === 2 && (parts[0] === "embed" || parts[0] === "shorts")) return youtubeId(parts[1]);
    return null;
  }
  if (host === "youtube-nocookie.com" || host === "www.youtube-nocookie.com") {
    return parts.length === 2 && parts[0] === "embed" ? youtubeId(parts[1]) : null;
  }
  if (host === "youtu.be" || host === "www.youtu.be") {
    return parts.length === 1 ? youtubeId(parts[0]) : null;
  }
  if (host === "vimeo.com" || host === "www.vimeo.com") {
    const id = parts[0];
    if (parts.length < 1 || parts.length > 2 || id === undefined || !VIMEO_ID.test(id)) return null;
    const hash = parts[1];
    if (hash === undefined) return { provider: "vimeo", id };
    return VIMEO_HASH.test(hash) ? { provider: "vimeo", id, hash } : null;
  }
  if (host === "player.vimeo.com") {
    const id = parts[1];
    if (parts.length !== 2 || parts[0] !== "video" || id === undefined || !VIMEO_ID.test(id)) return null;
    const hash = url.searchParams.get("h");
    if (hash === null) return { provider: "vimeo", id };
    return VIMEO_HASH.test(hash) ? { provider: "vimeo", id, hash } : null;
  }
  return null;
}

/** The player address the page swaps in when the visitor presses play. */
export function embedUrl(video: VideoRef): string {
  if (video.provider === "youtube") return `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1`;
  const hash = video.hash === undefined ? "" : `&h=${video.hash}`;
  return `https://player.vimeo.com/video/${video.id}?autoplay=1&dnt=1${hash}`;
}

/** The address of the video on its own site: the no-JavaScript fallback link. */
export function watchUrl(video: VideoRef): string {
  if (video.provider === "youtube") return `https://www.youtube.com/watch?v=${video.id}`;
  return video.hash === undefined ? `https://vimeo.com/${video.id}` : `https://vimeo.com/${video.id}/${video.hash}`;
}
