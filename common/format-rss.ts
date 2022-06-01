import { NewsArticle, Person, Organization } from "https://esm.sh/schema-dts";
import {
  getDataFilePath,
  stringifyIdentifier,
  parseIdentifier,
  getPathIdentifierByIdentifier,
} from "./util.ts";
import { ensureDir } from "https://deno.land/std@0.121.0/fs/mod.ts";
import type { SourceOptions } from "https://deno.land/x/denoflow@0.0.34/mod.ts";
import { createHash } from "https://deno.land/std@0.128.0/hash/mod.ts";
import slug from "https://esm.sh/slug";
export default async function (
  item: Item,
  siteIdentifier: string,
  itemSourceOptions: SourceOptions
) {
  // console.log("item", item);

  const type = "NewsArticle";
  const publisherName = item?.author?.name || "RSS";
  const publisherUrl = (itemSourceOptions.args as string[])[0];
  const domain = new URL(publisherUrl).hostname;
  const publisher: Organization = {
    "@type": "Organization",
    name: domain,
    url: publisherUrl,
  };
  const authorName = item?.author?.name || "unknown";

  const sourceLanguage = "en";
  const headline = item.title.value;

  // check if unique
  const postsDirPath = getDataFilePath(`sites/${siteIdentifier}/posts`);
  await ensureDir(postsDirPath);
  const fileNames: string[] = [];
  const now = new Date();
  let dateCreated = now;
  const id = encodeURIComponent(item.id);
  // id hash
  const hash = createHash("md5");
  hash.update(id);
  const hashInHex = hash.toString();
  const identifier = stringifyIdentifier(
    now,
    sourceLanguage,
    slug(publisherName),
    siteIdentifier,
    type,
    hashInHex
  );
  const pathIdentifier = getPathIdentifierByIdentifier(identifier);
  const path = `raw/${pathIdentifier}.json`;
  for await (const dirEntry of Deno.readDir(postsDirPath)) {
    if (dirEntry.isFile && dirEntry.name.endsWith(".json")) {
      const fileName = dirEntry.name.slice(0, -5);

      const parsedIdentifier = parseIdentifier(fileName);
      if (parsedIdentifier.originalId === id && parsedIdentifier.dateCreated) {
        console.log(`Found duplicate ${id}`, parsedIdentifier.dateCreated);
        // try to read it
        const filePath = getDataFilePath(
          `sites/${siteIdentifier}/posts/${fileName}.json`
        );
        const fileData = await Deno.readTextFile(filePath);
        const json = JSON.parse(fileData) as NewsArticle;
        dateCreated = parsedIdentifier.dateCreated;
        json.interactionStatistic = [];
        // only update count
        return {
          item: json,
          path: getDataFilePath(path),
        };
      }
      fileNames.push(dirEntry.name);
    }
  }
  const nowISO = now.toISOString();
  const datePublished = item.updated.toISOString();

  // const url = `https://${year}-${month}.${ROOT_DOMAIN}/${pathIdentifier}/`;
  const discussionUrl = item.links[0].href;

  const url = discussionUrl;
  const keywords: string[] = [];

  const sameAs = discussionUrl;
  // try get image

  const author: Person = {
    "@type": "Person",
    name: authorName,
    url: publisherUrl,
  };
  const description = item?.description?.value ?? "";
  const newItem: NewsArticle = {
    "@type": type,
    identifier,
    url,
    headline,
    publisher,
    description: description,
    keywords,
    author,
    discussionUrl,
    sameAs,
    dateCreated: dateCreated.toISOString(),
    datePublished: datePublished,
    dateModified: nowISO,
    interactionStatistic: [],
  };
  return {
    item: newItem,
    path: getDataFilePath(path),
  };
}

export interface Item {
  "dc:creator": string[];
  id: string;
  title: Description;
  description: Description;
  comments: string;
  published: Date;
  publishedRaw: string;
  updated: Date;
  updatedRaw: string;
  author: Author;
  links: Link[];
}

export interface Author {
  name: string;
}

export interface Description {
  value: string;
}

export interface Link {
  href: string;
}
