import { abpTabs } from "./abp-data.mjs";
export { abpTabs };

export const abpSource = {
  title: "ABP - Simplified version of process guide",
  url: "https://drive.google.com/file/d/1oeRnnIt7VN2bI_ZjYu49dZqGRdkynvPx/view",
};

export function resolveAbp(tabId, sectionId = "") {
  const tab = abpTabs.find((entry) => entry.id === tabId);
  if (!tab) return null;
  const section = sectionId ? tab.sections.find((entry) => entry.id === sectionId) : null;
  return sectionId && !section ? null : { tab, section };
}

export function searchAbp(query) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return abpTabs.flatMap((tab) => tab.sections.filter((section) => {
    const haystack = [tab.title, section.title, ...section.lines.flatMap((line) => [line.text, line.pronunciation || ""])].join(" ").toLocaleLowerCase();
    return words.every((word) => haystack.includes(word));
  }).map((section) => ({ tab, section })));
}
