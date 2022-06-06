import {
  customLoader,
  parseIdentifier,
  getDataFilePath,
  writeJson,
} from "../common/util.ts";
import jsonld from "https://denopkg.com/theowenyoung/jsonld.js@main/index.js";
import GithubSlugger from "https://esm.sh/github-slugger";
import { ensureDir, move } from "https://deno.land/std@0.121.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.121.0/path/mod.ts";
import { SEPARATOR } from "../common/constant.ts";
// import jsonld from "../../jsonld.js/index.js";

export default async function to(file: string) {
  // get item
  // add to archive
  const data = await Deno.readTextFile(file);
  const item = JSON.parse(data);
  const identifier = item.identifier as string;
  const createdTime = new Date(item.dateCreated).getTime();
  const { year, month, siteIdentifier } = parseIdentifier(identifier);

  // transfer to sites/posts folder

  let fileNames: string[] = [];
  const postsDirPath = getDataFilePath(`sites/${siteIdentifier}/posts`);
  await ensureDir(postsDirPath);
  const newPostPath = `t${createdTime}${SEPARATOR}${identifier}.json`;
  console.log("Move ", file, "to", newPostPath);

  await move(file, join(postsDirPath, newPostPath), {
    overwrite: true,
  });
  // mv json to

  for await (const dirEntry of Deno.readDir(postsDirPath)) {
    if (dirEntry.isFile && dirEntry.name.endsWith(".json")) {
      fileNames.push(dirEntry.name);
    }
  }

  if (fileNames.length > 1000) {
    console.log("posts >1000", fileNames.length);
    fileNames = fileNames.sort();

    // delete old files
    for (let i = 0; i < fileNames.length - 1000; i++) {
      console.log(`remove ${fileNames[i]}`);
      await Deno.remove(join(postsDirPath, fileNames[i]));
    }
  }

  const archiveFielPath = getDataFilePath(
    `sites/${siteIdentifier}/archive/${year}/${month}.json`
  );

  let archiveData: Record<string, unknown> = {};
  try {
    // try to get archive
    const archiveDataString = await Deno.readTextFile(archiveFielPath);
    archiveData = JSON.parse(archiveDataString);
  } catch (_e) {
    // ignore
  }
  const formatedResult = await formatArchiveData(item);
  archiveData[identifier] = formatedResult.postInfo;
  // write to archive
  await writeJson(archiveFielPath, archiveData);

  for (const slug of formatedResult.slugs) {
    const slugsFilePath = getDataFilePath(
      `sites/${siteIdentifier}/tags/${slug}.json`
    );
    let slugsData: Record<string, Record<string, string>> = {};
    try {
      // try to get archive
      const slugsDataString = await Deno.readTextFile(slugsFilePath);
      slugsData = JSON.parse(slugsDataString);
    } catch (_e) {
      // ignore
    }

    slugsData[identifier] = formatedResult.postInfo;
    let slugKeys: string[] = Object.keys(slugsData).sort((a, b) => {
      return new Date(slugsData[a].dateCreated) <
        new Date(slugsData[b].dateCreated)
        ? 1
        : -1;
    });

    if (slugKeys.length > 100) {
      slugKeys = slugKeys.slice(0, 100);
    }
    const initTagsData: Record<string, Record<string, string>> = {};
    const newTagsData = slugKeys.reduce((acc, key) => {
      acc[key] = slugsData[key];
      return acc;
    }, initTagsData);
    // write to archive
    await writeJson(slugsFilePath, newTagsData);
  }
  return item;
}

export async function formatArchiveData(item: unknown) {
  // console.log("expanded", expanded);
  const expanded = await jsonld.expand(item, { documentLoader: customLoader });

  const headlines = expanded[0]["http://schema.org/headline"] as Record<
    string,
    string
  >[];

  const postInfo: Record<string, string> = {
    dateCreated: (item as Record<string, string>).dateCreated,
  };
  headlines.forEach((headline) => {
    postInfo[headline["@language"]] = headline["@value"];
  });
  // get tags
  const slugger = new GithubSlugger();

  const keywords = expanded[0]["http://schema.org/keywords"] as Record<
    string,
    string
  >[];
  const slugs: string[] = [];
  keywords.forEach((keyword) => {
    const slug = slugger.slug(keyword["@value"]);
    slugs.push(slug);
  });

  return {
    postInfo,
    slugs: slugs,
  };
}
