#!/usr/bin/env python3
"""Bounded parallel compilation of fully offline interface translations.
Only published developer UI strings leave CI. Zero personal app records.
"""
import concurrent.futures
import json
import re
import time
from pathlib import Path
import importlib.util

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("nadia_i18n_full_v36",HERE/"nadia_i18n_full_v36.py")
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
catalog=m.source_catalog()
langs=m.LANGS
cache={}
if m.CACHE_FILE.exists():
  cache=json.loads(m.CACHE_FILE.read_text("utf8"))
todo=[]
for lang in langs:
  data=cache.setdefault(lang,{})
  missing=[k for k in catalog if not data.get(k)]
  for i in range(0,len(missing),12):
    todo.append((lang,missing[i:i+12]))
print("NADIA_V37_I18N_PARALLEL_BEGIN",len(catalog),len(todo),len(langs),flush=True)

def translate_group(job):
  lang,items=job
  value="\n".join(f"[[NADIA{i:02d}]] {line}" for i,line in enumerate(items))
  result=m.remote_translate(value,lang)
  matches=list(re.finditer(r"\[\[\s*NADIA\s*(\d{1,2})\s*\]\]\s*",result,re.I))
  if len(matches)==len(items) and [int(x.group(1)) for x in matches]==list(range(len(items))):
    output={}
    for i,mt in enumerate(matches):
      end=matches[i+1].start() if i+1<len(matches) else len(result)
      output[items[i]]=result[mt.end():end].strip()
    if all(output.values()):return lang,output
  # A failed batch boundary must never corrupt unrelated translations.
  # Use individual translations instead, preserving deterministic source keys.
  return lang,{k:m.remote_translate(k,lang).strip() for k in items}

progress=0
try:
  with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    tasks={pool.submit(translate_group,job):job for job in todo}
    for done in concurrent.futures.as_completed(tasks):
      lang,result=done.result()
      if set(result)!=set(tasks[done][1]) or not all(result.values()):
        raise RuntimeError("Invalid translation batch: "+lang)
      cache[lang].update(result)
      progress+=1
      if progress%10==0:
        m.CACHE_FILE.write_text(json.dumps(cache,ensure_ascii=False,indent=1)+"\n","utf8")
        print("NADIA_V37_LANGUAGE_PROGRESS",progress,len(todo),flush=True)
finally:
  m.CACHE_FILE.write_text(json.dumps(cache,ensure_ascii=False,indent=1)+"\n","utf8")
for lang in langs:
  missing=[s for s in catalog if not cache[lang].get(s)]
  if missing:raise RuntimeError(f"UNTRANSLATED UI {lang}: {len(missing)} strings")
pack={lang:{s:cache[lang][s] for s in catalog} for lang in langs}
m.embed(pack)
print("NADIA_V37_ALL_15_COMPLETE_OFFLINE",len(catalog),sum(len(p) for p in pack.values()),flush=True)
