import { assertEquals } from "https://deno.land/std@0.121.0/testing/asserts.ts";
import { translateItem } from "./translate.ts";

// Simple name and function, compact form, but not configurable
Deno.test("translate item", async () => {
  const item = {
    "@type": "NewsArticle",
    identifier: "2022--01--17--en--HackerNews--NewsArticle--29902846",
    url: "https://2022-01.buzzing.cc/2022/01/17/en/HackerNews/NewsArticle/2022--01--17--en--HackerNews--NewsArticle--29902846/",
    headline: "State of Machine Learning in Julia",
    publisher: {
      "@type": "Organization",
      name: "HackerNews",
      url: "https://news.ycombinator.com",
      logo: "",
    },
    description: "test",
    sharedContent: {
      description: "quote description",
      headline: "quote headline",
    },
    keywords: [],
    author: {
      "@type": "Person",
      name: "agnosticmantis",
      url: "https://https://news.ycombinator.com/user?id=agnosticmantis",
    },
    discussionUrl: "https://news.ycombinator.com/item?id=29902846",
    sameAs:
      "https://discourse.julialang.org/t/state-of-machine-learning-in-julia/74385",
    dateCreated: "2022-01-17T18:13:14.264Z",
    datePublished: "2022-01-12T05:56:04.000Z",
    dateModified: "2022-01-17T18:13:14.264Z",
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: {
          "@type": "LikeAction",
        },
        userInteractionCount: 107,
      },
      {
        "@type": "InteractionCounter",
        interactionType: {
          "@type": "CommentAction",
        },
        userInteractionCount: 9,
      },
    ],
  };
  const target = await translateItem(item, null);
  assertEquals(
    target[`headline_zh-Hans`],
    "State of Machine Learning in Julia"
  );
  assertEquals(target[`description_zh-Hans`], "test");
  assertEquals(
    (target.sharedContent as Record<string, string>)[`description_zh-Hans`],
    "quote description"
  );
  assertEquals(
    (target.sharedContent as Record<string, string>)[`headline_zh-Hant`],
    "quote headline"
  );
  assertEquals(
    (
      target[`@context`] as unknown as Record<string, Record<string, string>>[]
    )[1][`headline_zh-Hant`][`@language`],
    "zh-Hant"
  );
});
