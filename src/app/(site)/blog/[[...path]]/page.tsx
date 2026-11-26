import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/blocks/BlockRenderer";
import { PostArticle } from "@/components/hl/PostArticle";
import { blog } from "@/content/blog";
import { BLOG_PATH, extraPageNumbers, indexPath, postData, postPages, postPath } from "@/lib/blog";
import { getItem, getItems } from "@/lib/collections";
import { pageMetadata } from "@/lib/metadata";
import { getPage } from "@/lib/pages";

// One route holds the whole blog, so the build has at least one address (/blog) however many posts there are, once the
// blog page is live (none while it is archived):
//   /blog              the blog.json page, its post index showing page 1
//   /blog/page/<n>     the same page, showing page n (n from 2, only where posts reach that far)
//   /blog/<slug>       one post
// (/blog/feed.xml is its own route handler.) Any other address is the 404.
export const dynamicParams = false;

type Props = { params: Promise<{ path?: string[] }> };

type Target = { kind: "index"; number: number } | { kind: "post"; slug: string };

function targetFor(path: string[] = []): Target | undefined {
  if (path.length === 0) return { kind: "index", number: 1 };
  if (path.length === 1 && path[0] !== "page") return { kind: "post", slug: path[0] as string };
  if (path.length === 2 && path[0] === "page" && /^[2-9]\d*$/.test(path[1] as string)) return { kind: "index", number: Number(path[1]) };
  return undefined;
}

export function generateStaticParams() {
  // While src/content/pages/blog.json is archived there is no blog: nothing under /blog is built (docs/SITE-DIFFERENCES.md, D12).
  if (!getPage(BLOG_PATH)) return [{ path: [] as string[] }];
  const posts = getItems("posts");
  return [{ path: [] as string[] }, ...extraPageNumbers(posts.length).map((n) => ({ path: ["page", String(n)] })), ...posts.map((post) => ({ path: [post.slug] }))];
}

function indexFor(number: number) {
  const page = getPage(BLOG_PATH);
  const total = postPages(getItems("posts")).length;
  if (!page || number > total) notFound();
  return { page, total };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const target = targetFor((await params).path);
  if (target === undefined) return {};
  if (target.kind === "post") {
    const post = getItem("posts", target.slug);
    if (!post) return {};
    const data = postData(post);
    return pageMetadata({
      title: data.title,
      description: data.description,
      path: postPath(post.slug),
      noindex: post.status === "draft",
      article: { publishedTime: data.date, ...(data.updated === undefined ? {} : { modifiedTime: data.updated }) },
      feed: true,
    });
  }
  const { page, total } = indexFor(target.number);
  const title = target.number === 1 ? page.title : `${page.title} (${blog.pageOf(target.number, total)})`;
  return pageMetadata({ title, description: page.description, path: indexPath(target.number), feed: true });
}

export default async function BlogRoute({ params }: Props) {
  const target = targetFor((await params).path);
  if (target === undefined) notFound();
  if (target.kind === "post") {
    const post = getItem("posts", target.slug);
    if (!post) notFound();
    return <PostArticle post={post} />;
  }
  const { page } = indexFor(target.number);
  // Keyed by index page: moving between two pages gives fresh block wrappers, so each page gets its entrance.
  return <BlockRenderer key={target.number} blocks={page.blocks} page={target.number} />;
}
