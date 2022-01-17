import { assertEquals } from "https://deno.land/std@0.121.0/testing/asserts.ts";
import main from "./format.ts";
import { getJsonLd } from "../../../common/util.ts";
const dirname = new URL(".", import.meta.url).pathname;

// Simple name and function, compact form, but not configurable
Deno.test("format hn", () => {
  const originalItem = JSON.parse(
    Deno.readTextFileSync(`${dirname}original-item.json`)
  );
  const newItem = main(originalItem);
  const _jsonLd = getJsonLd(newItem.item);

  const expectedNewItem = JSON.parse(
    Deno.readTextFileSync(`${dirname}expected-item.json`)
  );
  assertEquals(newItem.item.headline, expectedNewItem.headline);
});
