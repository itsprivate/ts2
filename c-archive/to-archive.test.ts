import { assertEquals } from "https://deno.land/std@0.121.0/testing/asserts.ts";
import { formatArchiveData } from "./to-archive.ts";
const json = {
  "@context": {
    "@vocab": "http://schema.org/",
    "@language": "en",
  },
  "@type": "NewsArticle",
  identifier: "2022--02--02--en--showhn--HackerNews--NewsArticle--30171586",
  url: "https://news.ycombinator.com/item?id=30171586",
  headline: "MastermindWord – Wordle more than once a day",
  publisher: {
    "@type": "Organization",
    name: "HackerNews",
    url: "https://news.ycombinator.com",
    logo: "https://hn.buzzing.cc/avatar.png",
  },
  description: "",
  keywords: ["Show HN"],
  genre: "Show HN",
  author: {
    "@type": "Person",
    name: "rrmm",
    url: "https://news.ycombinator.com/user?id=rrmm",
  },
  discussionUrl: "https://news.ycombinator.com/item?id=30171586",
  sameAs: "https://rrmm.github.io/mastermind-word/",
  dateCreated: "2022-02-02T01:38:05.205Z",
  datePublished: "2022-02-01T23:59:06.000Z",
  dateModified: "2022-02-02T01:38:05.205Z",
  interactionStatistic: [
    {
      "@type": "InteractionCounter",
      interactionType: {
        "@type": "LikeAction",
      },
      userInteractionCount: 2,
    },
    {
      "@type": "InteractionCounter",
      interactionType: {
        "@type": "CommentAction",
      },
      userInteractionCount: 0,
    },
  ],
};
const json1 = {
  "@type": "NewsArticle",
  identifier: "2022--01--20--en--askhn--HackerNews--NewsArticle--30005895",
  url: "https://news.ycombinator.com/item?id=30005895",
  headline: "Ask HN: Does test driven development produce better software?",
  publisher: {
    "@type": "Organization",
    name: "HackerNews",
    url: "https://news.ycombinator.com",
    logo: "https://hn.buzzing.cc/avatar.png",
  },
  description: "",
  keywords: ["Ask HN"],
  genre: "Ask HN",
  author: {
    "@type": "Person",
    name: "wizardofmysore",
    url: "https://news.ycombinator.com/user?id=wizardofmysore",
  },
  discussionUrl: "https://news.ycombinator.com/item?id=30005895",
  sameAs: "https://news.ycombinator.com/item?id=30005895",
  dateCreated: "2022-01-20T19:56:31.415Z",
  datePublished: "2022-01-20T07:33:55.000Z",
  dateModified: "2022-01-20T19:56:31.415Z",
  interactionStatistic: [
    {
      "@type": "InteractionCounter",
      interactionType: {
        "@type": "LikeAction",
      },
      userInteractionCount: 1,
    },
    {
      "@type": "InteractionCounter",
      interactionType: {
        "@type": "CommentAction",
      },
      userInteractionCount: 0,
    },
  ],
  "headline_zh-Hans": "Ask HN: 测试驱动开发是否会产生更好的软件？",
  "headline_zh-Hant": "Ask HN: 測試驅動開發是否會產生更好的軟件？",
  "@context": [
    "https://schema.org",
    {
      "@vocab": "https://schema.org/",
      "@language": "en",
      "headline_zh-Hans": {
        "@id": "headline",
        "@language": "zh-Hans",
      },
      "headline_zh-Hant": {
        "@id": "headline",
        "@language": "zh-Hant",
      },
      "@version": 1.1,
    },
  ],
};
Deno.test("archiveformatitem1", async () => {
  const result = await formatArchiveData(json);
  assertEquals(result, {
    postInfo: {
      dateCreated: "2022-02-02T01:38:05.205Z",
      en: "MastermindWord – Wordle more than once a day",
    },
    slugs: ["show-hn"],
  });
});
Deno.test("archiveformatitem2", async () => {
  const result = await formatArchiveData(json1);
  assertEquals(result, {
    postInfo: {
      dateCreated: "2022-01-20T19:56:31.415Z",
      en: "Ask HN: Does test driven development produce better software?",
      "zh-hans": "Ask HN: 测试驱动开发是否会产生更好的软件？",
      "zh-hant": "Ask HN: 測試驅動開發是否會產生更好的軟件？",
    },
    slugs: ["ask-hn"],
  });
});
