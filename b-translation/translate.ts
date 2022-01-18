import { TARGET_LANGUAGES, TRANSLATED_FIELDS } from "../common/constant.ts";
import {
  parseIdentifier,
  getPathIdentifierByIdentifier,
  writeJson,
  get,
  getDataFilePath,
} from "../common/util.ts";
import set from "https://deno.land/x/lodash@4.17.15-es/set.js";
import { parse } from "https://deno.land/std@0.121.0/path/mod.ts";
import puppeteer, {
  Browser,
  Page,
} from "https://deno.land/x/puppeteer@9.0.2/mod.ts";
import d from "./d.js";
// import { JsonLdDocument } from "https://denopkg.com/DefinitelyTyped/DefinitelyTyped@master/types/jsonld/index.d.ts";
import {
  NodeObject,
  ContextDefinition,
} from "https://cdn.skypack.dev/jsonld?dts";
import zhToHant from "./zh-to-hant.ts";
const homepage = "https://www.deepl.com/translator";
const isDev = Deno.env.get("ENVIRONMENT") === "development";
export default async function (files: string[]) {
  const results: boolean[] = [];
  let browser: Browser | null = null;
  let page: Page | null = null;
  const getBrowser = async () => {
    if (browser) return browser;
    browser = await puppeteer.launch({
      devtools: false,
      headless: false,
      defaultViewport: { width: 1370, height: 1200 },
      args: ["--lang=zh-Hans,zh", "--disable-gpu"],
    });
    browser.on("disconnected", () => (browser = null));
    return browser;
  };

  const getNewPage = async (force: boolean): Promise<Page> => {
    if (page) return page;
    browser = await getBrowser();
    const pages = await browser.pages();
    if (pages[0] && !force) {
      page = pages[0];
    } else {
      page = await browser.newPage();
    }
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
    );
    console.log("yhhh");

    // await page.setViewport({ width: 1370, height: 1200 });
    await page.goto(homepage, { waitUntil: "domcontentloaded" });

    await page.waitForTimeout(2000);
    // await page.screenshot({ path: "example.png" });

    return page;
  };
  // handled files number
  let currentHandledFiles = 0;
  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    if (!isDev) {
      if (currentHandledFiles > 100) {
        currentHandledFiles = 1;
        // refresh page
        browser = await getBrowser();
        const pages = await browser!.pages();

        if (pages.length > 1 && page) {
          page!.close();
        }
        page = null;
        page = await getNewPage(true);
      } else {
        currentHandledFiles++;
        // open puppeteer
        page = await getNewPage(false);
      }
    }
    const file = files[fileIndex];
    const parsedFilePath = parse(file);
    const identifier = parsedFilePath.name;
    const pathIdentifier = getPathIdentifierByIdentifier(identifier);

    const data = await Deno.readTextFile(file);
    const item = JSON.parse(data) as NodeObject;
    const finalItem = await translateItem(item, page);
    // write to changed path
    await writeJson(
      getDataFilePath(`changed/${pathIdentifier}.json`),
      finalItem
    );
    results.push(true);
  }
  if (page) {
    await page.close();
  }
  // quit puppeteer
  if (browser) {
    await (browser as Browser)!.close();
  }

  return results;
}
export async function translateItem(item: NodeObject, page: Page | null) {
  if (!(item && item.identifier)) {
    throw new Error("Invalid item, item must have identifier");
  }
  const identifier = item.identifier as string;
  const parsedIdentifier = parseIdentifier(identifier);
  const sourceLanguage = parsedIdentifier.language;

  console.log("item", item);
  let context: ContextDefinition = {
    "@vocab": "https://schema.org/",
    "@language": sourceLanguage,
  };
  for (const targetLanguage of TARGET_LANGUAGES) {
    // TODO
    for (const translatedKey of TRANSLATED_FIELDS) {
      const translatedValue = get(item, translatedKey);
      const translatedTargetKey = `${translatedKey}_${targetLanguage}`;

      const translatedTargetValue = get(item, translatedTargetKey);
      if (translatedValue && translatedTargetValue === undefined) {
        const dTargetLanguage = toDLanguage(targetLanguage);
        const translated = await d(
          page,
          translatedValue,
          sourceLanguage,
          dTargetLanguage,
          {
            mock: isDev || page === null,
          }
        );
        console.log(
          "source",
          translatedKey,
          parsedIdentifier.language,
          item.headline
        );
        console.log(
          "translated",
          translatedTargetKey,
          dTargetLanguage,
          translated.result
        );
        const targetHant = targetLanguage === "zh-Hans" ? "zh-Hant" : undefined;
        if (translated.result) {
          item = set(
            item,
            translatedTargetKey,
            translated.result
          ) as NodeObject;
          context = set(context, getContextKey(translatedTargetKey), {
            "@id": getContextKey(translatedKey),
            "@language": targetLanguage,
          }) as ContextDefinition;
          // change context
          if (targetHant) {
            const translatedTargetHantKey = `${translatedKey}_${targetHant}`;

            item = set(
              item,
              translatedTargetHantKey,
              zhToHant(translated.result)
            ) as NodeObject;
            context = set(context, getContextKey(translatedTargetHantKey), {
              "@id": getContextKey(translatedKey),
              "@language": targetHant,
            }) as ContextDefinition;
          }
        } else {
          throw new Error(translated.result);
        }
      }
    }
  }
  (context as Record<string, number>)["@version"] = 1.1;
  item["@context"] = ["https://schema.org", context];
  console.log("final item", JSON.stringify(item, null, 2));
  return item;
}

function toDLanguage(lang: string) {
  if (lang === "zh-Hans") {
    return "zh-ZH";
  } else {
    return lang;
  }
}

function getContextKey(key: string) {
  const lastDotIndex = key.lastIndexOf(".");
  const isIncludeNest = lastDotIndex > 0;
  // sharedContent.headline
  const translatedContextTargetKey = key.substring(
    isIncludeNest ? lastDotIndex + 1 : 0,
    key.length
  );
  return translatedContextTargetKey;
}
