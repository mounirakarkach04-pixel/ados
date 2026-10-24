#!/usr/bin/env bash
set -euo pipefail
ROOT="https://mounirakarkach04-pixel.github.io/ados"
for file in cancer-system-state/book.html cancer-system-state/index.html cancer/index.html la-preuve-avant-le-diagnostic/app.html offline-downloads.html; do
 expected="$(sha256sum "$file" | cut -d' ' -f1)"
 ok=0
 for attempt in $(seq 1 12); do
  if curl -fsSL --max-time 18 -H 'Cache-Control: no-cache' "$ROOT/$file?release=$GITHUB_SHA" -o /tmp/piga-release-readback; then
   got="$(sha256sum /tmp/piga-release-readback | cut -d' ' -f1)"
   if [ "$got" = "$expected" ]; then
    echo "LIVE_SHA256=PASS file=$file sha256=$got attempt=$attempt"
    ok=1; break
   fi
   echo "LIVE_SHA256=STALE file=$file attempt=$attempt expected=$expected got=$got"
  else echo "LIVE_HTTP=FAIL file=$file attempt=$attempt"; fi
  sleep 4
 done
 if [ "$ok" -ne 1 ]; then echo "BLOCK live source mismatch: $file";exit 1;fi
done
zip="$ROOT/la-preuve-avant-le-diagnostic/LA_PREUVE_LAB_SUITE_OFFLINE_COMPLETE.zip"
code="$(curl -fsSL -o /tmp/piga-la-preuve-offline.zip --max-time 20 -w '%{http_code}' "$zip")"
if [ "$code" != 200 ]; then echo "BLOCK ZIP http=$code";exit 1;fi
python3 - <<'PY'
from zipfile import ZipFile
from pathlib import Path
p=Path('/tmp/piga-la-preuve-offline.zip')
with ZipFile(p) as f:
 names=f.namelist()
 assert f.testzip() is None
 assert len(names)==10, names
 assert 'app.html' in names and 'studio.html' in names
 html=f.read('app.html').decode('utf-8')
 assert 'ak-suite-bundle' in html
 print(f"REMOTE_FRENCH_ZIP=PASS files={len(names)} bytes={p.stat().st_size} gate2=BLOCK")
PY
echo "PUBLIC_RELEASE=PASS cancer=2 book_portal=1 android=content+file offlinezip=10"