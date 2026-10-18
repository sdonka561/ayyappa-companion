import { bilingual } from "./content.mjs";

const abpId = "1oeRnnIt7VN2bI_ZjYu49dZqGRdkynvPx";
const abpSource = (sheet) => ({ id: abpId, pages: [], label: "ABP · Simplified process guide", sheet });
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
    englishMeaning: "I meditate on the white-clad, all-pervading one, moon-hued and four-armed, with a serene face, for the calming of all obstacles.",
    purpose: bilingual("Begin with remembrance of Ganapati and a prayer for the removal of obstacles.", "గణపతిని స్మరించి విఘ్నాలు తొలగాలని ప్రార్థించండి."),
    source: { id: "1Avgk8EKnyG0pSHdKNM3L6Km5Tj1aKBm0", pages: [2], label: "Ayyappa-Pooja-Niyamavali" },
  },
  {
    id: "guru", title: bilingual("Guru prarthana", "గురు ప్రార్థన"), category: "opening",
    englishMeaning: "The Guru is Brahma, Vishnu, and Maheshwara; the Guru is the supreme reality itself. To that revered Guru, I bow.",
    purpose: bilingual("A traditional salutation to the Guru, included in the supplied Telugu puja text.", "అందించిన తెలుగు పూజా పాఠ్యంలో ఉన్న సంప్రదాయ గురు స్తుతి."),
    source: { id: "181vQYoHQXTWv-cQ0_V-3WNF9JWEeSW63", pages: [2], label: "శ్రీ అయ్యప్ప స్వామి పూజ విధానం" },
  },
  {
    id: "ashtottaram", title: bilingual("Ayyappa ashtottaram · 108 names", "అయ్యప్ప అష్టోత్తరం · 108 నామాలు"), category: "core",
    purpose: bilingual("The complete numbered 108-name Telugu list from your dedicated namavali workbook, ready for archana from your phone.", "ప్రత్యేక నామావళి వర్క్‌బుక్‌లోని పూర్తి 108 తెలుగు నామాలు. ఫోన్ చూస్తూ అర్చన చేసుకోవచ్చు."),
    source: { id: "1-G_Kq-QKZlVl8z0EXzWBagleDaq6vbqi", pages: [], sheet: "Telugu · rows 3–110", label: "DharmaSastha · Ashtottara Namavali" },
  },
  {
    id: "sharanaghosha", title: bilingual("Saranu ghosha · full supplied litany", "శరణుఘోష · అందించిన పూర్తి జాబితా"), category: "core",
    purpose: bilingual("Read the collective invocations directly. The supplied ABP sheet contains 107 non-empty invocations, not 108; all are preserved in order without inventing a missing line.", "సమూహ శరణుఘోషను నేరుగా చదవండి. అందించిన ABP షీట్‌లో 108 కాకుండా 107 నిండిన శరణు పలుకులు ఉన్నాయి. లేని పలుకును కల్పించకుండా ఉన్న క్రమాన్ని ఉంచాం."),
    source: abpSource("SARANUGHOSHA"),
    notice: bilingual("Source count: 107. For a 108-repeat refrain, use “108 sharanam repetitions” instead.", "మూలంలో సంఖ్య: 107. ఒకే శరణు పలుకును 108 సార్లు పలకడానికి “108 శరణం పునరావృతాలు” ఉపయోగించండి."),
  },
  {
    id: "sharanam-108", title: bilingual("108 sharanam repetitions", "108 శరణం పునరావృతాలు"), category: "core",
    englishMeaning: "Lord Ayyappa, I seek refuge in you.",
    purpose: bilingual("A count-along reader for repeating the traditional sharanam refrain 108 times. This is not a fabricated 108-name litany.", "సంప్రదాయ శరణు పలుకును 108 సార్లు పలకడానికి లెక్కతో పఠనం. ఇది కల్పించిన 108 నామాల జాబితా కాదు."),
    source: { id: "1Avgk8EKnyG0pSHdKNM3L6Km5Tj1aKBm0", pages: [17], label: "Ayyappa-Pooja-Niyamavali" },
  },
  {
    id: "gayatri", title: bilingual("Ayyappa Gayatri", "అయ్యప్ప గాయత్రీ"), category: "core",
    englishMeaning: "May we know the Lord of beings; we meditate on the son of Bhava (Shiva). May Shasta inspire and guide our understanding.",
    purpose: bilingual("The Ayyappa Gayatri present in the source. Other Shiva/Vishnu variants are not added without source verification; no scientific or medical effects are claimed.", "మూలంలో ఉన్న అయ్యప్ప గాయత్రీ. నిర్ధారించని శివ, విష్ణు గాయత్రీ రూపాలను జోడించలేదు. శాస్త్రీయ లేదా వైద్య ఫలితాల వాదనలు చేయలేదు."),
    source: { id: "1Avgk8EKnyG0pSHdKNM3L6Km5Tj1aKBm0", pages: [41], label: "Ayyappa-Pooja-Niyamavali" },
  },
  {
    id: "pancharatna", title: bilingual("Loka Veeram · Pancharatna stotram", "లోకవీరం · పంచరత్న స్తోత్రం"), category: "night",
    purpose: bilingual("Five traditional salutation verses to Shasta. The ABP daily sequence includes this near the conclusion; it is not established here as an exclusively night-time requirement.", "శాస్తాకు ఐదు సంప్రదాయ నమస్కార శ్లోకాలు. ABP నిత్యపూజా క్రమంలో ముగింపు దగ్గర ఉంది; ఇది రాత్రికి మాత్రమే తప్పనిసరి అని ఇక్కడ నిర్ణయించలేదు."),
    source: abpSource("PANCHARATNA STOTRAM · C2:C16"),
  },
  {
    id: "kshamapana", title: bilingual("Kshamapana mantram", "క్షమాపణ మంత్రం"), category: "night",
    purpose: bilingual("Ask forgiveness humbly for mistakes made knowingly or unknowingly. The workbook explicitly advises requesting pardon gently, not shouting.", "తెలిసి తెలియక చేసిన తప్పులకు వినయంగా క్షమాపణ అడగండి. అరిచినట్లు కాకుండా క్షమాపణ కోరాలని వర్క్‌బుక్ ప్రత్యేకంగా చెబుతుంది."),
    source: abpSource("HARATHI-KSHAMAPANA · N2:N6"),
  },
  {
    id: "responses", title: bilingual("Bhajan call & response", "భజన పిలుపు, ప్రతిస్పందన"), category: "bhajan",
    purpose: bilingual("The short traditional Ayyappa invocations from the workbook, laid out for a group to read and respond together.", "వర్క్‌బుక్‌లోని చిన్న సంప్రదాయ అయ్యప్ప నినాదాలు. సమూహంగా చదివి ప్రతిస్పందించడానికి అనువుగా ఉన్నాయి."),
    source: abpSource("HARATHI-KSHAMAPANA · J2:J28"),
  },
  {
    id: "suprabhatam", title: bilingual("Suprabhatam & awakening hymns", "సుప్రభాతం, మేలుకొలుపు"), category: "morning",
    purpose: bilingual("The ABP workbook has a 14-verse Suprabhatam sheet for morning devotion. Full-text reuse and a matching recording have not been verified for this edition; open the supplied source for that hymn.", "ఉదయపు భక్తి కోసం ABP వర్క్‌బుక్‌లో 14 శ్లోకాల సుప్రభాతం షీట్ ఉంది. ఈ సంచికకు పూర్తి పాఠ్య పునర్వినియోగం, సరిపోయే రికార్డింగ్ నిర్ధారణ కాలేదు. ఆ స్తోత్రానికి అందించిన మూలాన్ని తెరవండి."),
    source: abpSource("SUPRABHATAM"), referenceOnly: true,
  },
  {
    id: "kavacham", title: bilingual("Ayyappa Kavacham", "అయ్యప్ప కవచం"), category: "core",
    purpose: bilingual("The bhajan book indexes a Sasthru kavacham and a Tamil Ayyappa kavacham. Their text/audio reuse is not verified here, so they are references rather than invented recitations.", "భజన పుస్తక సూచికలో శాస్తృ కవచం, తమిళ అయ్యప్ప కవచం ఉన్నాయి. పాఠ్యం, ఆడియో పునర్వినియోగం ఇక్కడ నిర్ధారణ కాలేదు; కల్పించిన పఠనం బదులుగా మూల సూచనలు ఇచ్చాం."),
    source: { id: "1L7CcFrHsZ_OLO7TAvQ2vziDSGvViDBT_", pages: [29, 32], label: "Ayyappa bhajans collection" }, referenceOnly: true,
  },
  {
    id: "padi-puja", title: bilingual("Padi puja melodies & hills bhajans", "పడిపూజ గీతాలు, శబరిగిరి భజనలు"), category: "padi",
    purpose: bilingual("The book indexes Padi Pooja Kazhinju and Padi Pattu, plus pilgrimage-themed songs. No verified “18 hills” playlist or authorized recording is supplied. The 18 holy steps and pilgrimage hills are not treated as the same thing.", "పుస్తక సూచికలో Padi Pooja Kazhinju, Padi Pattu, యాత్ర గీతాలు ఉన్నాయి. నిర్ధారించిన “18 కొండలు” ప్లేలిస్ట్ లేదా అనుమతించిన రికార్డింగ్ లేదు. 18 పవిత్ర మెట్లు, యాత్రలోని కొండలను ఒకటిగా చూపించలేదు."),
    source: { id: "1L7CcFrHsZ_OLO7TAvQ2vziDSGvViDBT_", pages: [69, 76], label: "Ayyappa bhajans collection" }, referenceOnly: true,
  },
  {
    id: "harivarasanam", title: bilingual("Harivarasanam · night devotion", "హరివరాసనం · రాత్రి భక్తి"), category: "night",
    purpose: bilingual("The niyamavali places Harivarasanam under the night resting service. The final recording and full lyrics are not bundled until reuse permission is verified. This guide does not turn that temple-service context into a universally mandatory household ritual.", "నియమావళిలో హరివరాసనం రాత్రి పవళింపు సేవలో ఉంది. పునర్వినియోగ అనుమతి నిర్ధారణ వరకు పూర్తి సాహిత్యం, చివరి ఆడియో ట్రాక్ జత చేయలేదు. ఆలయ సేవ నేపథ్యాన్ని ప్రతి ఇంటికీ తప్పనిసరి ఆచారంగా ఈ మార్గదర్శి మార్చదు."),
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
