import { abpTabs } from "./abp-data.mjs";
export { abpTabs };

const abpTeluguTitles = {
  maladharana: "మాలధారణ అండ్ పీఠం సెటప్",
  sequence: "పూజ సీక్వెన్స్",
  angapooja: "అథ అంగపూజ",
  ashtottaram: "అష్టోత్తరం",
  sharanaghosha: "శరణుఘోష",
  pancharatna: "పంచరత్న స్తోత్రం",
  harathi: "హారతి-క్షమాపణ",
  sahasranamavali: "సహస్రనామావళి",
  suprabhatam: "సుప్రభాతం",
};

export function abpTabTitle(tab, language = "en") {
  return language === "te" ? abpTeluguTitles[tab.id] || tab.title : tab.title;
}

export const abpSource = {
  title: "Source 1: Ayyappa Process Guide",
  url: "https://drive.google.com/file/d/1oeRnnIt7VN2bI_ZjYu49dZqGRdkynvPx/view",
};

export function sahasranamavaliGroups() {
  const lines = resolveAbp("sahasranamavali", "names").section.lines;
  return Array.from({ length: Math.ceil(lines.length / 10) }, (_, index) => ({
    start: index * 10 + 1,
    end: Math.min(index * 10 + 10, lines.length),
    lines: lines.slice(index * 10, index * 10 + 10),
  }));
}

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
    const haystack = [tab.title, abpTabTitle(tab, "te"), section.title, ...section.lines.flatMap((line) => [line.text, line.pronunciation || ""])].join(" ").toLocaleLowerCase();
    return words.every((word) => haystack.includes(word));
  }).map((section) => ({ tab, section })));
}
