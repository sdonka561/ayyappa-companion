"""Inventory the public source folder and extract PDFs/Word files for editorial review."""

import argparse
import html
import json
import re
import sys
import time
import urllib.error
import urllib.request
import zipfile
from pathlib import Path
from xml.etree import ElementTree

import pymupdf

ROOT = "1CksLIfctrHaQum3a2GMWF2M-ZbwC4pz0"
ROW = re.compile(
    r'<tr data-selectable data-id="([^"]+)"([\s\S]*?)<strong class="DNoYtb">([\s\S]*?)</strong>'
)


def fetch(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=90) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError):
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    inventory = []
    visited = set()

    def walk(folder, trail):
        if folder in visited:
            return
        visited.add(folder)
        page = fetch(f"https://drive.google.com/drive/folders/{folder}").decode("utf-8")
        for match in ROW.finditer(page):
            file_id, markup, name = match.groups()
            name = html.unescape(re.sub("<[^>]+>", "", name))
            is_folder = 'RDfNAe' in markup.split('aria-selected')[0]
            entry = dict(id=file_id, name=name, folder=trail, kind="folder" if is_folder else "file")
            inventory.append(entry)
            print(f"{trail}/{name}", flush=True)
            if is_folder:
                walk(file_id, f"{trail}/{name}")
                continue
            suffix = Path(name).suffix.lower()
            if suffix not in (".pdf", ".docx", ".xlsx"):
                entry["status"] = "reference-only"
                continue
            target = args.output / (file_id + suffix)
            try:
                if not target.exists():
                    target.write_bytes(fetch(f"https://drive.google.com/uc?export=download&id={file_id}"))
                pages = []
                if suffix == ".pdf":
                    if not target.read_bytes().startswith(b"%PDF-"):
                        entry["status"] = "download-confirmation"
                        entry["error"] = "Drive returned a confirmation page, not a PDF."
                        print("  REVIEW: Download requires confirmation.", flush=True)
                        continue
                    with pymupdf.open(target) as document:
                        for number, page in enumerate(document, 1):
                            text = page.get_text()
                            # Some PDFs paint the same text twice at identical coordinates.
                            lines = text.splitlines()
                            deduped = [line for i, line in enumerate(lines) if i == 0 or line != lines[i - 1]]
                            pages.append(dict(page=number, text="\n".join(deduped)))
                elif suffix == ".docx":
                    with zipfile.ZipFile(target) as document:
                        root = ElementTree.fromstring(document.read("word/document.xml"))
                        ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                        paragraphs = ["".join(t.text or "" for t in p.findall(".//w:t", ns)) for p in root.findall(".//w:p", ns)]
                        pages.append(dict(page=None, text="\n".join(paragraphs)))
                else:
                    with zipfile.ZipFile(target) as document:
                        ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
                        strings = []
                        if "xl/sharedStrings.xml" in document.namelist():
                            root = ElementTree.fromstring(document.read("xl/sharedStrings.xml"))
                            strings = ["".join(t.text or "" for t in item.findall(".//s:t", ns)) for item in root.findall("s:si", ns)]
                        for sheet in sorted(n for n in document.namelist() if re.fullmatch(r"xl/worksheets/sheet\d+\.xml", n)):
                            root = ElementTree.fromstring(document.read(sheet))
                            rows = []
                            for row in root.findall(".//s:row", ns):
                                cells = []
                                for cell in row.findall("s:c", ns):
                                    value = cell.find("s:v", ns)
                                    if cell.get("t") == "s" and value is not None:
                                        cells.append(strings[int(value.text)])
                                    elif cell.get("t") == "inlineStr":
                                        cells.append("".join(t.text or "" for t in cell.findall(".//s:t", ns)))
                                    elif value is not None:
                                        cells.append(value.text or "")
                                rows.append(" | ".join(cells))
                            pages.append(dict(page=None, text="\n".join(rows)))
                entry["pages"] = len(pages) if suffix == ".pdf" else None
                entry["textCharacters"] = sum(len(p["text"]) for p in pages)
                entry["status"] = "text-extracted" if entry["textCharacters"] > 100 else "needs-ocr"
                combined = "".join(p["text"] for p in pages)
                legacy = sum(combined.count(char) for char in "¨∞≥ŒÉÑâ")
                if legacy > max(20, len(combined) * 0.025):
                    entry["status"] = "needs-font-decoding"
                (args.output / (file_id + ".json")).write_text(
                    json.dumps(pages, ensure_ascii=False, indent=2), encoding="utf-8"
                )
            except (urllib.error.URLError, TimeoutError, ValueError, RuntimeError, zipfile.BadZipFile) as error:
                entry["status"] = "extraction-failed"
                entry["error"] = str(error)
                print(f"  ERROR: {error}", flush=True)
            (args.output / "inventory.json").write_text(
                json.dumps(inventory, ensure_ascii=False, indent=2), encoding="utf-8"
            )

    walk(ROOT, "Ayyappa")
    (args.output / "inventory.json").write_text(
        json.dumps(inventory, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Inventoried {len(inventory)} entries.", flush=True)


if __name__ == "__main__":
    main()
