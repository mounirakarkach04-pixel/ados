#!/usr/bin/env python3
"""Create a reproducible ADOS book-portal + Evidence Studio + Governance Lite offline bundle.

No network access, dependencies, privileged runtime, data persistence or clinical actions.
Finite A7SEM Reverse audit: all packaged local href/src destinations must exist.
"""
from __future__ import annotations
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo
import hashlib, re, sys

ROOT=Path(__file__).resolve().parents[1]
ARCHIVE=ROOT/"ADOS_BUCH_STUDIO_GOVERNANCE_OFFLINE_COMPLETE.zip"
PAGES={
    "index.html":"index.html",
    "studio.html":"studio.html",
    "governance-lite.html":"downloads/ADOS_Governance_Lite_v0_6_OFFLINE.html",
    "offline-downloads.html":"offline-downloads.html",
    "datenschutz.html":"datenschutz.html",
    "nutzungsbedingungen.html":"nutzungsbedingungen.html",
}
ASSETS={
    "cover.jpg":"cover.jpg",
    "ados-icon.svg":"ados-icon.svg",
    "manifest.webmanifest":"manifest.webmanifest",
    "sw.js":"sw.js",
    "ADOS_A7SEM_PIGA_GOVERNANCE_MATRIX_v0_6.xlsx":"downloads/ADOS_A7SEM_PIGA_GOVERNANCE_MATRIX_v0_6.xlsx",
}
ROOT_URLS=(
    "https://pigapocket.com/ados/",
    "https://mounirakarkach04-pixel.github.io/ados/",
)
OFFLINE_MARKER='<meta name="ados-offline-bundle" content="local">'
README="""ADOS — VOLLSTÄNDIGES OFFLINE-WEBPAKET (FORSCHUNGSDEMO)
© 2026 Mounir Akarkach. Keine klinische Diagnostik oder Therapie.

INSTALLATION
1. ZIP VOLLSTÄNDIG in einen Ordner entpacken. Dateien zusammenlassen.
2. index.html in einem lokalen HTML-fähigen Browser öffnen.
3. Buchvorstellung, Evidence Studio, Governance Lite und Rechtstexte sind im Paket.
4. Die Buchvorstellung ist KEIN vollständiges Buch-Manuskript oder Amazon-E-Book.
5. Die psychologischen Lehrfälle sind FIKTIV. Niemals reale Klienten- oder Patientendaten eingeben.
6. Gate 1 ist nur eine dokumentarische Lerndemo; klinische Handlungen: Gate 2 BLOCK.
7. Von der App zur BuchVORSTELLUNGSSEITE mit den internen Links zurückkehren.
8. Browser- und Android-Dateianbieter können lokale Verknüpfungen via content:// einschränken.
   In diesem Fall einzelne Apps öffnen oder die verifizierte Online-Buchseite nutzen:
   https://pigapocket.com/ados/  (benötigt Internet).
9. Externe Links (Amazon, franz. LA PREUVE LAB, PIGA) brauchen Internet.
10. Keine Kosten oder Cloud-Anmeldung für die lokale Nutzung; Exporte lokal und unverschlüsselt.

Paketinhalt: index.html, studio.html, governance-lite.html, offline-downloads.html,
datenschutz.html, nutzungsbedingungen.html, Cover, Symbol, PWA-Dateien, Excel-Matrix.

A7SEM Reverse: endliche Link- und Archivprüfung beim Erstellen. Keine klinische Freigabe.
"""
# A standalone app on file:// intentionally rewrites local relative anchors to online URLs.
# In the complete ZIP, remove ONLY these navigation adapters. Preserve the core app scripts.
NAV_IDS=("ados-android-link-fix","ados-android-document-links","ados-single-file-nav")
class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids=set()
        self.links=[]
    def handle_starttag(self,tag,attrs):
        values=dict(attrs)
        if values.get("id"): self.ids.add(values["id"])
        for key in ("href","src"):
            if values.get(key): self.links.append((tag,key,values[key]))
    handle_startendtag=handle_starttag

def rewrite(original:str,page:str)->str:
    if OFFLINE_MARKER in original:
        raise ValueError("Bundled source leaked into clean repository: "+page)
    if not re.search(r"</head\s*>",original,re.I):
        raise ValueError("No HTML head: "+page)
    result=re.sub(r"</head\s*>",OFFLINE_MARKER+"</head>",original,count=1,flags=re.I)
    for ident in NAV_IDS:
        result=re.sub(r'<script\b[^>]*\bid=["\']'+ident+r'["\'][^>]*>.*?</script\s*>','',result,flags=re.I|re.S)
    if page=="offline-downloads.html":
        # The download hub normally fetches over HTTPS. Replace download controls
        # by ordinary local anchors, then remove this network-dependent script.
        result=re.sub(r'<button\b[^>]*id="ados-download"[^>]*>.*?</button>',
                      '<a class="btn gold" href="governance-lite.html">Governance Lite im Offline-Paket öffnen →</a>',
                      result,flags=re.I|re.S)
        result=re.sub(r'<button\b[^>]*id="lab-download"[^>]*>.*?</button>',
                      '<a class="btn gold" href="https://pigapocket.com/la-preuve-avant-le-diagnostic/">Französisches Forschungsprojekt (online) ↗</a>',
                      result,flags=re.I|re.S)
        result=re.sub(r'<script(?![^>]*\bid=)[^>]*>.*?</script\s*>','',result,flags=re.I|re.S)
        result=result.replace("Beide Offline-Apps.","ADOS als komplettes Offline-Paket.")
        result=result.replace('Jetzt mit korrigierter Android-Navigation.','Buchportal, Studio und Governance Lite lokal.')
        result=result.replace('<div class="status" id="ados-status" role="status">Bereit.</div>',
                              '<div class="status" role="status">Im entpackten Ordner lokal verfügbar.</div>')
        result=result.replace('<div class="status" id="lab-status" role="status">Prêt à télécharger.</div>',
                              '<div class="status" role="status">Die französische Anwendung ist ein separates Online-/ZIP-Paket und nicht Bestandteil dieses ADOS-ZIP.</div>')
    # Map both complete public origins to the local bundle. Leave external URLs intact.
    def attr_replacer(match:re.Match[str])->str:
        attr,quote,value=match.group(1),match.group(2),match.group(3)
        if value in ("./",".",""):
            return attr+"="+quote+"index.html"+quote
        if value.startswith("#") or value.startswith(("mailto:","tel:","data:","blob:","javascript:")):
            return match.group(0)
        # Only rewrite ADOS links and bundled asset paths.
        rel=value
        for root in ROOT_URLS:
            if rel.startswith(root):
                rel=rel[len(root):]
                break
        parsed=urlsplit(rel)
        dest=parsed.path
        # Cancer research apps live separately; ADOS ZIP must retain reachable ONLINE URLs.
        if dest in ("cancer/index.html","cancer-system-state/index.html"):
            return attr+"="+quote+"https://mounirakarkach04-pixel.github.io/ados/"+dest+quote
        if dest=="downloads/ADOS_GOVERNANCE_LITE_FINAL_V0_6_GESAMTPAKET.zip":
            return attr+"="+quote+"https://mounirakarkach04-pixel.github.io/ados/downloads/ADOS_GOVERNANCE_LITE_FINAL_V0_6_GESAMTPAKET.zip"+quote
        if dest.startswith("la-preuve-avant-le-diagnostic/"):
            return attr+"="+quote+"https://pigapocket.com/"+dest+quote
        if dest.startswith("downloads/"):
            dest=dest[len("downloads/"):]
        if dest=="ADOS_Governance_Lite_v0_6_OFFLINE.html":
            dest="governance-lite.html"
        if dest=="ADOS_BUCH_STUDIO_GOVERNANCE_OFFLINE_COMPLETE.zip":
            dest="index.html"
        if dest in ("", ".") and rel in ROOT_URLS:
            dest="index.html"
        if dest in PAGES or dest in ASSETS or dest=="governance-lite.html":
            suffix=("#"+parsed.fragment) if parsed.fragment else ""
            # Preserve query for images only if necessary; the file is local.
            return attr+"="+quote+dest+suffix+quote
        if value.startswith(ROOT_URLS):
            return attr+"="+quote+"index.html"+quote
        return match.group(0)
    result=re.sub(r'\b(href|src)\s*=\s*(["\'])(.*?)\2',attr_replacer,result,flags=re.I|re.S)
    # Preserve an alternate internet-only destination, not a duplicate book button.
    result=re.sub(
        r'(<a[^>]*href=")index[.]html("[^>]*>Alternative Buchseite ↗</a>)',
        lambda match: match.group(1)+"https://mounirakarkach04-pixel.github.io/ados/"+match.group(2),
        result, flags=re.I
    )
    # Local HTML navigation must open in the SAME tab without a download flag.
    def local_anchor(match):
        tag=match.group(0)
        href=re.search(r'href="([^"]+)"',tag,re.I)
        if href and re.match(r'^(index|studio|governance-lite|offline-downloads|datenschutz|nutzungsbedingungen)[.]html($|#)',href.group(1),re.I):
            tag=re.sub(r'[ ]+(target|download)="[^"]*"', "",tag,flags=re.I)
            tag=re.sub(r'[ ]+download(?=[ >])', "",tag,flags=re.I)
        return tag
    result=re.sub(r'<a[^>]*>',local_anchor,result,flags=re.I)
    return result

def audit(pages:dict[str,str])->int:
    allfiles=set(PAGES)|set(ASSETS)|{"README.txt"}
    parsed={name:Parser() for name in pages}
    for name in pages: parsed[name].feed(pages[name])
    issues=[];count=0
    for name,tree in parsed.items():
        if OFFLINE_MARKER not in pages[name]: issues.append(name+": marker missing")
        if re.search(r'<script\b[^>]*\bid=["\'](?:ados-android-link-fix|ados-android-document-links|ados-single-file-nav)',pages[name]):
            issues.append(name+": single-file online redirect still active")
        for _,attr,value in tree.links:
            value=value.strip()
            if value.startswith(("https://","http://","mailto:","tel:","data:","blob:","javascript:","//")):
                continue
            part=urlsplit(value)
            target=unquote(part.path)
            if target in ("",".","./"):
                target=name
            if target.startswith("/") or "../" in target:
                issues.append(name+": external filesystem path "+value)
                continue
            count+=1
            if target not in allfiles:
                issues.append(name+": unavailable local resource "+value)
            elif part.fragment and target in parsed and part.fragment not in parsed[target].ids:
                issues.append(name+": missing fragment target "+value)
    for page in ("index.html","studio.html","governance-lite.html"):
        t=parsed[page]
        if not any(k=="href" and v=="index.html" for _,k,v in t.links):
            issues.append(page+": no local book return")
    if issues:
        for issue in issues:print("BLOCK",issue,file=sys.stderr)
        raise SystemExit("BLOCK: "+str(len(issues))+" missing offline references")
    return count

def main():
    content={dest:rewrite((ROOT/src).read_text(encoding="utf-8"),dest) for dest,src in PAGES.items()}
    link_count=audit(content)
    with ZipFile(ARCHIVE,"w",ZIP_DEFLATED,compresslevel=9) as z:
        for dest,src in {**PAGES,**ASSETS}.items():
            data=content[dest].encode("utf-8") if dest in PAGES else (ROOT/src).read_bytes()
            entry=ZipInfo(dest,(2026,10,24,0,0,0));entry.compress_type=ZIP_DEFLATED;entry.external_attr=0o644<<16
            z.writestr(entry,data,compress_type=ZIP_DEFLATED,compresslevel=9)
        entry=ZipInfo("README.txt",(2026,10,24,0,0,0));entry.compress_type=ZIP_DEFLATED;entry.external_attr=0o644<<16
        z.writestr(entry,README.encode("utf-8"),compress_type=ZIP_DEFLATED,compresslevel=9)
    with ZipFile(ARCHIVE) as z:
        assert z.testzip() is None
        assert len(z.namelist()) == len(PAGES)+len(ASSETS)+1
        assert b'ADOSGovernedLoop' in z.read("governance-lite.html")
        assert b'ADOSEvidenceStudio' in z.read("studio.html")
    digest=hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()
    print(f"ADOS_OFFLINE_BUNDLE_PASS files={len(PAGES)+len(ASSETS)+1} links={link_count} size={ARCHIVE.stat().st_size} sha256={digest}")
if __name__=="__main__":main()
