#!/usr/bin/env python3
"""PIGA Gate 1 finite live verification of FOUR static apps, no provider inference."""
import concurrent.futures, hashlib, json, pathlib, time, urllib.error, urllib.request, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE="https://pigapocket.com"
TASKS=[
 ("nadia","nadias-bloom/index.html","/nadias-bloom/", "x-nadias-bloom"),
 ("nadia_apple_icon","nadias-bloom/icon-192.png","/nadias-bloom/icon-192.png","x-nadias-bloom"),
 ("nadia_android_icon","nadias-bloom/icon-512.png","/nadias-bloom/icon-512.png","x-nadias-bloom"),
 ("cancer","cancer-system-state/intake.html","/cancer-system-state/intake","x-piga-cancer-gate2"),
 ("ados","research-intake.html","/ados/research-intake.html","x-piga-ados-authority"),
 ("preuve","la-preuve-avant-le-diagnostic/intake.html","/la-preuve-avant-le-diagnostic/intake.html","x-piga-lapreuve-gate2"),
]
def hash_bytes(data): return hashlib.sha256(data).hexdigest()
def check(item,attempt):
 name,path,route,header=item
 expect=(ROOT/path).read_bytes()
 url=BASE+route+"?piga_4app_readback="+str(attempt)+"-"+str(int(time.time()))
 request=urllib.request.Request(url,headers={"User-Agent":"PIGA-4App-Finite-Readback/1.0","Cache-Control":"no-cache"})
 try:
  with urllib.request.urlopen(request,timeout=22) as res:
   raw=res.read();code=res.status;h=res.headers
  bad=[]
  if code!=200:bad.append("http_not_200")
  if hash_bytes(raw)!=hash_bytes(expect):bad.append("sha256_mismatch")
  if not h.get(header):bad.append("scoped_piga_header_missing")
  if name in ("cancer","ados","preuve") and b"Verified Blocked Risk" not in raw:bad.append("vbr_marker_missing")
  if name=="nadia" and (b"nb-promo" not in raw or b"icon-192.png" not in raw):bad.append("nadia_pwa_or_book_missing")
  if name.endswith("icon") and "image/png" not in h.get("content-type",""):bad.append("png_mime_missing")
  if name=="cancer" and not h.get(header,"").startswith("BLOCK"):bad.append("clinical_gate2_header_missing")
  diff=next((i for i,(a,b) in enumerate(zip(raw,expect)) if a!=b), min(len(raw),len(expect)) if len(raw)!=len(expect) else -1)
  return dict(name=name,route=route,http=code,match=hash_bytes(raw)==hash_bytes(expect),header=h.get(header,""),problems=bad,**({"expectedSha":hash_bytes(expect),"actualSha":hash_bytes(raw),"expectedBytes":len(expect),"actualBytes":len(raw),"firstDiff":diff,"cfBeacon":b"cloudflareinsights" in raw,"workerScriptMutation":b"data-cf-beacon" in raw} if bad else {}))
 except Exception as exc:return dict(name=name,route=route,problems=[type(exc).__name__+":"+str(exc)[:100]])
def main():
 for attempt in range(1,6):
  with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
   results=list(pool.map(lambda x:check(x,attempt),TASKS))
  failures=[r for r in results if r["problems"]]
  print(json.dumps({"attempt":attempt,"failed":len(failures),"results":results},ensure_ascii=False),flush=True)
  if not failures:
   print("PIGA_FOUR_APP_FINAL_READBACK="+json.dumps({"status":"CANONICAL_PASS","routes":len(TASKS),"pigaOwnerVoiceUnchangedByThisWorkflow":True,"independentClinicalValidation":False}),flush=True)
   return 0
  if attempt<5:time.sleep(11)
 print("PIGA_FOUR_APP_FINAL_READBACK="+json.dumps({"status":"CANONICAL_DELAY","failed":[r["name"] for r in results if r["problems"]],"noFalseReleaseClaims":True}),flush=True)
 return 1
if __name__=="__main__":sys.exit(main())
