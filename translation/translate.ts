import { NewsArticle, Person, Organization } from "https://esm.sh/schema-dts";
import { TARGET_LANGUAGES } from "../common/constant.ts";
import puppeteer, {
  Browser,
  Page,
} from "https://deno.land/x/puppeteer@9.0.2/mod.ts";
import d from "./d.js";
// import { JsonLdDocument } from "https://denopkg.com/DefinitelyTyped/DefinitelyTyped@master/types/jsonld/index.d.ts";
import { NodeObject } from "https://cdn.skypack.dev/jsonld?dts";
const homepage = "https://www.deepl.com/translator";
// const homepage = "https://baidu.com";

export default async function (files: string[]) {
  const results: boolean[] = [];
  let browser: Browser | null = null;
  let page: Page | null = null;
  const getBrowser = async () => {
    if (browser) return browser;
    browser = await puppeteer.launch({
      devtools: false,
      headless: true,
      defaultViewport: { width: 1370, height: 1200 },
      args: ["--lang=zh-Hans,zh", "--disable-gpu"],
    });
    browser.on("disconnected", () => (browser = null));
    return browser;
  };

  const getNewPage = async (): Promise<Page> => {
    if (page) return page;
    browser = await getBrowser();
    const pages = await browser.pages();
    if (pages[0]) {
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

    await page.waitForTimeout(3000);
    await page.screenshot({ path: "example.png" });

    return page;
  };

  // open puppeteer
  page = await getNewPage();
  // await page.goto("https://example.com");
  // await page.screenshot({ path: "example.png" });

  const setence = "hello world";
  const source = "en";
  let target = "zh-ZH";

  const translated = await d(page, setence, source, target);
  console.log("translated", translated);
  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const file = files[fileIndex];
    console.log("file", file);

    const data = await Deno.readTextFile(file);
    const item = JSON.parse(data) as NodeObject;
    console.log("item", item);

    for (const targetLanguage of TARGET_LANGUAGES) {
      console.log("targetLanguage", targetLanguage);

      if (item.headline && !item[`headline_${targetLanguage}`]) {
        item[`headline_${targetLanguage}`] = item.headline;
      }
    }
    console.log("item", item);

    results.push(true);
  }
  if (page) {
    await page.close();
  }
  // quit puppeteer
  if (browser) {
    await browser!.close();
  }

  return results;
}
