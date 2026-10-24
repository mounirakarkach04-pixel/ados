#!/usr/bin/env python3
"""Zero-cost dual ADOS / LA PREUVE LAB live readback. Read-only, bounded, nonclinical."""
import hashlib
import json
import os
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen
from zipfile import ZipFile

BASE = "https://mounirakarkach04-pixel.github.io/ados/"
FRENCH = BASE + "la-preuve-avant-le-diagnostic/"
RETRIES = 7
PAUSE_SECONDS = 8
REPORT = {"release": "dual-ados-lapreuve-2026-10-24", "pages": [], "zip": {}, "canonical": [], "gate2": "BLOCK", "clinical_release": False}
CHECKS = [
    (BASE, ["Die Architektur des Selbst", "Evidence Studio", "offline-downloads.html"]),
    (BASE + "studio.html", ["ADOS Evidence Studio", "ados-studio-book-return", "https://pigapocket.com/ados/"]),
    (BASE + "offline-downloads.html", ["ados-download", "lab-download", "la-preuve-avant-le-diagnostic/app.html"]),
    (BASE + "downloads/ADOS_Governance_Lite_v0_6_OFFLINE.html", ["ados-offline-book-return", "https://pigapocket.com/ados/"]),
    (BASE + "ADOS_BUCH_STUDIO_GOVERNANCE_OFFLINE_COMPLETE.zip", []),
    (FRENCH, ["La preuve avant le diagnostic", "LA PREUVE LAB", "app.html"]),
    (FRENCH + "app.html", ["lapreuve-offline-book-return", "https://pigapocket.com/la-preuve-avant-le-diagnostic/"]),
    (FRENCH + "offline-suite.html", ["LA_PREUVE_LAB_SUITE_OFFLINE_COMPLETE.zip"]),
    (FRENCH + "LA_PREUVE_LAB_SUITE_OFFLINE_COMPLETE.zip", []),
]
def get(url):
    req = Request(url, headers={"User-Agent":"PIGA-dual-release-readback/1.0", "Cache-Control":"no-cache"})
    with urlopen(req, timeout=22) as response:
        data = response.read(1250000)
        return response.status, response.headers.get("Content-Type",""), data

def check_live():
    issues = []
    checks = []
    for url, markers in CHECKS:
        try:
            status, mime, body = get(url)
            data = body.decode("utf-8","replace") if markers else ""
            missing = [m for m in markers if m not in data]
            item = {"url":url,"status":status,"bytes":len(body),"sha256":hashlib.sha256(body).hexdigest(),"missing":missing}
            checks.append(item)
            if url.endswith(".zip"):
                expected=(REPORT["ados_zip"]["sha256"] if "ADOS_BUCH" in url else REPORT["zip"]["sha256"])
                if item["sha256"]!=expected: missing.append("source_sha256_mismatch")
            if status != 200 or missing or len(body)<300:
                issues.append(item)
        except Exception as e:
            issues.append({"url":url,"error":str(e)[:200]})
    return checks,issues

def check_local():
    app = Path("downloads/ADOS_Governance_Lite_v0_6_OFFLINE.html").read_text(encoding="utf-8")
    lab = Path("la-preuve-avant-le-diagnostic/app.html").read_text(encoding="utf-8")
    studio=Path("studio.html").read_text(encoding="utf-8")
    assert 'id="ados-offline-book-return"' in app
    assert 'id="ados-studio-book-return"' in studio
    assert 'id="lapreuve-offline-book-return"' in lab
    assert "location.protocol===" + '"content:"' in lab
    assert 'https://pigapocket.com/ados/' in app
    assert 'https://pigapocket.com/la-preuve-avant-le-diagnostic/' in lab
    bundle = Path("la-preuve-avant-le-diagnostic/LA_PREUVE_LAB_SUITE_OFFLINE_COMPLETE.zip")
    required = {"index.html","app.html","workbench.html","studio.html","evaluation.html","confidentialite.html","licence.html","manifest.webmanifest","sw.js","README.txt"}
    with ZipFile(bundle) as z:
        assert set(z.namelist())==required
        assert z.testzip() is None
        for page in sorted(n for n in required if n.endswith(".html")):
            src=z.read(page).decode("utf-8")
            assert '<meta name="ak-suite-bundle" content="local">' in src, page
            assert 'href="index.html"' in src, page
            assert 'href="https://pigapocket.com/la-preuve-avant-le-diagnostic/"' not in src, page
        REPORT["zip"]={"files":len(required),"bytes":bundle.stat().st_size,"sha256":hashlib.sha256(bundle.read_bytes()).hexdigest(),"book_return_local":True}
    ados = Path("ADOS_BUCH_STUDIO_GOVERNANCE_OFFLINE_COMPLETE.zip")
    required_ados = {"index.html","studio.html","governance-lite.html","offline-downloads.html","datenschutz.html","nutzungsbedingungen.html","cover.jpg","ados-icon.svg","manifest.webmanifest","sw.js","ADOS_A7SEM_PIGA_GOVERNANCE_MATRIX_v0_6.xlsx","README.txt"}
    with ZipFile(ados) as z:
        assert set(z.namelist())==required_ados, "ADOS ZIP manifest"
        assert z.testzip() is None, "ADOS ZIP CRC"
        for page in ["index.html","studio.html","governance-lite.html","offline-downloads.html","datenschutz.html","nutzungsbedingungen.html"]:
            src=z.read(page).decode("utf-8")
            assert '<meta name="ados-offline-bundle" content="local">' in src, page
            assert 'href="index.html"' in src, page
            if page == "studio.html":
                assert src.count('href="index.html"') >= 1
                assert 'https://mounirakarkach04-pixel.github.io/ados/' in src, "Online backup book link missing"
                assert 'href="index.html" target="_blank"' not in src, "Book return opens another tab"
            assert 'ados-single-file-nav' not in src and 'ados-android-document-links' not in src, page
        REPORT["ados_zip"]={"files":len(required_ados),"bytes":ados.stat().st_size,"sha256":hashlib.sha256(ados.read_bytes()).hexdigest(),"book_return_local":True}
    return True

def canonical_readback():
    testcases = [
        ("https://pigapocket.com/ados/", ["Die Architektur des Selbst", "offline-downloads.html", "ADOS_BUCH_STUDIO_GOVERNANCE_OFFLINE_COMPLETE.zip"]),
        ("https://pigapocket.com/ados/studio.html", ["ados-studio-book-return", "https://pigapocket.com/ados/"]),
        ("https://pigapocket.com/ados/offline-downloads.html", ['id="ados-download"', 'id="lab-download"', "ADOS_BUCH_STUDIO_GOVERNANCE_OFFLINE_COMPLETE.zip"]),
        ("https://pigapocket.com/la-preuve-avant-le-diagnostic/", ["LA PREUVE LAB", "app.html"]),
        ("https://pigapocket.com/la-preuve-avant-le-diagnostic/app.html", ["lapreuve-offline-book-return"]),
    ]
    errors = []
    for url, markers in testcases:
        try:
            status, mime, raw = get(url)
            txt=raw.decode("utf-8","replace")
            missing=[marker for marker in markers if marker not in txt]
            info={"url":url,"status":status,"bytes":len(raw),"missing":missing}
            REPORT["canonical"].append(info)
            if status!=200 or missing:
                errors.append(info)
        except Exception as e:
            info={"url":url,"error":str(e)[:180]}
            REPORT["canonical"].append(info)
            errors.append(info)
    REPORT["canonical_status"]="PASS" if not errors else "FAIL"
    return errors

def main():
    check_local()
    problems=[]
    for step in range(1,RETRIES+1):
        checks,problems=check_live()
        REPORT["pages"]=checks
        REPORT["attempts"]=step
        if not problems:
            break
        print("BOUNDED_READBACK",step,"of",RETRIES,"unmet",len(problems),flush=True)
        if step!=RETRIES: time.sleep(PAUSE_SECONDS)
    canonical_issues=canonical_readback()
    REPORT["fallback_status"]="PASS" if not problems else "FAIL"
    REPORT["unmet"]=problems
    Path("qa-reports").mkdir(exist_ok=True)
    Path("qa-reports/dual-apps-live.json").write_text(json.dumps(REPORT,indent=2,ensure_ascii=False),encoding="utf-8")
    print("DUAL_APPS_READBACK",json.dumps(REPORT,ensure_ascii=False),flush=True)
    if problems:
        raise SystemExit("BLOCK: public GitHub Pages failed dual-app readback")
    if canonical_issues:
        raise SystemExit("DELAY: canonical domain content has outdated or broken navigation")
if __name__=="__main__":
    main()
