#!/usr/bin/env python3
"""Reproducible fully offline French LA PREUVE LAB ZIP, with local-link audit.
No API, third-party dependencies, patient data, or nonstatic backend.
"""
from __future__ import annotations

import html
import re
import sys
import zipfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

BASE = Path(__file__).resolve().parents[1] / "la-preuve-avant-le-diagnostic"
HTML = (
    "index.html", "app.html", "workbench.html", "studio.html",
    "evaluation.html", "confidentialite.html", "licence.html",
)
OTHER = ("manifest.webmanifest", "sw.js")
FILES = HTML + OTHER
OUT = BASE / "LA_PREUVE_LAB_SUITE_OFFLINE_COMPLETE.zip"
ROOTS = (
    "https://pigapocket.com/la-preuve-avant-le-diagnostic/",
    "https://mounirakarkach04-pixel.github.io/ados/la-preuve-avant-le-diagnostic/",
)
ALIAS = {"download": "app.html", "workbench-download": "workbench.html"}
BUNDLE = '<meta name="ak-suite-bundle" content="local">'
DIRECT_ZIP_URL = "https://mounirakarkach04-pixel.github.io/ados/la-preuve-avant-le-diagnostic/LA_PREUVE_LAB_SUITE_OFFLINE_COMPLETE.zip"
INSTALL_MESSAGE = (
    "Suite hors ligne installée — ouvrir LA PREUVE LAB"
)
README = """LA PREUVE LAB — SUITE FRANÇAISE TOTALEMENT HORS LIGNE
Auteur : Mounir Akarkach
Version : 2026-10-24 / lien offline corrigé

1. Décompressez ENTIÈREMENT l’archive ZIP. Gardez tous les fichiers dans le MÊME dossier.
2. Ouvrez index.html du dossier décompressé, puis naviguez : Livre, LAB, QM, Studio, Étude et informations légales.
3. Les liens internes, y compris sur Android dans un navigateur prenant en charge les fichiers locaux, restent locaux. Certaines restrictions de navigateur ou d’accès au système de fichiers peuvent s’appliquer.
4. Un fichier HTML téléchargé seul ne comprend PAS les autres pages. Pour toutes les pages sans Internet, utilisez ce ZIP.
5. Les liens vers Amazon, OMS, ADOS et PIGA Pocket sont EXTERNES et nécessitent Internet.
6. Cas inventés uniquement. Pas de patients, pas de diagnostics ni de prise en charge réelle. Gate 2 clinique: BLOCK.
7. Les événements temporaires doivent être exportés en CSV/JSON avant fermeture. Aucune signature réglementaire.
8. Aucun coût, abonnement, CDN ni compte n’est nécessaire pour l’utilisation locale.

© 2026 Mounir Akarkach · PIGA / A7SEM Reverse
"""

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids: set[str] = set()
        self.refs: list[tuple[str, str, str]] = []
        self.unwanted_downloads: list[str] = []

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "a" and "download" in d and (d.get("href") or "").split("#")[0] in HTML:
            self.unwanted_downloads.append(d.get("href") or "(empty)")
        if "id" in d and d["id"]:
            self.ids.add(d["id"])
        for attr in ("href", "src", "action"):
            if attr in d and d[attr]:
                self.refs.append((tag, attr, d[attr]))

    handle_startendtag = handle_starttag

def rewrite(content: str, name: str) -> str:
    if BUNDLE in content:
        raise ValueError(f"Unexpected bundle marker already in original source: {name}")
    if re.search(r"</head\s*>", content, flags=re.I):
        content = re.sub(r"</head\s*>", BUNDLE + "</head>", content, count=1, flags=re.I)
    else:
        content = re.sub(r"<body\b", BUNDLE + "<body", content, count=1, flags=re.I)
    for root in ROOTS:
        for file in FILES:
            content = content.replace(root + file, file)
        for short, target in ALIAS.items():
            content = content.replace(root + short, target)
    # The archive is ALREADY extracted; direct ZIP links would require Internet and are unnecessary.
    content = content.replace('href="' + DIRECT_ZIP_URL + '"', 'href="app.html"')
    content = content.replace("Télécharger directement la suite complète (.ZIP) ↓", "Suite installée · ouvrir LA PREUVE LAB →")
    content = content.replace("Télécharger directement le ZIP complet ↓", "Suite installée · ouvrir LA PREUVE LAB →")
    # Any <a download> for a standalone app would merely save another HTML file.
    # In the installed ZIP those are ordinary LOCAL NAVIGATION links, not downloads.
    def make_local_navigation(match: re.Match[str]) -> str:
        attrs, target = match.group(1), match.group(2)
        attrs = re.sub(r'\s+download\s*=\s*(?:"[^"]*"|\x27[^\x27]*\x27)', '', attrs, flags=re.I)
        label = ("Ouvrir LA PREUVE LAB locale" if target == "app" else "Ouvrir QM Workbench locale")
        return "<a" + attrs + ">" + label + "</a>"
    content = re.sub(
        r'<a\b([^>]*\bhref="(app|workbench)\.html"[^>]*\bdownload="[^"]*"[^>]*)>.*?</a>',
        make_local_navigation, content, flags=re.I | re.S
    )
    # zip builder is deliberately NOT included: running fetch() from file:// is restricted
    content = re.sub(
        r'(<a\b[^>]*href=["\'])offline-suite\.html(["\'][^>]*>).*?(</a>)',
        lambda m: m.group(1) + "app.html" + m.group(2) + INSTALL_MESSAGE + m.group(3),
        content, flags=re.I | re.S
    )
    # Single-file guard sees bundle marker and therefore retains functional local navigation.
    return content

def audit(items: dict[str, str]) -> tuple[int, list[str]]:
    problems: list[str] = []
    checked = 0
    for name in HTML:
        tree = LinkParser()
        tree.feed(items[name])
        for href in tree.unwanted_downloads:
            problems.append(f"{name}: local page wrongly still has download attribute: {href}")
        if BUNDLE not in items[name]:
            problems.append(f"{name}: local-bundle marker missing")
        for tag, prop, raw in tree.refs:
            url = html.unescape(raw).strip()
            if not url or url.startswith(("https://", "http://", "mailto:", "tel:", "data:", "blob:", "javascript:")):
                continue
            if url.startswith("//"):
                continue
            if url.startswith("/"):
                problems.append(f"{name}: absolute file-path in offline bundle {prop}={url}")
                continue
            parts = urlsplit(url)
            dest = unquote(parts.path)
            if dest in ("", ".", "./"):
                if parts.fragment:
                    checked += 1
                    if parts.fragment not in tree.ids:
                        problems.append(f"{name}: broken anchor {url}")
                continue
            if "/" in dest:
                problems.append(f"{name}: nested relative resource not packaged: {url}")
                continue
            checked += 1
            if dest not in FILES:
                problems.append(f"{name}: dead local link: {url}")
            if parts.fragment and dest in HTML:
                target = LinkParser()
                target.feed(items[dest])
                if parts.fragment not in target.ids:
                    problems.append(f"{name}: missing target anchor: {url}")
    return checked, problems

def main():
    data = {name: (BASE / name).read_text(encoding="utf-8") for name in HTML}
    for name in OTHER:
        (BASE / name).read_bytes()  # existence and encoding of non-HTML assets
    bundle = {name: rewrite(data[name], name) for name in HTML}
    count, failures = audit(bundle)
    if failures:
        for issue in failures:
            print("FAIL", issue, file=sys.stderr)
        raise SystemExit(f"BLOCK: {len(failures)} broken local references")
    with zipfile.ZipFile(OUT, mode="w", compression=zipfile.ZIP_DEFLATED, compresslevel=9, strict_timestamps=True) as zf:
        for name in FILES:
            entry = zipfile.ZipInfo(filename=name, date_time=(2026, 10, 24, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o644 << 16
            blob = (bundle[name].encode("utf-8") if name in HTML else (BASE / name).read_bytes())
            zf.writestr(entry, blob, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
        entry = zipfile.ZipInfo(filename="README.txt", date_time=(2026, 10, 24, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o644 << 16
        zf.writestr(entry, README.encode("utf-8"), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    with zipfile.ZipFile(OUT) as zf:
        assert zf.testzip() is None
        assert len(zf.namelist()) == 10
        assert all(BUNDLE.encode() in zf.read(name) for name in HTML)
    print(f"PASS_OFFLINE_FRENCH_LINKS checked={count} files=10 archive={OUT.name} bytes={OUT.stat().st_size}")

if __name__ == "__main__":
    main()
