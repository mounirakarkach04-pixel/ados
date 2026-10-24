#!/usr/bin/env python3
import pathlib,urllib.request,hashlib,json
root=pathlib.Path(__file__).resolve().parents[1]
cases=[
 ("book","cancer-system-state/book.html","/cancer-system-state/book"),
 ("reader","cancer-system-state/index.html","/cancer-system-state/"),
 ("lab","cancer/index.html","/cancer-system-state/systems-lab")]
for label,file,route in cases:
 e=(root/file).read_bytes()
 with urllib.request.urlopen(urllib.request.Request("https://pigapocket.com"+route+"?piga_diag=20261024",headers={"Cache-Control":"no-cache","Pragma":"no-cache","User-Agent":"PIGA-Cancer-Canonical-Bounded-Readback/1.0"}),timeout=25) as r:
  a=r.read()
  h=dict(r.headers.items())
 n=0
 while n<min(len(e),len(a)) and e[n]==a[n]:n+=1
 ep=e[max(0,n-90):n+200].decode("utf8","replace")
 ap=a[max(0,n-90):n+200].decode("utf8","replace")
 markers={
   "new_book_portal":b"Two complementary applications" in a,
   "new_crosslink":b"Book & research-app portal" in a,
   "standalone_download":b"download-app" in a if label=="lab" else b"download-offline" in a if label=="reader" else True,
   "clinical_BLOCK":b"BLOCK" in a,
 }
 print(json.dumps(dict(label=label,path=route,expected_bytes=len(e),observed_bytes=len(a),
 expected_sha=hashlib.sha256(e).hexdigest(),observed_sha=hashlib.sha256(a).hexdigest(),
 same_bytes=e==a,first_difference_at=n,expected_context=ep,observed_context=ap,
 markers=markers,cache_control=h.get("cache-control"),cf_ray=h.get("cf-ray"),
 etag=h.get("etag"),content_encoding=h.get("content-encoding")),ensure_ascii=False,indent=2),flush=True)
