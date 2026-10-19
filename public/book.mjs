import { bookPages } from "./book-data.mjs";

export { bookPages };
export const primaryBook = {
  id: "1EDanwSJyooDryISf5TedJcoKyl_VjJ5Q",
  title: { en: "Ayyappa Nitya Puja Vidhanam", te: "శ్రీ అయ్యప్పస్వామి నిత్యపూజా విధానం" },
  url: "https://drive.google.com/file/d/1EDanwSJyooDryISf5TedJcoKyl_VjJ5Q/view",
};
export const bookChapters = [
  ["cover", "The book", "పుస్తకం", 1, 1, "Cover of the supplied edition."],
  ["vows", "Deeksha rules", "వ్రత నియమములు", 2, 6, "The book’s 36 observance rules, in their original order."],
  ["initiation", "Mala & pilgrimage", "మాలధారణ, దీక్షా విధానం", 7, 9, "Maladharana mantra and the book’s account of deeksha and pilgrimage."],
  ["story", "Ayyappa’s story", "అయ్యప్ప చరితం", 10, 17, "The narrative beginning with Avaniki Jyoti Ayyappa, including Mahishi Mardanam."],
  ["opening", "Opening prayers", "ప్రారంభ ప్రార్థనలు", 18, 20, "Shuklambaradharam, Ganapati prayers, and Guru stotram."],
  ["other-prayers", "Devi & other prayers", "దేవీ, ఇతర ప్రార్థనలు", 21, 24, "Saraswati, Lakshmi, Annapurna, Mrityunjaya, Navagraha, and Anjaneya prayers."],
  ["ayyappa-prayer", "Ayyappa prayer", "అయ్యప్ప ప్రార్థన", 25, 25, "The Ayyappa prayer preceding the puja offerings."],
  ["worship", "Puja offerings & anga puja", "ఆవాహనం, అంగపూజ", 26, 28, "The book’s offering sequence followed by anga puja."],
  ["names", "Ashtottaram & offerings", "అష్టోత్తరం, అనంతరం", 29, 32, "Harihara Suta Ashtottara Shatanamavali and the offerings that follow it."],
  ["arati", "Arati & mantra pushpam", "మంగళహారతి, మంత్రపుష్పం", 33, 33, "Mangala harati and mantra pushpam."],
  ["sharanaghosha", "Sharanaghosha", "అయ్యప్ప శరణుఘోష", 34, 39, "Atma pradakshina followed by the book’s numbered sharanaghosha."],
  ["padayatra", "Padayatra chants", "పాదయాత్ర నినాదాలు", 40, 41, "Both pages of Sabarimala pilgrimage calls and responses."],
  ["night", "Stotras & Harivarasanam", "స్తోత్రాలు, హరివరాసనం", 42, 45, "Salutation verses followed by the book’s night-time Harivarasanam text."],
  ["materials", "Forgiveness & puja materials", "క్షమాపణ, పూజా సామగ్రి", 46, 48, "Kshamapana, Irumudi materials, puja materials, panchamritam, and the following instructions."],
  ["bhajans", "Bhajans", "భజనలు", 49, 61, "The book’s concluding devotional songs, in printed order."],
].map(([id, en, te, start, end, description]) => ({ id, title: { en, te }, start, end, description }));

export const chapterForPage = (page) => bookChapters.find((chapter) => page >= chapter.start && page <= chapter.end);
export function resolveBookLocation(chapterId, pageParameter) {
  const chapter = bookChapters.find((entry) => entry.id === chapterId);
  if (!chapter) return null;
  const page = pageParameter === "" ? chapter.start : Number(pageParameter);
  if (!Number.isInteger(page) || page < chapter.start || page > chapter.end) return null;
  return { chapter, page: bookPages[page - 1] };
}

export function searchBook(query) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return bookChapters.flatMap((chapter) => {
    const title = `${chapter.title.en} ${chapter.title.te} ${chapter.description}`.toLocaleLowerCase();
    const match = bookPages.slice(chapter.start - 1, chapter.end).find((page) => words.every((word) => `${title} ${page.page === 1 ? "" : page.text.toLocaleLowerCase()}`.includes(word)));
    return match ? [{ ...chapter, matchPage: match.page }] : [];
  });
}
