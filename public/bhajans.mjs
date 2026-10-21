import { bhajanBook } from "./bhajan-data.mjs";
export { bhajanBook };

export function searchBhajans(query) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return bhajanBook.songs.filter((song) => words.every((word) => song.title.toLocaleLowerCase().includes(word)));
}

export function resolveBhajan(id, pageValue = "") {
  const song = id === "contents"
    ? { id: "contents", title: "Original contents · pages 1–8", start: 1, end: 8, startY: 0, tocPage: 1 }
    : bhajanBook.songs.find((entry) => entry.id === id);
  if (!song) return null;
  if (pageValue !== "" && !/^\d+$/.test(String(pageValue))) return null;
  const page = pageValue === "" ? song.start : Number(pageValue);
  if (!Number.isSafeInteger(page) || page < song.start || page > song.end) return null;
  return { song, page: bhajanBook.pages[page - 1] };
}
