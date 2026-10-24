#!/usr/bin/env python3
"""Bounded Nadia Bloom family PWA canonical route readback; preserves independent owner voice."""
import hashlib, json, pathlib, urllib.request, urllib.error, time, sys
from concurrent.futures import ThreadPoolExecutor
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE="https://pigapocket.com"
CASES=[
("app", "/nadias-bloom/", "nadias-bloom/index.html", False),
("app_alias", "/nadias-bloom", "nadias-bloom/index.html", False),
("offline_download", "/nadias-bloom/download", "nadias-bloom/index.html", True),
("manifest", "/nadias-bloom/manifest.webmanifest", "nadias-bloom/manifest.webmanifest", False),
("service_worker", "/nadias-bloom/sw.js", "nadias-bloom/sw.js", False),
("icon", "/nadias-bloom/icon.svg", "nadias-bloom/icon.svg", False),
]
def sha(b):return hashlib.sha256(b).hexdigest()
def verify(c):
 label,route,source,download=c
 expected=(ROOT/source).read_bytes()
 try:
  req=urllib.request.Request(BASE+route,headers={"Cache-Control":"no-cache","User-Agent":"PIGA-Bloom-Release-Readback/1.1"})
  with urllib.request.urlopen(req,timeout=20) as response:
   actual=response.read();h=response.headers;status=response.status
  errors=[]
  if status!=200:errors.append("unexpected_http_status")
  if sha(actual)!=sha(expected):errors.append("sha256_mismatch")
  if label=="app" and b"v26.1-barakah-onboarding" not in actual:errors.append("missing_new_nadia_ui")
  if download and "attachment" not in h.get("content-disposition","").lower():errors.append("missing_offline_attachment")
  if label in ("app","app_alias") and "nadias-bloom" not in h.get("x-nadias-bloom",""):errors.append("missing_nadia_scoped_header")
  return {"case":label,"route":route,"status":status,"expected":sha(expected),"actual":sha(actual),"errors":errors}
 except (urllib.error.URLError,TimeoutError,OSError) as e:
  return {"case":label,"route":route,"errors":[type(e).__name__+":"+str(e)[:120]]}
def health():
 try:
  r=urllib.request.urlopen(urllib.request.Request(BASE+"/nadias-bloom/health",headers={"Cache-Control":"no-cache"}),timeout=20)
  data=json.loads(r.read());r.close()
  ok=data.get("service")=="nadias-bloom" and data.get("pigaRootVoiceModified") is False and data.get("familyModules")==12 and data.get("duas")==365
  return {"case":"health","status":200 if ok else 503,"errors":[] if ok else ["health_invariant_failed"],"familyModules":data.get("familyModules"),"duas":data.get("duas"),"rootVoiceChanged":data.get("pigaRootVoiceModified")}
 except (urllib.error.URLError,TimeoutError,OSError,ValueError) as e:return {"case":"health","errors":[type(e).__name__+":"+str(e)[:120]]}
def main():
 for attempt in range(1,7):
  with ThreadPoolExecutor(max_workers=7) as exe:
   results=list(exe.map(verify,CASES))
   results.append(health())
  missing=[a for a in results if a["errors"]]
  print(json.dumps({"attempt":attempt,"passed":len(results)-len(missing),"failed":len(missing),"results":results}),flush=True)
  if not missing:
   print("PIGA_NADIA_CANONICAL="+json.dumps({"status":"PASS","routes":len(results),"authoritative":BASE+"/nadias-bloom/","rootOwnerVoiceModified":False}),flush=True)
   return 0
  if attempt<6:time.sleep(8)
 print("PIGA_NADIA_CANONICAL="+json.dumps({"status":"BLOCK","missing":[r["case"] for r in missing]}),flush=True)
 return 1
if __name__=="__main__":sys.exit(main())
