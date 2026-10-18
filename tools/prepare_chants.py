"""Prepare traditional liturgical readers without mixing spreadsheet columns."""

import argparse
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree

NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def read_cells(path, sheet):
    with zipfile.ZipFile(path) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ElementTree.fromstring(archive.read("xl/sharedStrings.xml"))
            strings = ["".join(t.text or "" for t in item.findall(".//s:t", NS)) for item in root.findall("s:si", NS)]
        root = ElementTree.fromstring(archive.read(f"xl/worksheets/sheet{sheet}.xml"))
        result = {}
        for cell in root.findall(".//s:c", NS):
            value = cell.find("s:v", NS)
            if value is not None:
                result[cell.get("r")] = (strings[int(value.text)] if cell.get("t") == "s" else value.text).strip()
            elif cell.get("t") == "inlineStr":
                result[cell.get("r")] = "".join(t.text or "" for t in cell.findall(".//s:t", NS)).strip()
        return result


def line(value, reference):
    return {"te": value, "reference": reference}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    workbook = args.input / "1oeRnnIt7VN2bI_ZjYu49dZqGRdkynvPx.xlsx"
    ghosha = read_cells(workbook, 5)
    invocations = [line(value, ref) for ref, value in ghosha.items() if re.fullmatch(r"D\d+", ref) and int(ref[1:]) > 1 and value]
    if len(invocations) != 107:
        raise ValueError(f"Sharanaghosha source changed: expected 107 supplied invocations, found {len(invocations)}. Review; do not silently pad to 108.")
    names = read_cells(args.input / "1-G_Kq-QKZlVl8z0EXzWBagleDaq6vbqi.xlsx", 1)
    ashtottaram = []
    for row in range(3, 111):
        if names.get(f"A{row}") != str(row - 2):
            raise ValueError(f"Namavali numbering missing at row {row}")
        ashtottaram.append(line(names[f"C{row}"], f"C{row}"))
    if len(ashtottaram) != 108 or any(not item["te"] for item in ashtottaram):
        raise ValueError("A full 108-entry Telugu namavali is required.")
    prayers = read_cells(workbook, 6)
    pancharatna = []
    for row in [2, 5, 8, 11, 14]:
        value = "\n".join(prayers[f"C{r}"] for r in range(row, row + 3) if f"C{r}" in prayers)
        pancharatna.append(line(value, f"C{row}:C{row + 2}"))
    closing = read_cells(workbook, 7)
    forgiveness = [line(closing[f"N{row}"], f"N{row}") for row in range(2, 7)]
    responses = [line(closing[f"J{row}"], f"J{row}") for row in range(2, 29) if closing.get(f"J{row}")]
    texts = {
        "ashtottaram": ashtottaram,
        "sharanaghosha": invocations,
        "sharanam-108": [line("స్వామియే శరణం అయ్యప్ప", f"Repetition {i}") for i in range(1, 109)],
        "pancharatna": pancharatna,
        "kshamapana": forgiveness,
        "responses": responses,
        "ganesha": [line("శుక్లాంబరధరం విష్ణుం శశివర్ణం చతుర్భుజమ్ ।\nప్రసన్నవదనం ధ్యాయేత్ సర్వవిఘ్నోపశాంతయే ॥", "Niyamavali PDF p. 2")],
        "guru": [line("గురుర్బ్రహ్మా గురుర్విష్ణుః గురుర్దేవో మహేశ్వరః ।\nగురుః సాక్షాత్ పరబ్రహ్మ తస్మై శ్రీగురవే నమః ॥", "Telugu puja PDF p. 2")],
        "gayatri": [line("భూతనాథాయ విద్మహే భవపుత్రాయ ధీమహి ।\nతన్నో శాస్తా ప్రచోదయాత్ ॥", "Niyamavali PDF p. 41")],
    }
    reference = read_cells(args.input / "1HI2h4qhQ-5l4a6M-AbsBayYW4GgieKq1.xlsx", 1)
    songs = []
    for row in range(5, 48):
        name = reference.get(f"C{row}", "")
        if not name:
            continue
        deity = reference.get(f"B{row}", "").strip()
        tempo = "slow" if "slow song" in name.lower() else "varied" if "slow & fast" in name.lower() else "unspecified"
        songs.append({"title": name, "deity": deity, "tempo": tempo, "cell": f"C{row}"})
    output = "export const chantTexts = " + json.dumps(texts, ensure_ascii=False, indent=2) + ";\n"
    output += "export const songCatalogue = " + json.dumps(songs, ensure_ascii=False, indent=2) + ";\n"
    args.output.write_text(output, encoding="utf-8")
    print(f"Prepared {len(ashtottaram)} names, {len(invocations)} supplied sharanaghosha lines, {len(songs)} song titles.")


if __name__ == "__main__":
    main()
