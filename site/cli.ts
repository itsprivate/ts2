import build from "./build.ts";
import { parse } from "https://deno.land/std@0.122.0/flags/mod.ts";

export default async function main() {
  const args = parse(Deno.args);
  if (args._.length !== 1) {
    throw new Error("Must specify a site identifier");
  } else {
    const siteIdentifier = args._[0] as string;
    await build(siteIdentifier);
  }
}
main()
  .then(() => {
    console.log("Build Success");
  })
  .catch((e) => {
    console.log("Build Error", e);
    throw e;
  });
