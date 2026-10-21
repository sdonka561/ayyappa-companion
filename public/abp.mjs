import { abpTabs } from "./abp-data.mjs";
export { abpTabs };

const abpTeluguTitles = {
  maladharana: "మాలధారణ మరియు పీఠం ఏర్పాటు",
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
    introduction: "మాలధారణ పరిచయం",
    purification: "శుద్ధి స్నానం మరియు సిద్ధత",
    mala: "మాల ధరించడం",
    dakshina: "దక్షిణ మరియు ఆశీర్వాదాలు",
    vows: "నిత్య నియమాలు మరియు వ్రత నియమాలు",
    altar: "ఇంట్లో పూజా పీఠం ఏర్పాటు",
    "prepare-space": "పూజా స్థలాన్ని శుభ్రపరిచి సిద్ధం చేయడం",
    platform: "పవిత్ర పీఠాన్ని అలంకరించడం",
    deities: "దేవతా చిత్రాలు, విగ్రహాలు మరియు పూజా సామగ్రి",
    "peetham-rules": "పీఠం నిర్వహణ సూచనలు",
    offerings: "ముడుపు / మొక్కు మరియు సమర్పణలు",
  },
  sequence: {
    preparation: "స్నానం, సిద్ధత మరియు దీపారాధన",
    opening: "ప్రారంభ పూజ మరియు ఆవాహన",
    worship: "అంగపూజ, అభిషేకం మరియు నామావళి",
    offerings: "సమర్పణలు, హారతి మరియు నమస్కారం",
    closing: "స్తోత్రాలు, శరణుఘోష మరియు ముగింపు",
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
    "ayyappa-type-1": "అయ్యప్ప అష్టోత్తరం · విధానం 1",
    "ayyappa-type-2": "అయ్యప్ప అష్టోత్తరం · విధానం 2",
    completion: "అయ్యప్ప నామావళి ముగింపు",
  },
  sharanaghosha: { sharanaghosha: "అయ్యప్ప శరణుఘోష" },
  pancharatna: {
    pancharatna: "పంచరత్న స్తోత్రం · లోకవీరం",
    phala: "పంచరత్న ముగింపు శ్లోకం",
    arunodaya: "అరుణోదయ మరియు వందేహం నమస్కార శ్లోకాలు",
    mahavaidya: "మహావైద్య నమస్కార శ్లోకం",
    bhootanatha: "భూతనాథ సదానంద",
  },
  harathi: {
    harathi: "మంగళ హారతి",
    responses: "అయ్యప్ప నినాదాలు · పిలుపులు మరియు ప్రతిస్పందనలు",
    kshamapana: "క్షమాపణ మంత్రం",
  },
  sahasranamavali: {
    invocation: "సహస్రనామావళి ప్రారంభ ప్రార్థన",
    names: "సహస్రనామావళి నామాలు",
    completion: "సహస్రనామావళి ముగింపు",
  },
  suprabhatam: {
    invocation: "సుప్రభాతం ప్రారంభ ప్రార్థన",
    ...Object.fromEntries(Array.from({ length: 14 }, (_, index) => [`verse-${index + 1}`, `సుప్రభాతం · శ్లోకం ${index + 1}`])),
    completion: "సుప్రభాతం ముగింపు",
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
