import getFiles from "https://deno.land/x/getfiles@v1.0.0/mod.ts";
import { renderFile } from "https://deno.land/x/mustache_ts/mustache.ts";
import { ensureDir } from "https://deno.land/std@0.121.0/fs/mod.ts";
import { dirname } from "https://deno.land/std@0.121.0/path/mod.ts";

import { getSitePath } from "./util.ts";
const pageSize = 8;
const languages = ["zh-Hant", "zh-Hans"];
const distPath = getSitePath("public");
export default async function main() {
  const postsFiles = await getFiles(
    "./sources/sites/HackerNews/posts"
  ).reverse();
  const totalPages = Math.ceil(postsFiles.length / pageSize);
  await ensureDir(distPath);
  const pages: Record<string, unknown>[] = [];

  for (let i = 0; i < totalPages; i++) {
    const page = i + 1;
    const posts: unknown[][] = [];
    languages.forEach((_, index) => {
      posts[index] = [];
    });
    for (let j = 0; j < pageSize; j++) {
      if (postsFiles[i * pageSize + j]) {
        const postFilePath = postsFiles[i * pageSize + j];
        const postContent = await Deno.readTextFile(postFilePath.path);
        const rawPost = JSON.parse(postContent);

        languages.forEach((language, index) => {
          const post: Record<string, unknown> = {
            dateCreated: rawPost.dateCreated,
            originalHeadline: rawPost.headline,
            headline: rawPost[`headline_${language}`],
            publisher: rawPost.publisher,
            url: rawPost.url,
            disscussionUrl: rawPost.disscussionUrl,
            author: rawPost.author,
            sameAs: rawPost.sameAs,
            keywords: rawPost.keywords,
          };
          if (rawPost.interactionStatistic) {
            rawPost.interactionStatistic.forEach(
              (item: Record<string, unknown>) => {
                const key = (item.interactionType as Record<string, string>)[
                  "@type"
                ] as string;
                post[key] = item.userInteractionCount;
              }
            );
          }
          posts[index].push(post);
        });
      }
    }
    languages.forEach((language, index) => {
      const languageSlug = language === "zh-Hans" ? "" : `${language}/`;
      pages.push({
        path: getSitePath(
          page === 1
            ? `public/${languageSlug}index.html`
            : `public/${languageSlug}page/` + page + "/index.html"
        ),
        data: {
          posts: posts[index],
          language: language,
        },
      });
    });
  }

  for (const page of pages) {
    const output = await renderFile(
      getSitePath("templates/posts.html"),
      page.data as Record<string, unknown>
    );
    // write to file
    // ensure directory exists
    await ensureDir(dirname(page.path as string));
    console.log("Build page:", page.path);
    await Deno.writeTextFile(page.path as string, output);
  }
}
