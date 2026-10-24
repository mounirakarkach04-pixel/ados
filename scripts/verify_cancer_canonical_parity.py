#!/usr/bin/env python3
"""Bounded PIGA Gate-1 static release readback. No patient inputs or remote effects."""
import hashlib, json, pathlib, sys, time, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parents[1]
ORIGIN = "https://pigapocket.com"
CASES = [
    ("book", "cancer-system-state/book.html", "/cancer-system-state/book", False),
    ("book_html", "cancer-system-state/book.html", "/cancer-system-state/book.html", False),
    ("reader", "cancer-system-state/index.html", "/cancer-system-state/", False),
    ("reader_download", "cancer-system-state/index.html", "/cancer-system-state/download", True),
    ("systems_lab", "cancer/index.html", "/cancer-system-state/systems-lab", False),
    ("systems_lab_download", "cancer/index.html", "/cancer-system-state/systems-lab-download", True),
    ("evidence_workbench", "cancer-system-state/evidence-workbench.html", "/cancer-system-state/evidence", False),
]
MAX_ATTEMPTS = 7
WAIT_SECONDS = 9
def checksum(value):
    return hashlib.sha256(value).hexdigest()

def get_one(case, nonce):
    label, relative, route, download = case
    expected = (ROOT / relative).read_bytes()
    url = ORIGIN + route + "?piga_cancer_readback=" + nonce
    request = urllib.request.Request(url, headers={
        "User-Agent": "PIGA-Cancer-Canonical-Bounded-Readback/1.0",
        "Cache-Control": "no-cache", "Pragma": "no-cache",
    })
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            actual = response.read()
            headers = response.headers
            response_code = response.getcode()
        disposition = headers.get("content-disposition", "")
        clinical = headers.get("x-piga-cancer-gate2", "")
        content = headers.get("content-type", "")
        errors = []
        if response_code != 200: errors.append("status_not_200")
        if checksum(actual) != checksum(expected): errors.append("hash_mismatch")
        if not clinical.startswith("BLOCK"): errors.append("missing_gate2_BLOCK_header")
        if "text/html" not in content: errors.append("not_html")
        if download and "attachment" not in disposition.lower(): errors.append("missing_attachment_disposition")
        if not download and label == "book":
            if b"Two complementary applications" not in actual: errors.append("book_portal_content_marker_missing")
        return dict(label=label, path=route, code=response_code, expected_sha256=checksum(expected),
                    observed_sha256=checksum(actual), gate2=clinical, content_type=content,
                    attachment=bool("attachment" in disposition.lower()), errors=errors)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError) as exc:
        return dict(label=label,path=route, errors=[type(exc).__name__+": "+str(exc)[:180]])

def main():
    latest = []
    for attempt in range(1, MAX_ATTEMPTS + 1):
        nonce = str(int(time.time())) + "-" + str(attempt)
        with ThreadPoolExecutor(max_workers=6) as pool:
            latest = list(pool.map(lambda case:get_one(case, nonce), CASES))
        failed = [r for r in latest if r["errors"]]
        print(json.dumps(dict(attempt=attempt, total=len(latest), failed=len(failed),
                              cases=latest), indent=2, ensure_ascii=False),flush=True)
        if not failed:
            result = dict(status="CANONICAL_PASS", checks=len(latest), attempted=attempt,
                          route="pigapocket.com/cancer-system-state", gate2="BLOCK",
                          medical_scope="synthetic_research_only")
            print("PIGA_FINAL_READBACK="+json.dumps(result,sort_keys=True),flush=True)
            return 0
        if attempt < MAX_ATTEMPTS:
            time.sleep(WAIT_SECONDS)
    print("PIGA_FINAL_READBACK="+json.dumps(dict(status="CANONICAL_BLOCK",failed=[r["path"] for r in latest if r["errors"]],
                                                attempts=MAX_ATTEMPTS,gate2="BLOCK",
                                                reason="No canonical release attestation without exact byte parity."),sort_keys=True),flush=True)
    return 1
if __name__ == "__main__":
    sys.exit(main())
