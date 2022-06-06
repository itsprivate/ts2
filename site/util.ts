import { join } from "https://deno.land/std@0.121.0/path/mod.ts";

import { DateTimeFormatter } from "https://deno.land/std@0.121.0/datetime/formatter.ts";

export const getSitePath = (relativePath: string) => {
  return join("site", relativePath);
};
export const getAppPath = (siteIdentifier: string, relativePath: string) => {
  return join("apps", siteIdentifier, relativePath);
};
export const formatUtc = (date: Date, formatString: string) => {
  const formatter = new DateTimeFormatter(formatString);
  return formatter.format(date, {
    timeZone: "UTC",
  });
};
const formatBeijing = (date: Date, formatString: string) => {
  date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const formatter = new DateTimeFormatter(formatString);
  return formatter.format(date, {
    timeZone: "UTC",
  });
};
export const formatDate = (date: Date) => {
  const now = new Date();
  const nowDate = formatBeijing(now, "yyyy-MM-dd");
  const dateDate = formatBeijing(date, "yyyy-MM-dd");
  const isToday = nowDate === dateDate;

  const nowYear = formatBeijing(now, "yyyy");
  const dateYear = formatBeijing(date, "yyyy");
  const isThisYear = nowYear === dateYear;

  if (isToday) {
    return formatBeijing(date, "HH:mm");
  } else if (isThisYear) {
    return formatBeijing(date, "MM-dd");
  } else {
    return formatBeijing(date, "yy-MM-dd");
  }
};
