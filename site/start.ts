import build from "./build.ts";
import serve from "./serve.ts";

export default async function main() {
  await build("showhn");
  await serve();
}
main()
  .then(() => {
    console.log("Build Success");
  })
  .catch((e) => {
    console.log("Build Error", e);
    throw e;
  });
