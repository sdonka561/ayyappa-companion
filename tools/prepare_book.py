"""Render the user-selected scanned book locally for reading and OCR."""

import argparse
from pathlib import Path

import pymupdf


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True, type=Path)
    parser.add_argument("--ocr", required=True, type=Path)
    parser.add_argument("--images", required=True, type=Path)
    args = parser.parse_args()
    args.ocr.mkdir(parents=True, exist_ok=True)
    args.images.mkdir(parents=True, exist_ok=True)
    with pymupdf.open(args.pdf) as document:
        if len(document) != 61:
            raise ValueError("The selected edition must have 61 PDF pages. Review chapter mapping before updating.")
        for index, page in enumerate(document, 1):
            page.get_pixmap(matrix=pymupdf.Matrix(2, 2)).save(args.ocr / f"page-{index:02}.png")
            page.get_pixmap(matrix=pymupdf.Matrix(2.5, 2.5)).save(args.images / f"page-{index:02}.jpg", jpg_quality=82)
    print("Prepared all 61 source pages. OCR images and model cache must remain private.")


if __name__ == "__main__":
    main()
