import { resolve, join } from "https://deno.land/std@0.121.0/path/mod.ts";
import { SEPARATOR } from "./constant.ts";
import { ensureFile } from "https://deno.land/std@0.121.0/fs/mod.ts";
import schema from "../common/schema-org.js";
const isDev = Deno.env.get("ENV") === "dev";
export function getDateString(date) {
    const { year, month, day } = getYearMonthDay(date);
    return `${year}-${month}-${day}`;
}
export function getYearMonthDay(date) {
    const year = date.getUTCFullYear();
    const month = addZero(date.getUTCMonth() + 1);
    const day = addZero(date.getUTCDate());
    return {
        year,
        month,
        day,
    };
}
export function addZero(number) {
    return ("0" + number).slice(-2);
}
export function getJsonLd(json) {
    json["@context"] =
        "https://schema.org";
    const jsonWithContext = json;
    return `<script type="application/ld+json">
${JSON.stringify(jsonWithContext)}
</script>`;
}
export function getCwdPath() {
    const dirname = new URL(".", import.meta.url).pathname;
    return resolve(dirname, "../");
}
export function getDataFilePath(relativePath) {
    if (isDev) {
        return join("./dev-sources", relativePath);
    }
    else {
        return join("./sources", relativePath);
    }
}
export function stringifyIdentifier(date, sourceLanguage, publisherName, siteIdentifier, postType, originalId) {
    const { year, month, day } = getYearMonthDay(date);
    const identifierPrefix = year +
        SEPARATOR +
        month +
        SEPARATOR +
        day +
        SEPARATOR +
        sourceLanguage +
        SEPARATOR +
        siteIdentifier +
        SEPARATOR +
        publisherName +
        SEPARATOR +
        postType;
    const identifier = identifierPrefix + SEPARATOR + originalId;
    return identifier;
}
export function getPathIdentifierByIdentifier(identifier) {
    const parts = identifier.split(SEPARATOR);
    const part0 = parts[0];
    if (part0.startsWith("t")) {
        parts.shift();
    }
    const identifierPrefix = parts.slice(0, -1).join(SEPARATOR);
    const pathIdentifier = identifierPrefix.split(SEPARATOR).join("/") + "/" + identifier;
    return pathIdentifier;
}
export function parseIdentifier(identifier) {
    const parts = identifier.split(SEPARATOR);
    const part0 = parts[0];
    let dateCreated;
    if (part0.startsWith("t")) {
        parts.shift();
        dateCreated = new Date(parseInt(part0.slice(1), 10));
    }
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    const sourceLanguage = parts[3];
    const siteIdentifier = parts[4];
    const publisherName = parts[5];
    const postType = parts[6];
    const originalId = parts[7];
    const obj = {
        year,
        month,
        day,
        language: sourceLanguage,
        publisherName,
        siteIdentifier,
        postType,
        originalId,
    };
    if (dateCreated) {
        obj.dateCreated = dateCreated;
    }
    return obj;
}
export async function writeJson(path, data) {
    console.log("writing json to", path);
    await ensureFile(path);
    await Deno.writeTextFile(path, JSON.stringify(data, null, 2));
}
export async function getJson(path, data) { }
export const get = (obj, path, defaultValue = undefined) => {
    const travel = (regexp) => String.prototype.split
        .call(path, regexp)
        .filter(Boolean)
        .reduce((res, key) => res !== null && res !== undefined
        ? res[key]
        : res, obj);
    const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
    return result === undefined || result === obj ? defaultValue : result;
};
const CONTEXTS = {
    "https://schema.org": schema,
};
export const customLoader = async (url) => {
    if (url in CONTEXTS) {
        return {
            contextUrl: null,
            document: CONTEXTS[url],
            documentUrl: url,
        };
    }
    const theUrl = `${url}/docs/jsonldcontext.jsonld`;
    let result = await fetch(theUrl, {
        headers: {
            accept: "application/ld+json, application/json",
        },
    });
    result = await result.json();
    return {
        contextUrl: null,
        document: result,
        documentUrl: url,
    };
};
export function getFinalHeadline(item, headline) {
    const name = get(item, "name");
    const genre = get(item, "genre");
    let title = ``;
    if (genre) {
        title += `${genre}: `;
    }
    if (name) {
        title += `${name} - `;
    }
    if (headline) {
        title += headline;
    }
    return title;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSwyQ0FBMkMsQ0FBQztBQUMxRSxPQUFPLEVBQWUsU0FBUyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ3ZELE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQztBQUNyRSxPQUFPLE1BQU0sTUFBTSx5QkFBeUIsQ0FBQztBQUM3QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLENBQUM7QUFFNUMsTUFBTSxVQUFVLGFBQWEsQ0FBQyxJQUFVO0lBQ3RDLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNuRCxPQUFPLEdBQUcsSUFBSSxJQUFJLEtBQUssSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUNuQyxDQUFDO0FBQ0QsTUFBTSxVQUFVLGVBQWUsQ0FBQyxJQUFVO0lBQ3hDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUNuQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzlDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztJQUN2QyxPQUFPO1FBQ0wsSUFBSTtRQUNKLEtBQUs7UUFDTCxHQUFHO0tBQ0osQ0FBQztBQUNKLENBQUM7QUFDRCxNQUFNLFVBQVUsT0FBTyxDQUFDLE1BQWM7SUFDcEMsT0FBTyxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQyxDQUFDO0FBRUQsTUFBTSxVQUFV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QUk7UUFDaEIsUUFBUSxFQUFFLE1BQU07UUFDaEIsV0FBVyxFQUFFLEdBQUc7S0FDakIsQ0FBQztBQUNKLENBQUMsQ0FBQztBQUVGLE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxJQUFhLEVBQUUsUUFBZ0I7SUFDOUQsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvQixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ2pDLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztJQUNmLElBQUksS0FBSyxFQUFFO1FBQ1QsS0FBSyxJQUFJLEdBQUcsS0FBSyxJQUFJLENBQUM7S0FDdkI7SUFDRCxJQUFJLElBQUksRUFBRTtRQUNSLEtBQUssSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDO0tBQ3ZCO0lBQ0QsSUFBSSxRQUFRLEVBQUU7UUFDWixLQUFLLElBQUksUUFBUSxDQUFDO0tBQ25CO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT3JnYW5pemF0aW9uLCBUaGluZywgV2l0aENvbnRleHQgfSBmcm9tIFwiaHR0cHM6Ly9lc20uc2gvc2NoZW1hLWR0c1wiO1xuaW1wb3J0IHsgcmVzb2x2ZSwgam9pbiB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xMjEuMC9wYXRoL21vZC50c1wiO1xuaW1wb3J0IHsgUk9PVF9ET01BSU4sIFNFUEFSQVRPUiB9IGZyb20gXCIuL2NvbnN0YW50LnRzXCI7XG5pbXBvcnQgeyBlbnN1cmVGaWxlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEyMS4wL2ZzL21vZC50c1wiO1xuaW1wb3J0IHNjaGVtYSBmcm9tIFwiLi4vY29tbW9uL3NjaGVtYS1vcmcuanNcIjtcbmNvbnN0IGlzRGV2ID0gRGVuby5lbnYuZ2V0KFwiRU5WXCIpID09PSBcImRldlwiO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGF0ZVN0cmluZyhkYXRlOiBEYXRlKSB7XG4gIGNvbnN0IHsgeWVhciwgbW9udGgsIGRheSB9ID0gZ2V0WWVhck1vbnRoRGF5KGRhdGUpO1xuICByZXR1cm4gYCR7eWVhcn0tJHttb250aH0tJHtkYXl9YDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRZZWFyTW9udGhEYXkoZGF0ZTogRGF0ZSkge1xuICBjb25zdCB5ZWFyID0gZGF0ZS5nZXRVVENGdWxsWWVhcigpO1xuICBjb25zdCBtb250aCA9IGFkZFplcm8oZGF0ZS5nZXRVVENNb250aCgpICsgMSk7XG4gIGNvbnN0IGRheSA9IGFkZFplcm8oZGF0ZS5nZXRVVENEYXRlKCkpO1xuICByZXR1cm4ge1xuICAgIHllYXIsXG4gICAgbW9udGgsXG4gICAgZGF5LFxuICB9O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGFkZFplcm8obnVtYmVyOiBudW1iZXIpIHtcbiAgcmV0dXJuIChcIjBcIiArIG51bWJlcikuc2xpY2UoLTIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SnNvbkxkPFQgZXh0ZW5kcyBUaGluZz4oanNvbjogVCk6IHN0cmluZyB7XG4gIChqc29uIGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPilbXCJAY29udGV4dFwiXSA9XG4gICAgXCJodHRwczovL3NjaGVtYS5vcmdcIjtcbiAgY29uc3QganNvbldpdGhDb250ZXh0OiBXaXRoQ29udGV4dDxUPiA9IGpzb24gYXMgV2l0aENvbnRleHQ8VD47XG4gIHJldHVybiBgPHNjcmlwdCB0eXBlPVwiYXBwbGljYXRpb24vbGQranNvblwiPlxuJHtKU09OLnN0cmluZ2lmeShqc29uV2l0aENvbnRleHQpfVxuPC9zY3JpcHQ+YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN3ZFBhdGgoKTogc3RyaW5nIHtcbiAgY29uc3QgZGlybmFtZSA9IG5ldyBVUkwoXCIuXCIsIGltcG9ydC5tZXRhLnVybCkucGF0aG5hbWU7XG4gIHJldHVybiByZXNvbHZlKGRpcm5hbWUsIFwiLi4vXCIpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldERhdGFGaWxlUGF0aChyZWxhdGl2ZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vIGNvbnN0IGN3ZCA9IGdldEN3ZFBhdGgoKTtcbiAgLy8gY2hlY2sgZGV2XG4gIGlmIChpc0Rldikge1xuICAgIHJldHVybiBqb2luKFwiLi9kZXYtc291cmNlc1wiLCByZWxhdGl2ZVBhdGgpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBqb2luKFwiLi9zb3VyY2VzXCIsIHJlbGF0aXZlUGF0aCk7XG4gIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdpZnlJZGVudGlmaWVyKFxuICBkYXRlOiBEYXRlLFxuICBzb3VyY2VMYW5ndWFnZTogc3RyaW5nLFxuICBwdWJsaXNoZXJOYW1lOiBzdHJpbmcsXG4gIHNpdGVJZGVudGlmaWVyOiBzdHJpbmcsXG4gIHBvc3RUeXBlOiBzdHJpbmcsXG4gIG9yaWdpbmFsSWQ6IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgY29uc3QgeyB5ZWFyLCBtb250aCwgZGF5IH0gPSBnZXRZZWFyTW9udGhEYXkoZGF0ZSk7XG4gIGNvbnN0IGlkZW50aWZpZXJQcmVmaXggPVxuICAgIHllYXIgK1xuICAgIFNFUEFSQVRPUiArXG4gICAgbW9udGggK1xuICAgIFNFUEFSQVRPUiArXG4gICAgZGF5ICtcbiAgICBTRVBBUkFUT1IgK1xuICAgIHNvdXJjZUxhbmd1YWdlICtcbiAgICBTRVBBUkFUT1IgK1xuICAgIHNpdGVJZGVudGlmaWVyICtcbiAgICBTRVBBUkFUT1IgK1xuICAgIHB1Ymxpc2hlck5hbWUgK1xuICAgIFNFUEFSQVRPUiArXG4gICAgcG9zdFR5cGU7XG4gIGNvbnN0IGlkZW50aWZpZXIgPSBpZGVudGlmaWVyUHJlZml4ICsgU0VQQVJBVE9SICsgb3JpZ2luYWxJZDtcbiAgcmV0dXJuIGlkZW50aWZpZXI7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGF0aElkZW50aWZpZXJCeUlkZW50aWZpZXIoaWRlbnRpZmllcjogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgcGFydHMgPSBpZGVudGlmaWVyLnNwbGl0KFNFUEFSQVRPUik7XG4gIGNvbnN0IHBhcnQwID0gcGFydHNbMF07XG4gIGlmIChwYXJ0MC5zdGFydHNXaXRoKFwidFwiKSkge1xuICAgIHBhcnRzLnNoaWZ0KCk7XG4gIH1cbiAgY29uc3QgaWRlbnRpZmllclByZWZpeCA9IHBhcnRzLnNsaWNlKDAsIC0xKS5qb2luKFNFUEFSQVRPUik7XG4gIGNvbnN0IHBhdGhJZGVudGlmaWVyID1cbiAgICBpZGVudGlmaWVyUHJlZml4LnNwbGl0KFNFUEFSQVRPUikuam9pbihcIi9cIikgKyBcIi9cIiArIGlkZW50aWZpZXI7XG4gIHJldHVybiBwYXRoSWRlbnRpZmllcjtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgSWRlbnRpZmllck9iaiB7XG4gIHllYXI6IHN0cmluZztcbiAgbW9udGg6IHN0cmluZztcbiAgZGF5OiBzdHJpbmc7XG4gIGxhbmd1YWdlOiBzdHJpbmc7XG4gIHB1Ymxpc2hlck5hbWU6IHN0cmluZztcbiAgc2l0ZUlkZW50aWZpZXI6IHN0cmluZztcbiAgcG9zdFR5cGU6IHN0cmluZztcbiAgb3JpZ2luYWxJZDogc3RyaW5nO1xuICBkYXRlQ3JlYXRlZD86IERhdGU7XG59XG5leHBvcnQgZnVuY3Rpb24gcGFyc2VJZGVudGlmaWVyKGlkZW50aWZpZXI6IHN0cmluZyk6IElkZW50aWZpZXJPYmoge1xuICBjb25zdCBwYXJ0cyA9IGlkZW50aWZpZXIuc3BsaXQoU0VQQVJBVE9SKTtcbiAgY29uc3QgcGFydDAgPSBwYXJ0c1swXTtcbiAgbGV0IGRhdGVDcmVhdGVkOiBEYXRlIHwgdW5kZWZpbmVkO1xuICBpZiAocGFydDAuc3RhcnRzV2l0aChcInRcIikpIHtcbiAgICBwYXJ0cy5zaGlmdCgpO1xuICAgIGRhdGVDcmVhdGVkID0gbmV3IERhdGUocGFyc2VJbnQocGFydDAuc2xpY2UoMSksIDEwKSk7XG4gIH1cbiAgY29uc3QgeWVhciA9IHBhcnRzWzBdO1xuICBjb25zdCBtb250aCA9IHBhcnRzWzFdO1xuICBjb25zdCBkYXkgPSBwYXJ0c1syXTtcbiAgY29uc3Qgc291cmNlTGFuZ3VhZ2UgPSBwYXJ0c1szXTtcbiAgY29uc3Qgc2l0ZUlkZW50aWZpZXIgPSBwYXJ0c1s0XTtcbiAgY29uc3QgcHVibGlzaGVyTmFtZSA9IHBhcnRzWzVdO1xuICBjb25zdCBwb3N0VHlwZSA9IHBhcnRzWzZdO1xuICBjb25zdCBvcmlnaW5hbElkID0gcGFydHNbN107XG4gIGNvbnN0IG9iajogSWRlbnRpZmllck9iaiA9IHtcbiAgICB5ZWFyLFxuICAgIG1vbnRoLFxuICAgIGRheSxcbiAgICBsYW5ndWFnZTogc291cmNlTGFuZ3VhZ2UsXG4gICAgcHVibGlzaGVyTmFtZSxcbiAgICBzaXRlSWRlbnRpZmllcixcbiAgICBwb3N0VHlwZSxcbiAgICBvcmlnaW5hbElkLFxuICB9O1xuICBpZiAoZGF0ZUNyZWF0ZWQpIHtcbiAgICBvYmouZGF0ZUNyZWF0ZWQgPSBkYXRlQ3JlYXRlZDtcbiAgfVxuICByZXR1cm4gb2JqO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JpdGVKc29uKHBhdGg6IHN0cmluZywgZGF0YTogdW5rbm93bikge1xuICBjb25zb2xlLmxvZyhcIndyaXRpbmcganNvbiB0b1wiLCBwYXRoKTtcbiAgYXdhaXQgZW5zdXJlRmlsZShwYXRoKTtcbiAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKHBhdGgsIEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEpzb24ocGF0aDogc3RyaW5nLCBkYXRhOiB1bmtub3duKSB7fVxuLy8gTmF0aXZlXG5leHBvcnQgY29uc3QgZ2V0ID0gKG9iajogdW5rbm93biwgcGF0aDogc3RyaW5nLCBkZWZhdWx0VmFsdWUgPSB1bmRlZmluZWQpID0+IHtcbiAgY29uc3QgdHJhdmVsID0gKHJlZ2V4cDogUmVnRXhwKSA9PlxuICAgIFN0cmluZy5wcm90b3R5cGUuc3BsaXRcbiAgICAgIC5jYWxsKHBhdGgsIHJlZ2V4cClcbiAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgIC5yZWR1Y2UoXG4gICAgICAgIChyZXMsIGtleSkgPT5cbiAgICAgICAgICByZXMgIT09IG51bGwgJiYgcmVzICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgID8gKHJlcyBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KVtrZXldXG4gICAgICAgICAgICA6IHJlcyxcbiAgICAgICAgb2JqXG4gICAgICApO1xuICBjb25zdCByZXN1bHQgPSB0cmF2ZWwoL1ssW1xcXV0rPy8pIHx8IHRyYXZlbCgvWyxbXFxdLl0rPy8pO1xuICByZXR1cm4gcmVzdWx0ID09PSB1bmRlZmluZWQgfHwgcmVzdWx0ID09PSBvYmogPyBkZWZhdWx0VmFsdWUgOiByZXN1bHQ7XG59O1xuY29uc3QgQ09OVEVYVFMgPSB7XG4gIFwiaHR0cHM6Ly9zY2hlbWEub3JnXCI6IHNjaGVtYSxcbn07XG5cbmV4cG9ydCBjb25zdCBjdXN0b21Mb2FkZXIgPSBhc3luYyAodXJsOiBzdHJpbmcpID0+IHtcbiAgaWYgKHVybCBpbiBDT05URVhUUykge1xuICAgIHJldHVybiB7XG4gICAgICBjb250ZXh0VXJsOiBudWxsLCAvLyB0aGlzIGlzIGZvciBhIGNvbnRleHQgdmlhIGEgbGluayBoZWFkZXJcbiAgICAgIGRvY3VtZW50OiAoQ09OVEVYVFMgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW3VybF0sIC8vIHRoaXMgaXMgdGhlIGFjdHVhbCBkb2N1bWVudCB0aGF0IHdhcyBsb2FkZWRcbiAgICAgIGRvY3VtZW50VXJsOiB1cmwsIC8vIHRoaXMgaXMgdGhlIGFjdHVhbCBjb250ZXh0IFVSTCBhZnRlciByZWRpcmVjdHNcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgdGhlVXJsID0gYCR7dXJsfS9kb2NzL2pzb25sZGNvbnRleHQuanNvbmxkYDtcbiAgbGV0IHJlc3VsdCA9IGF3YWl0IGZldGNoKHRoZVVybCwge1xuICAgIGhlYWRlcnM6IHtcbiAgICAgIGFjY2VwdDogXCJhcHBsaWNhdGlvbi9sZCtqc29uLCBhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgfSxcbiAgfSk7XG4gIHJlc3VsdCA9IGF3YWl0IHJlc3VsdC5qc29uKCk7XG4gIHJldHVybiB7XG4gICAgY29udGV4dFVybDogbnVsbCwgLy8gdGhpcyBpcyBmb3IgYSBjb250ZXh0IHZpYSBhIGxpbmsgaGVhZGVyXG4gICAgZG9jdW1lbnQ6IHJlc3VsdCxcbiAgICBkb2N1bWVudFVybDogdXJsLCAvLyB0aGlzIGlzIHRoZSBhY3R1YWwgY29udGV4dCBVUkwgYWZ0ZXIgcmVkaXJlY3RzXG4gIH07XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RmluYWxIZWFkbGluZShpdGVtOiB1bmtub3duLCBoZWFkbGluZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbmFtZSA9IGdldChpdGVtLCBcIm5hbWVcIik7XG4gIGNvbnN0IGdlbnJlID0gZ2V0KGl0ZW0sIFwiZ2VucmVcIik7XG4gIGxldCB0aXRsZSA9IGBgO1xuICBpZiAoZ2VucmUpIHtcbiAgICB0aXRsZSArPSBgJHtnZW5yZX06IGA7XG4gIH1cbiAgaWYgKG5hbWUpIHtcbiAgICB0aXRsZSArPSBgJHtuYW1lfSAtIGA7XG4gIH1cbiAgaWYgKGhlYWRsaW5lKSB7XG4gICAgdGl0bGUgKz0gaGVhZGxpbmU7XG4gIH1cblxuICByZXR1cm4gdGl0bGU7XG59XG4iXX0=