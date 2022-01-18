import OpenCC from "https://esm.sh/opencc-js?no-check";
const converter = OpenCC.Converter({ from: "cn", to: "tw" });

export default function (source: string) {
  return converter(source);
}
