import { NewsArticle, Person, Organization } from "https://esm.sh/schema-dts";
import {
  getDataFilePath,
  stringifyIdentifier,
  parseIdentifier,
  getPathIdentifierByIdentifier,
} from "./util.ts";
import { titleCase } from "https://esm.sh/title-case";
import { ensureDir } from "https://deno.land/std@0.121.0/fs/mod.ts";

export default async function (item: Item, siteIdentifier: string) {
  const type = "NewsArticle";
  const publisherName = "HackerNews";
  const publisherUrl = `https://news.ycombinator.com`;
  const publisherLogo = "https://hn.buzzing.cc/avatar.png";
  const publisher: Organization = {
    "@type": "Organization",
    name: publisherName,
    url: publisherUrl,
    logo: publisherLogo,
  };

  const sourceLanguage = "en";
  let genre: string | undefined;
  if (item._tags && item._tags.length > 3) {
    const tag4 = item._tags[3];
    if (tag4 !== "front_page" && tag4 !== undefined) {
      const tag4Arr = tag4.split("_");
      if (tag4Arr.length === 2) {
        genre = `${titleCase(tag4Arr[0])} ${tag4Arr[1].toUpperCase()}`;
      }
    }
  }
  let headline = item.title;
  if (genre && item.title.startsWith(genre)) {
    headline = item.title.substring(genre.length + 1).trim();
  }

  // check if unique
  const postsDirPath = getDataFilePath(`sites/${siteIdentifier}/posts`);
  await ensureDir(postsDirPath);
  const fileNames: string[] = [];
  const now = new Date();
  let dateCreated = now;
  const identifier = stringifyIdentifier(
    now,
    sourceLanguage,
    publisherName,
    siteIdentifier,
    type,
    item.objectID
  );
  const pathIdentifier = getPathIdentifierByIdentifier(identifier);
  const path = `raw/${pathIdentifier}.json`;
  for await (const dirEntry of Deno.readDir(postsDirPath)) {
    if (dirEntry.isFile && dirEntry.name.endsWith(".json")) {
      const fileName = dirEntry.name.slice(0, -5);

      const parsedIdentifier = parseIdentifier(fileName);
      if (
        parsedIdentifier.originalId === item.objectID &&
        parsedIdentifier.dateCreated
      ) {
        console.log(
          `Found duplicate ${item.objectID}`,
          parsedIdentifier.dateCreated
        );
        // try to read it
        const filePath = getDataFilePath(
          `sites/${siteIdentifier}/posts/${fileName}.json`
        );
        const fileData = await Deno.readTextFile(filePath);
        const json = JSON.parse(fileData) as NewsArticle;
        dateCreated = parsedIdentifier.dateCreated;
        json.interactionStatistic = [
          {
            "@type": "InteractionCounter",
            interactionType: {
              "@type": "LikeAction",
            },
            userInteractionCount: item.points,
          },
          {
            "@type": "InteractionCounter",
            interactionType: {
              "@type": "CommentAction",
            },
            userInteractionCount: item.num_comments,
          },
        ];
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
  const datePublished = item.created_at;

  // const url = `https://${year}-${month}.${ROOT_DOMAIN}/${pathIdentifier}/`;
  const discussionUrl = `${publisherUrl}/item?id=${item.objectID}`;

  const url = discussionUrl;
  const keywords: string[] = [];
  if (genre) {
    keywords.push(genre);
  }
  const sameAs = item.url || discussionUrl;
  // try get image

  const author: Person = {
    "@type": "Person",
    name: item.author,
    url: `${publisherUrl}/user?id=${item.author}`,
  };
  let description = "";
  if (item?._highlightResult?.story_text?.value) {
    description = item._highlightResult.story_text.value;
  }
  const newItem: NewsArticle = {
    "@type": type,
    identifier,
    url,
    headline,
    publisher,
    description: description,
    keywords,
    genre,
    author,
    discussionUrl,
    sameAs,
    dateCreated: dateCreated.toISOString(),
    datePublished: datePublished,
    dateModified: nowISO,
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: {
          "@type": "LikeAction",
        },
        userInteractionCount: item.points,
      },
      {
        "@type": "InteractionCounter",
        interactionType: {
          "@type": "CommentAction",
        },
        userInteractionCount: item.num_comments,
      },
    ],
  };
  return {
    item: newItem,
    path: getDataFilePath(path),
  };
}

export interface Item {
  created_at: string;
  title: string;
  url: string;
  author: string;
  points: number;
  story_text?: null;
  comment_text?: null;
  num_comments: number;
  story_id?: null;
  story_title?: null;
  story_url?: null;
  parent_id?: null;
  created_at_i: number;
  _tags?: string[] | null;
  objectID: string;
  _highlightResult: HighlightResult;
}
export interface HighlightResult {
  title: TitleOrUrlOrAuthor;
  url: TitleOrUrlOrAuthor;
  author: TitleOrUrlOrAuthor;
  story_text: TitleOrUrlOrAuthor;
}
export interface TitleOrUrlOrAuthor {
  value: string;
  matchLevel: string;
  matchedWords?: null[] | null;
}
