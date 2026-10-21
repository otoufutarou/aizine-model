#!/bin/bash
# Render pptx -> PDF (PowerPoint for Mac) -> PNG (PyMuPDF). Uses only in-repo paths.
set -e
cd "$(dirname "$0")/.."
ROOT=$(pwd)
mkdir -p .tmp output/preview
rm -f .tmp/deck.pdf
osascript <<OSA
tell application "Microsoft PowerPoint"
activate
open POSIX file "$ROOT/output/AI_ViVi_MODEL_PROJECT.pptx"
delay 3
save active presentation in POSIX file "$ROOT/.tmp/deck.pdf" as save as PDF
close active presentation saving no
end tell
OSA
python3 - <<PY
import fitz
d=fitz.open("$ROOT/.tmp/deck.pdf")
for i,p in enumerate(d,1):
    p.get_pixmap(dpi=100).save("$ROOT/output/preview/slide_%02d.png"%i)
print(len(d),"pages")
PY
