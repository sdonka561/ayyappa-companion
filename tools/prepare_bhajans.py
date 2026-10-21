"""Map every title in the eight contents pages, including titles missing from PDF bookmarks."""

import argparse
from bisect import bisect_right
import hashlib
import io
import json
import re
from pathlib import Path

import pymupdf
from PIL import Image


def extract_readings(document, songs):
    """Assign PDF text lines to TOC destinations, including shared-page titles."""
    boundaries = [(song["start"], song["startY"]) for song in songs]
    assigned = [[] for _ in songs]
    extracted_lines = 0
    for page_number in range(songs[0]["start"], len(document) + 1):
        page = document[page_number - 1]
        by_song = {}
        for block in page.get_text("dict", sort=True)["blocks"]:
            for line in block.get("lines", []):
                value = "".join(span["text"] for span in line["spans"]).rstrip()
                top, bottom = line["bbox"][1], line["bbox"][3]
                # Page-number furniture is not part of a song.
                if value.strip() == str(page_number) and (
                    top < page.rect.height * 0.1 or bottom > page.rect.height * 0.92
                ):
                    continue
                position = (page_number, (top + bottom) / 2 / page.rect.height)
                owner = bisect_right(boundaries, position) - 1
                if owner < 0:
                    continue  # Contents preceding the first song on page eight.
                by_song.setdefault(owner, []).append(value)
                if value.strip():
                    extracted_lines += 1
        for owner, lines in by_song.items():
            text = "\n".join(lines).strip("\n")
            if text.strip():
                assigned[owner].append({"page": page_number, "text": text})
    for song, excerpts in zip(songs, assigned):
        if not excerpts or any("\ufffd" in excerpt["text"] for excerpt in excerpts):
            raise ValueError(f"Missing or undecodable original text: {song['title']}")
        # A next title near the top can still follow the previous song's last lines.
        song["end"] = excerpts[-1]["page"]
        song["excerpts"] = excerpts
    actual_lines = sum(
        bool(line.strip())
        for excerpts in assigned for excerpt in excerpts for line in excerpt["text"].splitlines()
    )
    if actual_lines != extracted_lines:
        raise ValueError("PDF text lines were lost or duplicated during extraction")
    covered = {excerpt["page"] for excerpts in assigned for excerpt in excerpts}
    if covered != set(range(songs[0]["start"], len(document) + 1)):
        raise ValueError("Some original song pages have no extracted text")
    return extracted_lines


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
    extracted_lines = extract_readings(document, songs)
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
        "textExtraction": {
            "method": "Original PDF Unicode text, divided at linked contents destinations",
            "nonemptyLines": extracted_lines,
            "generatedTranslation": False,
            "generatedPronunciation": False,
        },
        "pages": pages,
        "songs": songs,
    }
    output.write_text("export const bhajanBook = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    print(f"Prepared {len(songs)} complete text readings, {extracted_lines} source lines, and {len(pages)} original pages.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--render", action="store_true")
    args = parser.parse_args()
    prepare(args.input, args.output, args.render)
