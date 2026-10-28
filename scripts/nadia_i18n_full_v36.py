#!/usr/bin/env python3
"""Generate offline, full-surface Nadia Bloom UI localization packs.
Only developer-written static UI strings are translated. Never upload family data.
Fail closed when a language or a catalog entry cannot be translated.
"""
import html as html_module
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "nadias-bloom"
HTMLS = [ROOT / "index.html", ROOT / "Nadias_Bloom_Offline.html"]
LANGS = ("en","ar","fr","es","zh","it","pt","th","ms","id","ko","ja","ru","nl")
CACHE_FILE = Path(__file__).resolve().parent / "nadia_i18n_v36_cache.json"
MARK_BEG = "/* NADIA_UI_I18N_V36_PACK_START */"
MARK_END = "/* NADIA_UI_I18N_V36_PACK_END */"
UA = "Mozilla/5.0 (compatible; NadiaBloomStaticLocalization/1.0)"
EXTRA = (
  "Noch keine Termine. Ein neues Kapitel darf leicht beginnen.",
  "Noch keine Aufgaben. Gut so.",
  "Heute ist noch nichts offen.",
  "Für heute sind noch keine Termine eingetragen.",
  "Kein Geburtstag hinterlegt.",
  "Noch keine Mahlzeiten geplant.",
  "Die Einkaufsliste ist leer. Vorhandene Vorräte zuerst.",
  "Noch keine Familiennotizen.",
  "Noch keine Monatsbuchungen.",
  "Noch keine gemeinsamen Gedanken.",
  "Jeder kleine gute Moment zählt.",
  "Dieser Tag ist noch frei. Raum für das, was wichtig ist.",
  "Keine geplanten Termine in den nächsten sieben Tagen. Genieße die freie Zeit.",
  "Diesen Eintrag wirklich entfernen?",
  "Bitte zuerst etwas eintragen.",
  "Gespeichert.",
  "Termin",
  "Termine",
  "eigene Termine",
  "Eigener Termin",
  "Geburtstag",
  "Geburtstag:",
  "Familie",
  "Feiertag",
  "Ferien",
  "Islamischer Termin",
  "Heute wichtig",
  "In Ruhe erledigen",
  "Kann warten",
  "Ohne Datum",
  "Ohne Uhrzeit",
  "Für die ganze Familie",
  "Jumuʿa",
  "Deutschland: Feiertage und Hessen-Schulferien.",
  "Tage", "Tag", "Wochen", "Monat", "Monate",
)
EXCLUDE = (
  "Nadia’s Bloom", "BARAKAH HOME 2027", "Alhamdulillah",
  "Iman", "Duʿā", "ISBN", "PIGA", "Amazon",
)

def source_catalog():
    strings = set(EXTRA)
    for file in HTMLS:
        src=file.read_text(encoding="utf8")
        doc=src.split("<body",1)[-1].split("<script>",1)[0]
        for raw in re.findall(r">([^<>]+)<",doc):
            s=html_module.unescape(raw).strip()
            if s and len(s)>1 and not s.isdigit() and not re.fullmatch(r"[\d€₽\W]+",s,re.U):
                if not any(s==ex for ex in EXCLUDE):strings.add(s)
        for raw in re.findall(r'\b(?:placeholder|aria-label|title|alt)="([^"]+)"',doc):
            s=html_module.unescape(raw).strip()
            if s and not s.startswith("http") and not s.startswith("data:"):strings.add(s)
    strings={s for s in strings if "data:image" not in s and len(s)<1100 and len(s)>1}
    return sorted(strings,key=lambda x:(len(x),x))

def remote_translate(text,lang):
    if not text.strip():return ""
    params=urllib.parse.urlencode({"client":"gtx","sl":"de","tl":lang,"dt":"t","q":text})
    url="https://translate.googleapis.com/translate_a/single?"+params
    err=None
    for attempt in range(3):
        try:
            req=urllib.request.Request(url,headers={"User-Agent":UA,"Accept":"application/json"})
            with urllib.request.urlopen(req,timeout=22) as response:
                raw=json.loads(response.read(1200000).decode("utf8"))
            result="".join(str(chunk[0] or "") for chunk in raw[0])
            if not result.strip():raise ValueError("empty translation")
            return result
        except Exception as exc:
            err=exc
            time.sleep(min(attempt+1,3))
    raise RuntimeError(f"Translation API unavailable for {lang}: {type(err).__name__}: {err}")

def translate_all(catalog):
    cache=json.loads(CACHE_FILE.read_text("utf8")) if CACHE_FILE.exists() else {}
    for lang in LANGS:
        current=cache.setdefault(lang,{})
        todo=[s for s in catalog if s not in current]
        # Explicit sentinels enable batched translation while preserving original keys.
        # If punctuation/token changes, retry individually instead of assigning wrong phrases.
        for offset in range(0,len(todo),14):
            group=todo[offset:offset+14]
            wrapped="\n".join(f"[[NADIA{i:02d}]] {v}" for i,v in enumerate(group))
            try:
                translated=remote_translate(wrapped,lang)
                matches=list(re.finditer(r"\[\[\s*NADIA\s*(\d{1,2})\s*\]\]\s*",translated,re.I))
                mapped={}
                if len(matches)==len(group) and [int(x.group(1)) for x in matches]==list(range(len(group))):
                    for i,m in enumerate(matches):
                        end=matches[i+1].start() if i+1<len(matches) else len(translated)
                        mapped[group[i]]=translated[m.end():end].strip()
                if len(mapped)!=len(group) or any(not x for x in mapped.values()):
                    mapped={item:remote_translate(item,lang).strip() for item in group}
                for k,v in mapped.items():
                    if not v:raise ValueError(f"Blank localization {lang} {k[:70]}")
                    current[k]=v
            except Exception as exc:
                CACHE_FILE.write_text(json.dumps(cache,ensure_ascii=False,indent=1)+"\n","utf8")
                raise RuntimeError(f"{lang}: progress {len(current)}/{len(catalog)}; {exc}") from exc
            if offset%112==0:
                CACHE_FILE.write_text(json.dumps(cache,ensure_ascii=False,indent=1)+"\n","utf8")
            time.sleep(.15)
        print("NADIA_LANGUAGE_PACK",lang,len(current),len(catalog),flush=True)
        CACHE_FILE.write_text(json.dumps(cache,ensure_ascii=False,indent=1)+"\n","utf8")
    for lang in LANGS:
        missing=set(catalog)-set(cache[lang])
        if missing:raise RuntimeError(f"Incomplete language {lang}: {len(missing)} missing")
    return {l:{s:cache[l][s] for s in catalog} for l in LANGS}

def embed(pack):
    serial=json.dumps(pack,ensure_ascii=False,separators=(",",":")).replace("</","<\\/")
    marker=MARK_BEG+"\nwindow.NADIA_UI_V36_PACK="+serial+";\n"+MARK_END
    for file in HTMLS:
        content=file.read_text("utf8")
        content=re.sub(re.escape(MARK_BEG)+r"[\s\S]*?"+re.escape(MARK_END),"",content)
        needle="<script>\nlet nbDeferredInstall=null;"
        if needle not in content:raise RuntimeError(f"Cannot inject language pack in {file.name}")
        content=content.replace(needle,"<script>\n"+marker+"\nlet nbDeferredInstall=null;")
        file.write_text(content,"utf8")
    print("NADIA_ALL_LANGUAGES_EMBEDDED",len(pack),len(next(iter(pack.values()))),flush=True)

if __name__=="__main__":
    catalog=source_catalog()
    print("NADIA_STATIC_SOURCE_CATALOG",len(catalog),flush=True)
    if "--smoke" in sys.argv:
        for lang in LANGS:
            result=remote_translate("Heute im Kalender",lang)
            print("NADIA_TRANSLATION_SMOKE",lang,repr(result),flush=True)
        sys.exit(0)
    data=translate_all(catalog)
    embed(data)
