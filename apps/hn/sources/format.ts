import { NewsArticle, Person, Organization } from "https://esm.sh/schema-dts";
import { getYearMonthDay, getDataFilePath } from "../../../common/util.ts";
import { ROOT_DOMAIN, SEPARATOR } from "../../../common/constant.ts";
import { titleCase } from "https://esm.sh/title-case";
export default function (item: Item) {
  const type = "NewsArticle";
  const publisherName = "HackerNews";
  const publisherUrl = `https://news.ycombinator.com`;
  const publisherLogo = "";
  const publisher: Organization = {
    "@type": "Organization",
    name: publisherName,
    url: publisherUrl,
    logo: publisherLogo,
  };

  const langauge = "en";
  let genre: string | undefined;
  if (item._tags && item._tags.length > 3) {
    const tag4 = item._tags[3];
    if (tag4 !== "front_page") {
      genre = titleCase(tag4);
    }
  }
  let headline = item.title;
  if (genre && item.title.startsWith(genre)) {
    headline = item.title.substring(genre.length + 1).trim();
  }
  const now = new Date();
  const nowISO = now.toISOString();
  const { year, month, day } = getYearMonthDay(now);

  const identifier =
    year +
    SEPARATOR +
    month +
    SEPARATOR +
    day +
    SEPARATOR +
    langauge +
    SEPARATOR +
    publisherName +
    SEPARATOR +
    type +
    SEPARATOR +
    item.objectID;
  const pathIdentifier = identifier.split(SEPARATOR).join("/");
  const path = `raw/${pathIdentifier}.json`;
  const url = `https://${year}-${month}.${ROOT_DOMAIN}/${pathIdentifier}/`;
  const keywords: string[] = [];
  if (genre) {
    keywords.push(genre);
  }
  const discussionUrl = `${publisherUrl}/item?id=${item.objectID}`;
  const sameAs = item.url || discussionUrl;

  const author: Person = {
    "@type": "Person",
    name: item.author,
    url: `https://${publisherUrl}/user?id=${item.author}`,
  };
  const newItem: NewsArticle = {
    "@type": type,
    identifier,
    url,
    headline,
    publisher,
    description: "",
    keywords,
    genre,
    author,
    discussionUrl,
    sameAs,
    dateCreated: nowISO,
    datePublished: item.created_at,
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
}
export interface TitleOrUrlOrAuthor {
  value: string;
  matchLevel: string;
  matchedWords?: null[] | null;
}
