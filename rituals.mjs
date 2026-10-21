import { bilingual } from "./content.mjs";

const abpId = "1oeRnnIt7VN2bI_ZjYu49dZqGRdkynvPx";
const abpCitation = (sheet) => ({ id: abpId, pages: [], label: "Source 1: Ayyappa Process Guide", sheet });
export const chantCategories = [
  { id: "all", title: bilingual("All", "అన్నీ") },
  { id: "opening", title: bilingual("Ganesha & Guru", "గణపతి, గురువు") },
  { id: "morning", title: bilingual("Morning", "ఉదయం") },
  { id: "core", title: bilingual("Daily chanting", "నిత్య జపం") },
  { id: "bhajan", title: bilingual("Bhajans & keertanalu", "భజనలు, కీర్తనలు") },
  { id: "padi", title: bilingual("Padi puja & hills", "పడిపూజ, శబరిగిరి") },
  { id: "night", title: bilingual("Evening & bedtime", "సాయంత్రం, రాత్రి") },
];

export const chantDefinitions = [
  {
    id: "ganesha", title: bilingual("Ganesha prarthana", "గణేశ ప్రార్థన"), category: "opening",
    purpose: bilingual("Begin with remembrance of Ganapati and a prayer for the removal of obstacles.", "గణపతిని స్మరించి విఘ్నాలు తొలగాలని ప్రార్థించండి."),
    source: { id: "1Avgk8EKnyG0pSHdKNM3L6Km5Tj1aKBm0", pages: [2], label: "Ayyappa-Pooja-Niyamavali" },
  },
  {
    id: "guru", title: bilingual("Guru prarthana", "గురు ప్రార్థన"), category: "opening",
    purpose: bilingual("A traditional salutation to the Guru, included in the supplied Telugu puja text.", "అందించిన తెలుగు పూజా పాఠ్యంలో ఉన్న సంప్రదాయ గురు స్తుతి."),
    source: { id: "181vQYoHQXTWv-cQ0_V-3WNF9JWEeSW63", pages: [2], label: "శ్రీ అయ్యప్ప స్వామి పూజ విధానం" },
  },
  {
    id: "ashtottaram", title: bilingual("Ayyappa ashtottaram · 108 names", "అయ్యప్ప అష్టోత్తరం · 108 నామాలు"), category: "core",
    purpose: bilingual("All 108 names from DharmaSastha_Ayyappa_Astottara_Namavali, with the workbook’s original Telugu and English-letter pronunciation paired by row.", "DharmaSastha_Ayyappa_Astottara_Namavali వర్క్‌బుక్‌లోని 108 నామాలు; మూలంలోని తెలుగు, English ఉచ్చారణ జతలుగా ఉన్నాయి."),
    sourcePronunciation: true,
    source: { id: "1-G_Kq-QKZlVl8z0EXzWBagleDaq6vbqi", pages: [], sheet: "Telugu C / English B · rows 3–110", label: "DharmaSastha · Ashtottara Namavali" },
  },
  {
    id: "sahasranamavali", title: bilingual("HariHaraPutra Sahasranamavali", "హరిహరపుత్ర సహస్రనామావళి"), category: "core",
    purpose: bilingual("Original Telugu and English-letter pronunciation from HariHaraPutra_SahasraNamavali, preserved together by source row. No generated transliteration is used.", "HariHaraPutra_SahasraNamavali మూలంలోని తెలుగు, English ఉచ్చారణ జతలు. కొత్తగా లిప్యంతరీకరణ చేయలేదు."),
    sourcePronunciation: true,
    notice: bilingual("The workbook numbers 1–1004, including closing invocations; all are retained. Entry 633 has English pronunciation but its Telugu cell is blank in the source, and is explicitly marked—not invented. This differs from Source 1’s 1000-name list.", "మూలంలో ముగింపు నామాలతో కలిపి 1–1004 సంఖ్యలు ఉన్నాయి. 633వ అంశానికి English ఉచ్చారణ ఉంది కానీ తెలుగు ఖాళీగా ఉంది; కల్పించకుండా గుర్తించాం. ఇది Source 1లోని 1000 నామాల జాబితాకు భిన్నమైన మూలం."),
    source: { id: "1BIRAcVmUK0xYyWbpC7R4ZLPDguqUHhs7", pages: [], sheet: "Telugu B / English C · rows 3–1006", label: "HariHaraPutra · Sahasra Namavali" },
  },
  {
    id: "sharanaghosha", title: bilingual("Saranu ghosha · full supplied litany", "శరణుఘోష · అందించిన పూర్తి జాబితా"), category: "core",
    purpose: bilingual("Read the collective invocations directly. The supplied Source 1 sheet contains 107 non-empty invocations, not 108; all are preserved in order without inventing a missing line.", "సమూహ శరణుఘోషను నేరుగా చదవండి. అందించిన Source 1 షీట్‌లో 108 కాకుండా 107 నిండిన శరణు పలుకులు ఉన్నాయి. లేని పలుకును కల్పించకుండా ఉన్న క్రమాన్ని ఉంచాం."),
    source: abpCitation("SARANUGHOSHA"),
    notice: bilingual("Source count: 107. For a 108-repeat refrain, use “108 sharanam repetitions” instead.", "మూలంలో సంఖ్య: 107. ఒకే శరణు పలుకును 108 సార్లు పలకడానికి “108 శరణం పునరావృతాలు” ఉపయోగించండి."),
  },
  {
    id: "sharanam-108", title: bilingual("108 sharanam repetitions", "108 శరణం పునరావృతాలు"), category: "core",
    purpose: bilingual("A count-along reader for repeating the traditional sharanam refrain 108 times. This is not a fabricated 108-name litany.", "సంప్రదాయ శరణు పలుకును 108 సార్లు పలకడానికి లెక్కతో పఠనం. ఇది కల్పించిన 108 నామాల జాబితా కాదు."),
    source: { id: "1Avgk8EKnyG0pSHdKNM3L6Km5Tj1aKBm0", pages: [17], label: "Ayyappa-Pooja-Niyamavali" },
  },
  {
    id: "gayatri", title: bilingual("Ayyappa Gayatri", "అయ్యప్ప గాయత్రీ"), category: "core",
    purpose: bilingual("The Ayyappa Gayatri present in the source. Other Shiva/Vishnu variants are not added without source verification; no scientific or medical effects are claimed.", "మూలంలో ఉన్న అయ్యప్ప గాయత్రీ. నిర్ధారించని శివ, విష్ణు గాయత్రీ రూపాలను జోడించలేదు. శాస్త్రీయ లేదా వైద్య ఫలితాల వాదనలు చేయలేదు."),
    source: { id: "1Avgk8EKnyG0pSHdKNM3L6Km5Tj1aKBm0", pages: [41], label: "Ayyappa-Pooja-Niyamavali" },
  },
  {
    id: "pancharatna", title: bilingual("Loka Veeram · Pancharatna stotram", "లోకవీరం · పంచరత్న స్తోత్రం"), category: "night",
    purpose: bilingual("Five traditional salutation verses to Shasta. The Source 1 daily sequence includes this near the conclusion; it is not established here as an exclusively night-time requirement.", "శాస్తాకు ఐదు సంప్రదాయ నమస్కార శ్లోకాలు. Source 1 నిత్యపూజా క్రమంలో ముగింపు దగ్గర ఉంది; ఇది రాత్రికి మాత్రమే తప్పనిసరి అని ఇక్కడ నిర్ణయించలేదు."),
    source: abpCitation("PANCHARATNA STOTRAM · C2:C16"),
  },
  {
    id: "kshamapana", title: bilingual("Kshamapana mantram", "క్షమాపణ మంత్రం"), category: "night",
    purpose: bilingual("Ask forgiveness humbly for mistakes made knowingly or unknowingly. The workbook explicitly advises requesting pardon gently, not shouting.", "తెలిసి తెలియక చేసిన తప్పులకు వినయంగా క్షమాపణ అడగండి. అరిచినట్లు కాకుండా క్షమాపణ కోరాలని వర్క్‌బుక్ ప్రత్యేకంగా చెబుతుంది."),
    source: abpCitation("HARATHI-KSHAMAPANA · N2:N6"),
  },
  {
    id: "responses", title: bilingual("Bhajan call & response", "భజన పిలుపు, ప్రతిస్పందన"), category: "bhajan",
    purpose: bilingual("The short traditional Ayyappa invocations from the workbook, laid out for a group to read and respond together.", "వర్క్‌బుక్‌లోని చిన్న సంప్రదాయ అయ్యప్ప నినాదాలు. సమూహంగా చదివి ప్రతిస్పందించడానికి అనువుగా ఉన్నాయి."),
    source: abpCitation("HARATHI-KSHAMAPANA · J2:J28"),
  },
  {
    id: "suprabhatam", title: bilingual("Suprabhatam & awakening hymns", "సుప్రభాతం, మేలుకొలుపు"), category: "morning",
    purpose: bilingual("Read the Source 1 workbook's 14 Suprabhatam verses in its tab-based guide, in Telugu or English-letter pronunciation. No recording is bundled.", "Source 1 ట్యాబ్ మార్గదర్శిలో 14 సుప్రభాత శ్లోకాలను తెలుగు లేదా English ఉచ్చారణలో చదవండి. ఆడియో జత చేయలేదు."),
    abpReference: ["suprabhatam", "verse-1"],
    source: abpCitation("SUPRABHATAM"), referenceOnly: true,
  },
  {
    id: "kavacham", title: bilingual("Ayyappa Kavacham", "అయ్యప్ప కవచం"), category: "core",
    purpose: bilingual("Open the kavacham titles in the complete bhajan book and read their original pages. No recording is bundled.", "పూర్తి భజన పుస్తకంలోని కవచ శీర్షికలను తెరిచి అసలు పేజీలు చదవండి. ఆడియో జత చేయలేదు."),
    bhajanQuery: "kavacham",
    source: { id: "1L7CcFrHsZ_OLO7TAvQ2vziDSGvViDBT_", pages: [29, 32], label: "Ayyappa bhajans collection" }, referenceOnly: true,
  },
  {
    id: "padayatra", title: bilingual("Sabarimala padayatra bhajans", "శబరిమల పాదయాత్ర నినాదాలు"), category: "bhajan",
    purpose: bilingual("The pilgrimage call-and-response chants on printed page 42 of your Nitya Puja book (PDF page 40). Read the first line as the call and the second as the group response.", "మీ నిత్యపూజ పుస్తకంలో ముద్రిత పేజీ 42లోని పాదయాత్ర నినాదాలు (PDF పేజీ 40). మొదటి పంక్తిని పిలుపుగా, రెండో పంక్తిని సమూహ ప్రతిస్పందనగా చదవండి."),
    source: { id: "1EDanwSJyooDryISf5TedJcoKyl_VjJ5Q", pages: [40], label: "Nitya Puja · printed p. 42 / ముద్రిత పేజీ 42" },
    sourceImage: "padayatra-page-42.jpg",
    notice: bilingual("Telugu-script transcription from the scan; some phrases represent Tamil sounds. Source spellings are retained, not standardized. Compare with the original page below and confirm pronunciation with your Guruswamy.", "స్కాన్ నుంచి తెలుగు లిపిలోకి తీసుకున్న పాఠ్యం; కొన్ని పలుకులు తమిళ ఉచ్చారణను సూచిస్తాయి. మూలంలోని వ్రాతను ప్రామాణీకరించకుండా ఉంచాం. కింద ఇచ్చిన అసలు పేజీతో పోల్చి, గురుస్వామితో ఉచ్చారణ నిర్ధారించుకోండి."),
  },
  {
    id: "padi-puja", title: bilingual("Padi puja melodies & hills bhajans", "పడిపూజ గీతాలు, శబరిగిరి భజనలు"), category: "padi",
    purpose: bilingual("Read Padi Pooja Kazhinju and Padi Pattu from their original pages in the complete bhajan book. The 18 holy steps and pilgrimage hills are not treated as the same thing; no recording is bundled.", "పూర్తి భజన పుస్తకంలో Padi Pooja Kazhinju, Padi Pattu అసలు పేజీలు చదవండి. 18 పవిత్ర మెట్లు, యాత్ర కొండలు ఒకటిగా చూపించలేదు; ఆడియో లేదు."),
    bhajanQuery: "padi",
    source: { id: "1L7CcFrHsZ_OLO7TAvQ2vziDSGvViDBT_", pages: [69, 76], label: "Ayyappa bhajans collection" }, referenceOnly: true,
  },
  {
    id: "harivarasanam", title: bilingual("Harivarasanam · night devotion", "హరివరాసనం · రాత్రి భక్తి"), category: "night",
    purpose: bilingual("Read Harivarasanam in the complete bhajan book or the Nitya Puja PDF version. The niyamavali places it under night resting service; this is not treated as a universally mandatory household ritual. No recording is bundled.", "పూర్తి భజన పుస్తకం లేదా నిత్యపూజ PDFలో హరివరాసనం చదవండి. నియమావళిలో రాత్రి పవళింపు సేవలో ఉంది; ప్రతి ఇంటికీ తప్పనిసరి అని నిర్ణయించలేదు. ఆడియో లేదు."),
    bhajanQuery: "Harivarasanam",
    source: { id: "1Avgk8EKnyG0pSHdKNM3L6Km5Tj1aKBm0", pages: [68], label: "Ayyappa-Pooja-Niyamavali" }, referenceOnly: true,
  },
];

export const pujaRoutine = [
  bilingual("Bathe and prepare; follow a safe, appropriate bathing practice.", "స్నానం చేసి సిద్ధం కండి; ఆరోగ్యానికి సురక్షితమైన విధానాన్ని అనుసరించండి."),
  bilingual("Apply vibhuti, sandal paste, and kumkum.", "విభూతి, గంధం, కుంకుమ ధరించండి."),
  bilingual("Clean the room and peetam; arrange the alankaram.", "గది, పీఠం శుభ్రం చేసి అలంకరించండి."),
  bilingual("Light the lamp safely and begin the introductory upacharas.", "దీపాన్ని సురక్షితంగా వెలిగించి ప్రారంభ ఉపచారాలు చేయండి."),
  bilingual("Ganapati puja and Guru / Guruswamy prayer.", "గణపతి పూజ, గురు / గురుస్వామి ప్రార్థన."),
  bilingual("Kalasha puja if being performed; deity invocations and dhyana.", "చేస్తుంటే కలశపూజ; దేవతా ఆవాహనం, ధ్యానం."),
  bilingual("Anga puja; abhishekam if an appropriate idol is installed.", "అంగపూజ; తగిన విగ్రహం స్థాపించి ఉంటే అభిషేకం."),
  bilingual("Ashtottara namavali with flowers or akshata; sahasranamam if part of this puja.", "పుష్పాలు లేదా అక్షతలతో అష్టోత్తర నామావళి; ఈ పూజలో భాగమైతే సహస్రనామం."),
  bilingual("Naivedya, camphor arati, and mantra pushpam.", "నైవేద్యం, కర్పూర హారతి, మంత్రపుష్పం."),
  bilingual("Pradakshina, namaskara, and Pancharatna stotram.", "ప్రదక్షిణం, నమస్కారం, పంచరత్న స్తోత్రం."),
  bilingual("Sharanaghosha and the forgiveness prayer.", "శరణుఘోష, క్షమాపణ ప్రార్థన."),
  bilingual("Receive tirtha, prasada, and the offered akshata or flowers.", "తీర్థం, ప్రసాదం, సమర్పించిన అక్షతలు లేదా పుష్పాలు స్వీకరించండి."),
];

export function ritualPhase(date = new Date()) {
  return date.getHours() >= 16 || date.getHours() < 4 ? "evening" : "morning";
}

export function ritualDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
