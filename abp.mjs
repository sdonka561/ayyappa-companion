import { abpTabs } from "./abp-data.mjs";
export { abpTabs };

const abpTeluguTitles = {
  maladharana: "మాలధారణ మరియు పీఠం సెటప్",
  sequence: "పూజ వరుస",
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

const abpTeluguSectionTitles = {
  maladharana: {
    introduction: "మాలధారణం ఇంట్రడక్షన్",
    purification: "ప్యూరిఫికేషన్ బాత్ మరియు ప్రిపరేషన్",
    mala: "అడార్నింగ్ ద మాల",
    dakshina: "దక్షిణ మరియు బ్లెస్సింగ్స్",
    vows: "డైలీ వౌస్ మరియు వ్రతం రూల్స్",
    altar: "సెట్టింగ్ అప్ ద హోమ్ ఆల్టర్",
    "prepare-space": "ప్రిపేర్ మరియు క్లీన్ ది ఏరియా",
    platform: "అడార్న్ ద సేక్రెడ్ ప్లాట్‌ఫార్మ్",
    deities: "పోర్ట్రెయిట్స్, ఐడల్స్ మరియు పూజ సప్లైస్",
    "peetham-rules": "పీఠం గైడ్‌లైన్స్",
    offerings: "ముడుపు / మొక్కు మరియు ఆఫరింగ్స్",
  },
  sequence: {
    preparation: "బాత్, ప్రిపరేషన్ మరియు ల్యాంప్",
    opening: "ఓపెనింగ్ పూజ మరియు ఇన్వొకేషన్",
    worship: "అంగపూజ, అభిషేకం మరియు నామావళి",
    offerings: "ఆఫరింగ్స్, హారతి మరియు నమస్కారం",
    closing: "స్తోత్రాలు, శరణుఘోష మరియు క్లోజింగ్",
  },
  angapooja: {
    ganesha: "గణేశ అంగపూజ",
    subramanya: "సుబ్రహ్మణ్య అంగపూజ",
    ayyappa: "అయ్యప్ప అంగపూజ",
  },
  ashtottaram: {
    ganesha: "గణేశ అష్టోత్తరం",
    subramanya: "సుబ్రహ్మణ్య అష్టోత్తరం",
    viniyoga: "అయ్యప్ప వినియోగ మరియు న్యాస",
    dhyana: "అయ్యప్ప ధ్యానం",
    "ayyappa-type-1": "అయ్యప్ప అష్టోత్తరం · టైప్ 1",
    "ayyappa-type-2": "అయ్యప్ప అష్టోత్తరం · టైప్ 2",
    completion: "అయ్యప్ప నామావళి కంప్లీషన్",
  },
  sharanaghosha: { sharanaghosha: "అయ్యప్ప శరణుఘోష" },
  pancharatna: {
    pancharatna: "పంచరత్న స్తోత్రం · లోకవీరం",
    phala: "పంచరత్న కన్క్లూడింగ్ వర్స్",
    arunodaya: "అరుణోదయ మరియు వందేహం సాల్యుటేషన్స్",
    mahavaidya: "మహావైద్య సాల్యుటేషన్",
    bhootanatha: "భూతనాథ సదానంద",
  },
  harathi: {
    harathi: "మంగళ హారతి",
    responses: "అయ్యప్ప నినాదాలు · కాల్స్ మరియు రెస్పాన్సెస్",
    kshamapana: "క్షమాపణ మంత్రం",
  },
  sahasranamavali: {
    invocation: "సహస్రనామావళి ఇన్వొకేషన్",
    names: "సహస్రనామావళి నేమ్స్",
    completion: "సహస్రనామావళి కంప్లీషన్",
  },
  suprabhatam: {
    invocation: "సుప్రభాతం ఇన్వొకేషన్",
    ...Object.fromEntries(Array.from({ length: 14 }, (_, index) => [`verse-${index + 1}`, `సుప్రభాతం · వర్స్ ${index + 1}`])),
    completion: "సుప్రభాతం కంప్లీషన్",
  },
};

export function abpSectionTitle(tab, section, language = "en") {
  return language === "te" ? abpTeluguSectionTitles[tab.id]?.[section.id] || section.title : section.title;
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
    const haystack = [tab.title, abpTabTitle(tab, "te"), section.title, abpSectionTitle(tab, section, "te"), ...section.lines.flatMap((line) => [line.text, line.pronunciation || ""])].join(" ").toLocaleLowerCase();
    return words.every((word) => haystack.includes(word));
  }).map((section) => ({ tab, section })));
}
