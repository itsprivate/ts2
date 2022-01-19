import { S3Bucket } from "https://deno.land/x/s3@0.5.0/mod.ts";
const isDev = Deno.env.get("ENV") === "dev";

export default async function (file: string) {
  const bucketPath = file.split("/").slice(2).join("/");
  // add to archive
  if (isDev) {
    // do nothing
  } else {
    // Create a bucket instance manuely.
    const bucket = new S3Bucket({
      accessKeyID: Deno.env.get("SCALEWAY_ACCESS_KEY_ID")!,
      secretKey: Deno.env.get("SCALEWAY_SECRET_ACCESS_KEY")!,
      bucket: "b-posts",
      region: "nl-ams",
      endpointURL: "https://s3.nl-ams.scw.cloud",
    });
    // // Put an object into a bucket.
    await bucket.putObject(bucketPath, await Deno.readFile(file), {
      contentType: "application/json",
    });
  }
}
