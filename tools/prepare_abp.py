"""Extract the ABP workbook by tab and prayer block, never across unrelated columns."""

import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from prepare_chants import NS, read_cells

BRANDING = {"ayyappas.org", "ABP- AYYAPPA BHAKTHI PEETHAM"}


def prepare(path):
    with zipfile.ZipFile(path) as archive:
        sheets = ET.fromstring(archive.read("xl/workbook.xml")).findall("s:sheets/s:sheet", NS)
    expected_tabs = ["Maladharana and Peetham setup", "Pooja Sequence", "Atha Angapooja", "ASHTOTHARAM", "SARANUGHOSHA", "PANCHARATNA STOTRAM", "HARATHI-KSHAMAPANA", "SAHSRANAMAVALI", "SUPRABHATAM"]
    if [sheet.get("name") for sheet in sheets] != expected_tabs:
        raise ValueError("Expected nine ABP tabs; review the section mapping for this edition.")
    tabs = []
    for index, sheet in enumerate(sheets, 1):
        cells = {ref: value for ref, value in read_cells(path, index).items() if value and value not in BRANDING}
        used = set()
        sections = []

        def block(id, title, column, start, end, kind="prayer", extra=(), numbers=False, paired=False):
            refs = [ref for ref in cells if re.fullmatch(column + r"\d+", ref) and start <= int(ref[len(column):]) <= end]
            refs.extend(ref for ref in extra if ref in cells)
            refs.sort(key=lambda ref: (int(re.search(r"\d+", ref)[0]), re.match(r"[A-Z]+", ref)[0]))
            lines = []
            for ref in refs:
                if ref in used:
                    raise ValueError(f"Duplicate mapping: sheet {index} {ref}")
                used.add(ref)
                line = {"ref": ref, "text": cells[ref]}
                if numbers:
                    number_ref = "A" + ref[1:]
                    if number_ref in cells:
                        line.update(number=cells[number_ref], numberRef=number_ref)
                        used.add(number_ref)
                if paired:
                    paired_ref = "J" + ref[1:]
                    if paired_ref not in cells:
                        raise ValueError(f"Missing source pronunciation at {paired_ref}")
                    line.update(pronunciation=cells[paired_ref], pronunciationRef=paired_ref)
                    used.add(paired_ref)
                lines.append(line)
            if not lines:
                raise ValueError(f"Empty section: {id}")
            sections.append({"id": id, "title": title, "kind": kind, "lines": lines})

        if index == 1:
            for id, title, start, end in [
                ("introduction", "Maladharanam introduction", 1, 3),
                ("purification", "Purification bath & preparation", 4, 8),
                ("mala", "Adorning the mala", 9, 11),
                ("dakshina", "Dakshina & blessings", 13, 15),
                ("vows", "Daily vows & vratham rules", 17, 27),
                ("altar", "Setting up the home altar", 29, 30),
                ("prepare-space", "Prepare & clean the area", 32, 36),
                ("platform", "Adorn the sacred platform", 37, 41),
                ("deities", "Portraits, idols & puja supplies", 42, 49),
                ("peetham-rules", "Peetham guidelines", 51, 58),
                ("offerings", "Mudupu / Mokku & offerings", 60, 65),
            ]:
                block(id, title, "A", start, end, "guide", extra=("C61",) if id == "offerings" else ())
        elif index == 2:
            for id, title, start, end in [
                ("preparation", "Bath, preparation & lamp", 1, 6),
                ("opening", "Opening puja & invocation", 7, 11),
                ("worship", "Anga puja, abhishekam & namavali", 12, 15),
                ("offerings", "Offerings, harathi & namaskaram", 16, 20),
                ("closing", "Stotras, sharanaghosha & closing", 21, 25),
            ]:
                block(id, title, "B", start, end, "guide", numbers=True)
        elif index == 3:
            for col, id, title in [("A", "ganesha", "Ganesha anga puja"), ("H", "subramanya", "Subramanya anga puja"), ("N", "ayyappa", "Ayyappa anga puja")]:
                block(id, title, col, 1, 30)
        elif index == 4:
            block("ganesha", "Ganesha Ashtottaram", "B", 1, 110)
            block("subramanya", "Subramanya Ashtottaram", "D", 1, 110)
            block("viniyoga", "Ayyappa viniyoga & nyasa", "F", 6, 12)
            block("dhyana", "Ayyappa dhyanam", "F", 14, 23)
            block("ayyappa-type-1", "Ayyappa Ashtottaram · Type 1", "K", 2, 109, extra=("L1",))
            block("ayyappa-type-2", "Ayyappa Ashtottaram · Type 2", "O", 2, 109)
            block("completion", "Ayyappa namavali completion", "L", 110, 111)
        elif index == 5:
            block("sharanaghosha", "Ayyappa Sharanaghosha", "D", 1, 113)
        elif index == 6:
            block("pancharatna", "Pancharatna Stotram · Lokaveeram", "C", 1, 20)
            block("phala", "Pancharatna concluding verse", "C", 21, 23)
            block("arunodaya", "Arunodaya & Vandeham salutations", "C", 24, 34)
            block("mahavaidya", "Mahavaidya salutation", "C", 35, 36)
            block("bhootanatha", "Bhootanatha Sadananda", "C", 38, 40)
        elif index == 7:
            block("harathi", "Mangala Harathi", "C", 2, 16, extra=("D1",))
            block("responses", "Ayyappa ninadalu · calls & responses", "J", 1, 28)
            block("kshamapana", "Kshamapana Mantram", "N", 1, 7)
        elif index == 8:
            block("invocation", "Sahasranamavali invocation", "B", 1, 4, extra=("C1",), paired=True)
            block("names", "Sahasranamavali names", "B", 5, 1004, paired=True)
            block("completion", "Sahasranamavali completion", "B", 1005, 1007, paired=True)
        else:
            block("invocation", "Suprabhatam invocation", "C", 2, 2, extra=("D1",))
            for verse in range(1, 15):
                start = 3 + (verse - 1) * 5
                block(f"verse-{verse}", f"Suprabhatam · verse {verse}", "C", start, start + 3)
            block("completion", "Suprabhatam completion", "C", 73, 73)
        if used != set(cells):
            raise ValueError(f"Unmapped source cells in sheet {index}: {set(cells) - used}")
        tabs.append({
            "id": ["maladharana", "sequence", "angapooja", "ashtottaram", "sharanaghosha", "pancharatna", "harathi", "sahasranamavali", "suprabhatam"][index - 1],
            "title": sheet.get("name"),
            "sheetId": sheet.get("sheetId"),
            "cellCount": len(cells),
            "digest": hashlib.sha256(json.dumps(sorted(cells.items()), ensure_ascii=False, separators=(",", ":")).encode()).hexdigest(),
            "sections": sections,
        })
    return tabs


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    tabs = prepare(args.input)
    args.output.write_text("export const abpTabs = " + json.dumps(tabs, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    print(f"Prepared {len(tabs)} tabs, {sum(len(tab['sections']) for tab in tabs)} subsections; all non-branding source cells accounted for.")
