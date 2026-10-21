"""Map every title in the eight contents pages, including titles missing from PDF bookmarks."""

import argparse
import hashlib
import io
import json
import re
from pathlib import Path

import pymupdf
from PIL import Image


def prepare(path, output, render):
    document = pymupdf.open(path)
    if len(document) != 451:
        raise ValueError("Expected the supplied 451-page bhajans edition; review a changed edition.")
    songs = []
    for index in range(8):
        rows = []
        for line in document[index].get_text().splitlines():
            match = re.fullmatch(r"(.+?)\s*\.{3,}\s*(\d+)\s*", line)
            if match:
                rows.append((match[1].strip(), int(match[2])))
        links = sorted(document[index].get_links(), key=lambda link: link["from"].y0)
        if len(rows) != len(links):
            raise ValueError(f"Contents page {index + 1}: title/link count mismatch")
        for (title, page), link in zip(rows, links):
            if link.get("kind") != pymupdf.LINK_GOTO or link.get("page", -1) + 1 != page:
                raise ValueError(f"Contents title has an inconsistent destination: {title}")
            if page == 1:
                continue  # The collection's own heading is not a song.
            songs.append({
                "id": f"song-{len(songs) + 1:03}",
                "title": title,
                "tocPage": index + 1,
                "start": page,
                "startY": round(link["to"].y / document[page - 1].rect.height, 5),
            })
    if len(songs) != 252:
        raise ValueError(f"Expected 252 contents entries, found {len(songs)}; review before publication")
    for index, song in enumerate(songs):
        if index + 1 < len(songs):
            next_song = songs[index + 1]
            if (next_song["start"], next_song["startY"]) < (song["start"], song["startY"]):
                raise ValueError(f"Contents destinations are out of order: {song['title']}")
            song["end"] = max(song["start"], next_song["start"] - (1 if next_song["startY"] < 0.1 else 0))
        else:
            song["end"] = len(document)
    images = output.parent / "bhajan-pages"
    if render:
        images.mkdir(exist_ok=True)
    pages = []
    for index, page in enumerate(document):
        relative = f"bhajan-pages/page-{index + 1:03}.webp"
        if render:
            pixmap = page.get_pixmap(matrix=pymupdf.Matrix(2.5, 2.5))
            image = Image.open(io.BytesIO(pixmap.tobytes("png")))
            image.save(output.parent / relative, "WEBP", lossless=True, method=4)
            if (index + 1) % 50 == 0:
                print(f"Rendered {index + 1} / {len(document)} pages", flush=True)
        pages.append({"page": index + 1, "image": relative})
    data = {
        "title": "Ayyappa_bhajans3.pdf",
        "url": "https://drive.google.com/file/d/1L7CcFrHsZ_OLO7TAvQ2vziDSGvViDBT_/view",
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "contentsPages": 8,
        "pages": pages,
        "songs": songs,
    }
    output.write_text("export const bhajanBook = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    print(f"Prepared all {len(songs)} title destinations from all eight contents pages; {len(pages)} original pages.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--render", action="store_true")
    args = parser.parse_args()
    prepare(args.input, args.output, args.render)
