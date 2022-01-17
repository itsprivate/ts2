import { NewsArticle, Person, Organization } from "https://esm.sh/schema-dts";
import { TARGET_LANGUAGES, TRANSLATED_FIELDS } from "../common/constant.ts";
import {
  parseIdentifier,
  getPathIdentifierByIdentifier,
  writeJson,
} from "../common/util.ts";
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

  // await page.goto("https://example.com");
  // await page.screenshot({ path: "example.png" });

  const setence = "hello world";
  const source = "en";
  let target = "zh-ZH";

  let currentHandledFiles = 0;
  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
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

    const file = files[fileIndex];
    console.log("file", file);
    const parsedFilePath = parse(file);
    const identifier = parsedFilePath.name;
    const pathIdentifier = getPathIdentifierByIdentifier(identifier);
    const parsedIdentifier = parseIdentifier(identifier);
    const sourceLanguage = parsedIdentifier.language;

    const data = await Deno.readTextFile(file);
    const item = JSON.parse(data) as NodeObject;
    console.log("item", item);
    const context: ContextDefinition = {
      "@version": "1.1",
      "@vocab": "https://schema.org/",
      "@language": sourceLanguage,
    };
    for (const targetLanguage of TARGET_LANGUAGES) {
      // TODO
      for (const translatedKey of TRANSLATED_FIELDS) {
        if (item.headline && !item[`headline_${targetLanguage}`]) {
          const dTargetLanguage = toDLanguage(targetLanguage);
          const translated = await d(
            page,
            item.headline,
            sourceLanguage,
            dTargetLanguage
          );
          console.log("source", parsedIdentifier.language, item.headline);
          console.log("translated", dTargetLanguage, translated.result);
          const targetHant =
            targetLanguage === "zh-Hans" ? "zh-Hant" : undefined;
          if (translated.result) {
            let translatedKey = `headline_${targetLanguage}`;
            item[translatedKey] = translated.result;
            context[translatedKey] = {
              "@id": "headline",
              "@language": targetLanguage,
            };
            // change context
            if (targetHant) {
              translatedKey = `headline_${targetHant}`;
              item[translatedKey] = zhToHant(translated.result);
              context[translatedKey] = {
                "@id": "headline",
                "@language": targetLanguage,
              };
            }
          } else {
            throw new Error(translated.result);
          }
        }
      }
    }
    item["@context"] = ["https://schema.org", context];
    console.log("final item", item);
    // write to changed path
    await writeJson(`changed/${pathIdentifier}.json`, item);
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

function toDLanguage(lang: string) {
  if (lang === "zh-Hans") {
    return "zh-ZH";
  } else {
    return lang;
  }
}
