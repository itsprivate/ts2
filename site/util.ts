import { join } from "https://deno.land/std@0.121.0/path/mod.ts";

export const getSitePath = (relativePath: string) => {
  return join("site", relativePath);
};
