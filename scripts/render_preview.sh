#!/bin/bash
# pptx -> PDF (LibreOffice) -> PNG (PyMuPDF). Uses repo-local paths only (.tmp/, output/preview/).
# Set SOFFICE to the soffice binary if it is not on PATH.
set -e
cd "$(dirname "$0")/.."
SOFFICE=${SOFFICE:-soffice}
mkdir -p .tmp/lo_profile output/preview
rm -f .tmp/AI_ViVi_MODEL_PROJECT.pdf output/preview/slide_*.png
"$SOFFICE" -env:UserInstallation=file://$(pwd)/.tmp/lo_profile --headless --convert-to pdf --outdir .tmp output/AI_ViVi_MODEL_PROJECT.pptx >/dev/null 2>&1
python3 - <<PY
import fitz
d = fitz.open(".tmp/AI_ViVi_MODEL_PROJECT.pdf")
for i, p in enumerate(d, 1):
    p.get_pixmap(dpi=100).save("output/preview/slide_%02d.png" % i)
print(len(d), "pages")
PY
