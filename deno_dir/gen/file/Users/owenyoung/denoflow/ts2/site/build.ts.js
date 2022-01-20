import getFiles from "https://deno.land/x/getfiles@v1.0.0/mod.ts";
import { renderFile } from "https://deno.land/x/mustache_ts/mustache.ts";
import { ensureDir } from "https://deno.land/std@0.121.0/fs/mod.ts";
import { dirname } from "https://deno.land/std@0.121.0/path/mod.ts";
import { Feed } from "https://esm.sh/feed";
import { copy } from "https://deno.land/std@0.121.0/fs/copy.ts";
import { getSitePath, getAppPath, formatDate } from "./util.ts";
const themeColor = "#1095c1";
const pageSize = 1000;
const languages = ["zh-Hans", "zh-Hant"];
const distPath = getSitePath("public");
export default async function main(siteIdentifier) {
    const postsFiles = await getFiles(`./sources/sites/${siteIdentifier}/posts`)
        .map((item) => item.path)
        .sort()
        .reverse();
    const siteConfigPath = getAppPath(siteIdentifier, "site.json");
    const siteConfig = JSON.parse(await Deno.readTextFile(siteConfigPath));
    const totalPages = Math.ceil(postsFiles.length / pageSize);
    await ensureDir(distPath);
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
        const page = i + 1;
        const posts = [];
        languages.forEach((_, index) => {
            posts[index] = [];
        });
        for (let j = 0; j < pageSize; j++) {
            if (postsFiles[i * pageSize + j]) {
                const postFilePath = postsFiles[i * pageSize + j];
                const postContent = await Deno.readTextFile(postFilePath);
                const rawPost = JSON.parse(postContent);
                languages.forEach((language, index) => {
                    const post = {
                        dateCreated: formatDate(new Date(rawPost.datePublished)),
                        dateCreatedDate: new Date(rawPost.datePublished),
                        originalHeadline: rawPost.headline,
                        headline: rawPost[`headline_${language}`],
                        publisher: rawPost.publisher,
                        url: rawPost.url,
                        discussionUrl: rawPost.discussionUrl,
                        author: rawPost.author,
                        sameAs: rawPost.sameAs,
                        keywords: rawPost.keywords,
                    };
                    if (rawPost.interactionStatistic) {
                        rawPost.interactionStatistic.forEach((item) => {
                            const key = item.interactionType["@type"];
                            post[key] = item.userInteractionCount;
                        });
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
                path: getSitePath(page === 1
                    ? `public/${languageSlug}index.html`
                    : `public/${languageSlug}page/` + page + "/index.html"),
                output: output,
            });
            if (page === 1) {
                const feed = new Feed({
                    title: siteConfig.name,
                    description: siteConfig.description,
                    id: siteConfig.url,
                    link: siteConfig.url,
                    language: language,
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
                        title: post.headline,
                        id: post.url,
                        link: post.url,
                        description: post.originalHeadline,
                        content: "",
                        author: [
                            {
                                name: post.author.name,
                                link: post.author.url,
                            },
                        ],
                        date: post.dateCreatedDate,
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
                const manifest = {
                    name: siteConfig.name,
                    short_name: siteConfig.alternateName,
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
    for (const page of pages) {
        const output = page.output;
        await ensureDir(dirname(page.path));
        console.log("Build page:", page.path);
        await Deno.writeTextFile(page.path, output);
    }
    await copy(getAppPath(siteIdentifier, "static"), getSitePath("public"), {
        overwrite: true,
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJidWlsZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLFFBQVEsTUFBTSw0Q0FBNEMsQ0FBQztBQUNsRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFDekUsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLHlDQUF5QyxDQUFDO0FBQ3BFLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSwyQ0FBMkMsQ0FBQztBQUNwRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDM0MsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLDBDQUEwQyxDQUFDO0FBRWhFLE9BQU8sRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNoRSxNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUM7QUFDN0IsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ3RCLE1BQU0sU0FBUyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3pDLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN2QyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssVUFBVSxJQUFJLENBQUMsY0FBc0I7SUFDdkQsTUFBTSxVQUFVLEdBQUcsTUFBTSxRQUFRLENBQUMsbUJBQW1CLGNBQWMsUUFBUSxDQUFDO1NBQ3pFLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztTQUN4QixJQUFJLEVBQUU7U0FDTixPQUFPLEVBQUUsQ0FBQztJQUNiLE1BQU0sY0FBYyxHQUFHLFVBQVUsQ0FBQyxjQUFjLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDL0QsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLENB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QixJQUFJLEVBQUUsUUFBUTtpQkFDZixDQUFDO2dCQUNGLEtBQUssQ0FBQyxJQUFJLENBQUM7b0JBQ1QsSUFBSSxFQUFFLFdBQVcsQ0FBQyxrQkFBa0IsWUFBWSxjQUFjLENBQUM7b0JBQy9ELE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2lCQUMxQyxDQUFDLENBQUM7YUFDSjtTQUNGO0tBQ0Y7SUFHRCxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtRQUN4QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBRzNCLE1BQU0sU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNwQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEMsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDN0M7SUFHRCxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFLFFBQVEsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUN0RSxTQUFTLEVBQUUsSUFBSTtLQUNoQixDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGdldEZpbGVzIGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC94L2dldGZpbGVzQHYxLjAuMC9tb2QudHNcIjtcbmltcG9ydCB7IHJlbmRlckZpbGUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9tdXN0YWNoZV90cy9tdXN0YWNoZS50c1wiO1xuaW1wb3J0IHsgZW5zdXJlRGlyIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEyMS4wL2ZzL21vZC50c1wiO1xuaW1wb3J0IHsgZGlybmFtZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xMjEuMC9wYXRoL21vZC50c1wiO1xuaW1wb3J0IHsgRmVlZCB9IGZyb20gXCJodHRwczovL2VzbS5zaC9mZWVkXCI7XG5pbXBvcnQgeyBjb3B5IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEyMS4wL2ZzL2NvcHkudHNcIjtcblxuaW1wb3J0IHsgZ2V0U2l0ZVBhdGgsIGdldEFwcFBhdGgsIGZvcm1hdERhdGUgfSBmcm9tIFwiLi91dGlsLnRzXCI7XG5jb25zdCB0aGVtZUNvbG9yID0gXCIjMTA5NWMxXCI7XG5jb25zdCBwYWdlU2l6ZSA9IDEwMDA7XG5jb25zdCBsYW5ndWFnZXMgPSBbXCJ6aC1IYW5zXCIsIFwiemgtSGFudFwiXTtcbmNvbnN0IGRpc3RQYXRoID0gZ2V0U2l0ZVBhdGgoXCJwdWJsaWNcIik7XG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBtYWluKHNpdGVJZGVudGlmaWVyOiBzdHJpbmcpIHtcbiAgY29uc3QgcG9zdHNGaWxlcyA9IGF3YWl0IGdldEZpbGVzKGAuL3NvdXJjZXMvc2l0ZXMvJHtzaXRlSWRlbnRpZmllcn0vcG9zdHNgKVxuICAgIC5tYXAoKGl0ZW0pID0+IGl0ZW0ucGF0aClcbiAgICAuc29ydCgpXG4gICAgLnJldmVyc2UoKTtcbiAgY29uc3Qgc2l0ZUNvbmZpZ1BhdGggPSBnZXRBcHBQYXRoKHNpdGVJZGVudGlmaWVyLCBcInNpdGUuanNvblwiKTtcbiAgY29uc3Qgc2l0ZUNvbmZpZyA9IEpTT04ucGFyc2UoYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUoc2l0ZUNvbmZpZ1BhdGgpKTtcbiAgY29uc3QgdG90YWxQYWdlcyA9IE1hdGguY2VpbChwb3N0c0ZpbGVzLmxlbmd0aCAvIHBhZ2VTaXplKTtcbiAgYXdhaXQgZW5zdXJlRGlyKGRpc3RQYXRoKTtcbiAgY29uc3QgcGFnZXM6IHsgcGF0aDogc3RyaW5nOyBvdXRwdXQ6IHN0cmluZyB9W10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbFBhZ2VzOyBpKyspIHtcbiAgICBjb25zdCBwYWdlID0gaSArIDE7XG4gICAgY29uc3QgcG9zdHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+W11bXSA9IFtdO1xuICAgIGxhbmd1YWdlcy5mb3JFYWNoKChfLCBpbmRleCkgPT4ge1xuICAgICAgcG9zdHNbaW5kZXhdID0gW107XG4gICAgfSk7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBwYWdlU2l6ZTsgaisrKSB7XG4gICAgICBpZiAocG9zdHNGaWxlc1tpICogcGFnZVNpemUgKyBqXSkge1xuICAgICAgICBjb25zdCBwb3N0RmlsZVBhdGggPSBwb3N0c0ZpbGVzW2kgKiBwYWdlU2l6ZSArIGpdO1xuICAgICAgICBjb25zdCBwb3N0Q29udGVudCA9IGF3YWl0IERlbm8ucmVhZFRleHRGaWxlKHBvc3RGaWxlUGF0aCk7XG4gICAgICAgIGNvbnN0IHJhd1Bvc3QgPSBKU09OLnBhcnNlKHBvc3RDb250ZW50KTtcbiAgICAgICAgbGFuZ3VhZ2VzLmZvckVhY2goKGxhbmd1YWdlLCBpbmRleCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBvc3Q6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge1xuICAgICAgICAgICAgZGF0ZUNyZWF0ZWQ6IGZvcm1hdERhdGUobmV3IERhdGUocmF3UG9zdC5kYXRlUHVibGlzaGVkKSksXG4gICAgICAgICAgICBkYXRlQ3JlYXRlZERhdGU6IG5ldyBEYXRlKHJhd1Bvc3QuZGF0ZVB1Ymxpc2hlZCksXG4gICAgICAgICAgICBvcmlnaW5hbEhlYWRsaW5lOiByYXdQb3N0LmhlYWRsaW5lLFxuICAgICAgICAgICAgaGVhZGxpbmU6IHJhd1Bvc3RbYGhlYWRsaW5lXyR7bGFuZ3VhZ2V9YF0sXG4gICAgICAgICAgICBwdWJsaXNoZXI6IHJhd1Bvc3QucHVibGlzaGVyLFxuXG4gICAgICAgICAgICB1cmw6IHJhd1Bvc3QudXJsLFxuICAgICAgICAgICAgZGlzY3Vzc2lvblVybDogcmF3UG9zdC5kaXNjdXNzaW9uVXJsLFxuICAgICAgICAgICAgYXV0aG9yOiByYXdQb3N0LmF1dGhvcixcbiAgICAgICAgICAgIHNhbWVBczogcmF3UG9zdC5zYW1lQXMsXG4gICAgICAgICAgICBrZXl3b3JkczogcmF3UG9zdC5rZXl3b3JkcyxcbiAgICAgICAgICB9O1xuICAgICAgICAgIGlmIChyYXdQb3N0LmludGVyYWN0aW9uU3RhdGlzdGljKSB7XG4gICAgICAgICAgICByYXdQb3N0LmludGVyYWN0aW9uU3RhdGlzdGljLmZvckVhY2goXG4gICAgICAgICAgICAgIChpdGVtOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IChpdGVtLmludGVyYWN0aW9uVHlwZSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVtcbiAgICAgICAgICAgICAgICAgIFwiQHR5cGVcIlxuICAgICAgICAgICAgICAgIF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICAgIHBvc3Rba2V5XSA9IGl0ZW0udXNlckludGVyYWN0aW9uQ291bnQ7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBvc3RzW2luZGV4XS5wdXNoKHBvc3QpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgbGFuZ3VhZ2VzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgY29uc3QgbGFuZ3VhZ2UgPSBsYW5ndWFnZXNbaW5kZXhdO1xuICAgICAgY29uc3QgbGFuZ3VhZ2VTbHVnID0gbGFuZ3VhZ2UgPT09IFwiemgtSGFuc1wiID8gXCJcIiA6IGAke2xhbmd1YWdlfS9gO1xuICAgICAgY29uc3QgbGFuZ3VhZ2VTbGltID0gbGFuZ3VhZ2UgPT09IFwiemgtSGFuc1wiID8gXCJcIiA6IGBfJHtsYW5ndWFnZX1gO1xuXG4gICAgICBjb25zdCBvdXRwdXQgPSBhd2FpdCByZW5kZXJGaWxlKGdldFNpdGVQYXRoKFwidGVtcGxhdGVzL3Bvc3RzLmh0bWxcIiksIHtcbiAgICAgICAgcG9zdHM6IHBvc3RzW2luZGV4XSxcbiAgICAgICAgcm9vdFVybDogXCIvXCIgKyBsYW5ndWFnZVNsdWcsXG4gICAgICAgIHJzc1VybDogc2l0ZUNvbmZpZy51cmwgKyBgLyR7bGFuZ3VhZ2VTbHVnfXJzcy54bWxgLFxuICAgICAgICBhdG9tVXJsOiBzaXRlQ29uZmlnLnVybCArIGAvJHtsYW5ndWFnZVNsdWd9YXRvbS54bWxgLFxuICAgICAgICBwYWdlVXJsOiBzaXRlQ29uZmlnLnVybCArIGAvJHtsYW5ndWFnZVNsdWd9YCxcbiAgICAgICAgbWFuaWZlc3RVcmw6IGBtYW5pZmVzdCR7bGFuZ3VhZ2VTbGltfS53ZWJtYW5pZmVzdGAsXG4gICAgICAgIGpzb25MRFN0cmluZzogSlNPTi5zdHJpbmdpZnkoc2l0ZUNvbmZpZyksXG4gICAgICAgIGpzb25MRDogc2l0ZUNvbmZpZyxcbiAgICAgICAgbGFuZ3VhZ2U6IGxhbmd1YWdlLFxuICAgICAgICB0aGVtZUNvbG9yOiB0aGVtZUNvbG9yLFxuICAgICAgICBsYW5ndWFnZXM6IGxhbmd1YWdlcy5tYXAoKGxhbmcpID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYWN0aXZlOiBsYW5nID09PSBsYW5ndWFnZSxcbiAgICAgICAgICAgIG5hbWU6IGxhbmcgPT09IFwiemgtSGFuc1wiID8gXCLnroBcIiA6IFwi57mBXCIsXG4gICAgICAgICAgICB1cmw6IGxhbmcgPT09IFwiemgtSGFuc1wiID8gXCIvXCIgOiBgLyR7bGFuZ30vYCxcbiAgICAgICAgICB9O1xuICAgICAgICB9KSxcbiAgICAgIH0pO1xuICAgICAgcGFnZXMucHVzaCh7XG4gICAgICAgIHBhdGg6IGdldFNpdGVQYXRoKFxuICAgICAgICAgIHBhZ2UgPT09IDFcbiAgICAgICAgICAgID8gYHB1YmxpYy8ke2xhbmd1YWdlU2x1Z31pbmRleC5odG1sYFxuICAgICAgICAgICAgOiBgcHVibGljLyR7bGFuZ3VhZ2VTbHVnfXBhZ2UvYCArIHBhZ2UgKyBcIi9pbmRleC5odG1sXCJcbiAgICAgICAgKSxcbiAgICAgICAgb3V0cHV0OiBvdXRwdXQsXG4gICAgICB9KTtcbiAgICAgIGlmIChwYWdlID09PSAxKSB7XG4gICAgICAgIGNvbnN0IGZlZWQgPSBuZXcgRmVlZCh7XG4gICAgICAgICAgdGl0bGU6IHNpdGVDb25maWcubmFtZSxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogc2l0ZUNvbmZpZy5kZXNjcmlwdGlvbixcbiAgICAgICAgICBpZDogc2l0ZUNvbmZpZy51cmwsXG4gICAgICAgICAgbGluazogc2l0ZUNvbmZpZy51cmwsXG4gICAgICAgICAgbGFuZ3VhZ2U6IGxhbmd1YWdlLCAvLyBvcHRpb25hbCwgdXNlZCBvbmx5IGluIFJTUyAyLjAsIHBvc3NpYmxlIHZhbHVlczogaHR0cDovL3d3dy53My5vcmcvVFIvUkVDLWh0bWw0MC9zdHJ1Y3QvZGlybGFuZy5odG1sI2xhbmdjb2Rlc1xuICAgICAgICAgIGltYWdlOiBcImh0dHA6Ly9leGFtcGxlLmNvbS9pbWFnZS5wbmdcIixcbiAgICAgICAgICBmYXZpY29uOiBgJHtzaXRlQ29uZmlnLnVybH0vZmF2aWNvbi5pY29gLFxuICAgICAgICAgIGNvcHlyaWdodDogXCJBbGwgcmlnaHRzIHJlc2VydmVkIDIwMjIsIE93ZW5cIixcbiAgICAgICAgICBmZWVkTGlua3M6IHtcbiAgICAgICAgICAgIGpzb246IGAke3NpdGVDb25maWcudXJsfS9mZWVkLmpzb25gLFxuICAgICAgICAgICAgYXRvbTogYCR7c2l0ZUNvbmZpZy51cmx9L2F0b20ueG1sYCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGF1dGhvcjoge1xuICAgICAgICAgICAgbmFtZTogXCJCdXp6aW5nXCIsXG4gICAgICAgICAgICBlbWFpbDogXCJoZWxsb0BidXp6aW5nLmNjXCIsXG4gICAgICAgICAgICBsaW5rOiBzaXRlQ29uZmlnLnVybCxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgdGhlUG9zdHMgPSBwb3N0c1tpbmRleF07XG5cbiAgICAgICAgdGhlUG9zdHMuZm9yRWFjaCgocG9zdCkgPT4ge1xuICAgICAgICAgIGZlZWQuYWRkSXRlbSh7XG4gICAgICAgICAgICB0aXRsZTogcG9zdC5oZWFkbGluZSBhcyBzdHJpbmcsXG4gICAgICAgICAgICBpZDogcG9zdC51cmwgYXMgc3RyaW5nLFxuICAgICAgICAgICAgbGluazogcG9zdC51cmwgYXMgc3RyaW5nLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IHBvc3Qub3JpZ2luYWxIZWFkbGluZSBhcyBzdHJpbmcsXG4gICAgICAgICAgICBjb250ZW50OiBcIlwiLFxuICAgICAgICAgICAgYXV0aG9yOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAocG9zdC5hdXRob3IgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPikubmFtZSxcbiAgICAgICAgICAgICAgICBsaW5rOiAocG9zdC5hdXRob3IgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPikudXJsLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGRhdGU6IHBvc3QuZGF0ZUNyZWF0ZWREYXRlIGFzIERhdGUsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBwYWdlcy5wdXNoKHtcbiAgICAgICAgICBwYXRoOiBnZXRTaXRlUGF0aChgcHVibGljLyR7bGFuZ3VhZ2VTbHVnfXJzcy54bWxgKSxcbiAgICAgICAgICBvdXRwdXQ6IGZlZWQucnNzMigpLFxuICAgICAgICB9KTtcbiAgICAgICAgcGFnZXMucHVzaCh7XG4gICAgICAgICAgcGF0aDogZ2V0U2l0ZVBhdGgoYHB1YmxpYy8ke2xhbmd1YWdlU2x1Z31hdG9tLnhtbGApLFxuICAgICAgICAgIG91dHB1dDogZmVlZC5hdG9tMSgpLFxuICAgICAgICB9KTtcbiAgICAgICAgcGFnZXMucHVzaCh7XG4gICAgICAgICAgcGF0aDogZ2V0U2l0ZVBhdGgoYHB1YmxpYy8ke2xhbmd1YWdlU2x1Z31mZWVkLmpzb25gKSxcbiAgICAgICAgICBvdXRwdXQ6IGZlZWQuanNvbjEoKSxcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGNyZWF0ZSBtYW5pZmVzdC53ZWJtYW5pZmVzdFxuXG4gICAgICAgIGNvbnN0IG1hbmlmZXN0ID0ge1xuICAgICAgICAgIG5hbWU6IHNpdGVDb25maWcubmFtZSxcbiAgICAgICAgICBzaG9ydF9uYW1lOiBzaXRlQ29uZmlnLmFsdGVybmF0ZU5hbWUsXG4gICAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiBcIi9hbmRyb2lkLWNocm9tZS0xOTJ4MTkyLnBuZ1wiLFxuICAgICAgICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXG4gICAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6IFwiL2FuZHJvaWQtY2hyb21lLTUxMng1MTIucG5nXCIsXG4gICAgICAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgICB0aGVtZV9jb2xvcjogdGhlbWVDb2xvcixcbiAgICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiBcIiNmZmZmZjhcIixcbiAgICAgICAgICBkaXNwbGF5OiBcInN0YW5kYWxvbmVcIixcbiAgICAgICAgICBzdGFydF91cmw6IGAvJHtsYW5ndWFnZVNsdWd9YCxcbiAgICAgICAgICBsYW5nOiBsYW5ndWFnZSxcbiAgICAgICAgfTtcbiAgICAgICAgcGFnZXMucHVzaCh7XG4gICAgICAgICAgcGF0aDogZ2V0U2l0ZVBhdGgoYHB1YmxpYy9tYW5pZmVzdCR7bGFuZ3VhZ2VTbGltfS53ZWJtYW5pZmVzdGApLFxuICAgICAgICAgIG91dHB1dDogSlNPTi5zdHJpbmdpZnkobWFuaWZlc3QsIG51bGwsIDIpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBnZW5lcmF0ZSByc3NcbiAgZm9yIChjb25zdCBwYWdlIG9mIHBhZ2VzKSB7XG4gICAgY29uc3Qgb3V0cHV0ID0gcGFnZS5vdXRwdXQ7XG4gICAgLy8gd3JpdGUgdG8gZmlsZVxuICAgIC8vIGVuc3VyZSBkaXJlY3RvcnkgZXhpc3RzXG4gICAgYXdhaXQgZW5zdXJlRGlyKGRpcm5hbWUocGFnZS5wYXRoKSk7XG4gICAgY29uc29sZS5sb2coXCJCdWlsZCBwYWdlOlwiLCBwYWdlLnBhdGgpO1xuICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShwYWdlLnBhdGgsIG91dHB1dCk7XG4gIH1cblxuICAvLyBjb3B5IHN0YXRpYyBmaWxlc1xuICBhd2FpdCBjb3B5KGdldEFwcFBhdGgoc2l0ZUlkZW50aWZpZXIsIFwic3RhdGljXCIpLCBnZXRTaXRlUGF0aChcInB1YmxpY1wiKSwge1xuICAgIG92ZXJ3cml0ZTogdHJ1ZSxcbiAgfSk7XG59XG4iXX0=