import getFiles from "https://deno.land/x/getfiles@v1.0.0/mod.ts";
import { renderFile } from "https://deno.land/x/mustache_ts@v0.4.1.1/mustache.ts";
import { ensureDir } from "https://deno.land/std@0.121.0/fs/mod.ts";
import { dirname } from "https://deno.land/std@0.121.0/path/mod.ts";
import { Feed } from "https://esm.sh/feed@4.2.2";
import { copy } from "https://deno.land/std@0.121.0/fs/copy.ts";

import { getSitePath, getAppPath, formatDate } from "./util.ts";
import { getDataFilePath } from "../common/util.ts";
const themeColor = "#1095c1";
const pageSize = 600;
const languages = ["zh-Hans", "zh-Hant"];
const distPath = getSitePath("public");
export default async function main(siteIdentifier: string) {
  const postsPath = getDataFilePath(`sites/${siteIdentifier}/posts`);
  console.log("postsPath", postsPath);

  const postsFiles = await getFiles(postsPath)
    .map((item) => item.path)
    .sort()
    .reverse();
  const siteConfigPath = getAppPath(siteIdentifier, "site.json");
  const siteConfig = JSON.parse(await Deno.readTextFile(siteConfigPath));
  const totalPages = Math.ceil(postsFiles.length / pageSize);
  await ensureDir(distPath);
  const pages: { path: string; output: string }[] = [];
  for (let i = 0; i < totalPages; i++) {
    const page = i + 1;
    const posts: Record<string, unknown>[][] = [];
    languages.forEach((_, index) => {
      posts[index] = [];
    });
    for (let j = 0; j < pageSize; j++) {
      if (postsFiles[i * pageSize + j]) {
        const postFilePath = postsFiles[i * pageSize + j];
        const postContent = await Deno.readTextFile(postFilePath);
        const rawPost = JSON.parse(postContent);
        languages.forEach((language, index) => {
          let headline = rawPost[`headline_${language}`];
          const originalHeadline = rawPost.headline;

          if (headline && headline.startsWith("Show HN")) {
            headline = headline.substring(9);
          } else if (headline && headline.startsWith("Ask HN")) {
            headline = headline.substring(8);
          } else if (!headline) {
            console.error(new Error(`headline is empty ${postFilePath}`));
            headline = originalHeadline;
          }
          const postUrl = new URL(rawPost.sameAs);
          const hostName = postUrl.hostname;
          // hostName = hostName.replace(/^[^.]+\./g, "");

          const post: Record<string, unknown> = {
            dateCreated: formatDate(new Date(rawPost.datePublished)),
            dateCreatedDate: new Date(rawPost.datePublished),
            originalHeadline: originalHeadline,
            headline: headline,
            publisher: rawPost.publisher,

            url: rawPost.url,
            discussionUrl: rawPost.discussionUrl,
            author: rawPost.author,
            sameAs: rawPost.sameAs,
            hostName: hostName,
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

    for (let index = 0; index < languages.length; index++) {
      const language = languages[index];
      const languageSlug = language === "zh-Hans" ? "" : `${language}/`;
      const languageSlim = language === "zh-Hans" ? "" : `_${language}`;

      const output = await renderFile(getSitePath("templates/posts.html"), {
        posts: posts[index],
        rootUrl: "/" + languageSlug,
        rssUrl: siteConfig.url + `/${languageSlug}rss.xml`,
        atomUrl: siteConfig.url + `/${languageSlug}atom.xml`,
        pageUrl: siteConfig.url + `/${languageSlug}`,
        manifestUrl: `manifest${languageSlim}.webmanifest`,
        jsonLDString: JSON.stringify(siteConfig),
        jsonLD: siteConfig,
        language: language,
        themeColor: themeColor,

        languages: languages.map((lang) => {
          return {
            active: lang === language,
            name: lang === "zh-Hans" ? "简" : "繁",
            url: lang === "zh-Hans" ? "/" : `/${lang}/`,
          };
        }),
      });
      pages.push({
        path: getSitePath(
          page === 1
            ? `public/${languageSlug}index.html`
            : `public/${languageSlug}page/` + page + "/index.html"
        ),
        output: output,
      });
      if (page === 1) {
        const feed = new Feed({
          title: siteConfig.name,
          description: siteConfig.description,
          id: siteConfig.url,
          link: siteConfig.url,
          language: language, // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
          image: "http://example.com/image.png",
          favicon: `${siteConfig.url}/favicon.ico`,
          copyright: "All rights reserved 2022, Owen",
          feedLinks: {
            json: `${siteConfig.url}/feed.json`,
            atom: `${siteConfig.url}/atom.xml`,
          },
          author: {
            name: "Buzzing",
            email: "hello@buzzing.cc",
            link: siteConfig.url,
          },
        });
        const thePosts = posts[index];

        thePosts.forEach((post) => {
          feed.addItem({
            title: post.headline as string,
            id: post.url as string,
            link: post.url as string,
            description: post.originalHeadline as string,
            content: "",
            author: [
              {
                name: (post.author as Record<string, string>).name,
                link: (post.author as Record<string, string>).url,
              },
            ],
            date: post.dateCreatedDate as Date,
            extensions: [
              {
                name: "_original_headline",
                objects: post.originalHeadline,
              },
              {
                name: "_original_url",
                objects: post.sameAs,
              },

              {
                name: "_sensitive",
                objects: false,
              },
              {
                name: "_score",
                objects: post.LikeAction || 0,
              },
            ],
          });
        });
        pages.push({
          path: getSitePath(`public/${languageSlug}rss.xml`),
          output: feed.rss2(),
        });
        pages.push({
          path: getSitePath(`public/${languageSlug}atom.xml`),
          output: feed.atom1(),
        });
        pages.push({
          path: getSitePath(`public/${languageSlug}feed.json`),
          output: feed.json1(),
        });
        // create manifest.webmanifest

        const manifest = {
          name: siteConfig.name,
          short_name: siteConfig.alternateName,
          description: siteConfig.description,
          icons: [
            {
              src: "/android-chrome-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/android-chrome-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
          theme_color: themeColor,
          background_color: "#fffff8",
          display: "standalone",
          start_url: `/${languageSlug}`,
          lang: language,
        };
        pages.push({
          path: getSitePath(`public/manifest${languageSlim}.webmanifest`),
          output: JSON.stringify(manifest, null, 2),
        });
      }
    }
  }

  // generate rss
  for (const page of pages) {
    const output = page.output;
    // write to file
    // ensure directory exists
    await ensureDir(dirname(page.path));
    console.log("Build page:", page.path);
    await Deno.writeTextFile(page.path, output);
  }

  // copy static files
  await copy(getAppPath(siteIdentifier, "static"), getSitePath("public"), {
    overwrite: true,
  });
}
