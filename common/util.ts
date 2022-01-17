import { Organization, Thing, WithContext } from "https://esm.sh/schema-dts";
import { resolve } from "https://deno.land/std@0.121.0/path/mod.ts";

export function getDateString(date: Date) {
  const { year, month, day } = getYearMonthDay(date);
  return `${year}-${month}-${day}`;
}
export function getYearMonthDay(date: Date) {
  const year = date.getUTCFullYear();
  const month = addZero(date.getUTCMonth() + 1);
  const day = addZero(date.getUTCDate());
  return {
    year,
    month,
    day,
  };
}
export function addZero(number: number) {
  return ("0" + number).slice(-2);
}

export function getJsonLd<T extends Thing>(json: T): string {
  (json as unknown as Record<string, string>)["@context"] =
    "https://schema.org";
  const jsonWithContext: WithContext<T> = json as WithContext<T>;
  return `<script type="application/ld+json">
${JSON.stringify(jsonWithContext)}
</script>`;
}

export function getCwdPath(): string {
  const dirname = new URL(".", import.meta.url).pathname;
  return resolve(dirname, "../");
}
export function getDataFilePath(relativePath: string): string {
  const cwd = getCwdPath();
  return resolve(cwd, relativePath);
}
