import { assertEquals } from "https://deno.land/std@0.121.0/testing/asserts.ts";
import main from "./zh-to-hant.ts";

// Simple name and function, compact form, but not configurable
Deno.test("translate zh to hant", () => {
  const target = main("汉字");
  assertEquals(target, "漢字");
});
