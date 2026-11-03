import {writeFileSync,mkdirSync} from "node:fs";

// Read-only public canary: visible HTML / status != a working, purchasable clinic product.
// All probes are GET, redirect=manual, without cookies, credentials, payment or inference.
const base="https://pigapocket.com/piga-ortho-3d/";
const sites={
 status:"https://pigapocket.com/api/piga/assistant/v1/status?app=ortho",
 landing:base,
 orthoVoice:base+"piga-voice.html",
 license:base+"license.html",
 clinicHub:base+"clinic-hub.html",
 install:base+"install.html",
 auth:base+"auth.html"
};
const signatures={
 license:/PIGA\s*ORTHO\s*3D/i,
 clinicHub:/Meine Praxiszentrale|clinicChooser/i,
 install:/PIGA\s*ORTHO\s*3D|Installation/i,
 auth:/PIGA\s*ORTHO\s*3D|Anmeldung|auth/i
};
const outcomes={
 schema:"piga.ortho-public-read-only-evidence.v2",
 recordedAt:new Date().toISOString(),
 tests:[],marketRelease:"HOLD",marketReleaseReason:"No client payment, licensing, tenant, medical, device or authenticated E2E tests performed",
 modelRequests:0,paymentRequests:0,externalEffects:0
};
for(const [type,url] of Object.entries(sites)){
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),9000);
 let result={type,url,admitted:false,state:"UNKNOWN",reason:"NOT_RUN"};
 try{
  const response=await fetch(url,{method:"GET",redirect:"manual",headers:{accept:type==="status"?"application/json":"text/html","user-agent":"PIGA-Ortho-ReadOnly-Canary/2.0"},signal:abort.signal});
  const body=await response.text(),isHtml=(response.headers.get("content-type")||"").includes("text/html");
  result={...result,httpStatus:response.status,contentType:response.headers.get("content-type"),reason:"HTTP_READBACK",state:response.ok?"REACHABLE_UNVERIFIED":"NOT_READY"};
  if(type==="status"){
   let data;try{data=JSON.parse(body)}catch{data=null}
   result={...result,schemaObserved:data?.schema||null,appObserved:data?.app||null,ready:data?.ready===true,mode:data?.inferenceMode||null,
    modelWasInvoked:data?.modelRequestPerformed===true,
    admitted:response.ok&&data?.schema==="piga.shared.voice.v1"&&data?.app==="ortho"&&data?.ready===true,
    state:response.ok&&data?.schema==="piga.shared.voice.v1"?(data.ready===true?"READY_BINDING_ONLY":"NOT_READY"):"MISSING_OR_WRONG_SCHEMA"};
  }else if(type==="landing"){
   result={...result,has18LinkMarker:body.includes("funktionsstand-2026")&&body.includes("18 Links"),hasKfoTitle:body.includes("PIGA ORTHO 3D"),
    admitted:false,state:response.ok&&isHtml&&body.includes("PIGA ORTHO 3D")?"PUBLIC_LANDING_ONLY":"MISSING_OR_WRONG_LANDING"};
  }else if(type==="orthoVoice"){
   result={...result,admitted:false,state:response.status>=300&&response.status<400?"REDIRECT_ONLY_NOT_VOICE_PROOF":response.ok&&isHtml&&body.includes("voiceShowroomCheck")?"VOICE_UI_ONLY":"VOICE_UI_NOT_ON_CANONICAL"};
  }else{
   const recognized=isHtml&&signatures[type].test(body);
   result={...result,recognizedUi:recognized,admitted:false,
    state:response.status===401||response.status===403?"AUTH_GATE_PRESENT_UNVERIFIED":
      response.status===404?"MISSING_ROUTE":
      response.status>=300&&response.status<400?"REDIRECT_UNVERIFIED":
      response.ok&&recognized?"PUBLIC_HTML_UNVERIFIED":
      response.ok?"FALLBACK_OR_UNKNOWN_HTML":"UNAVAILABLE"};
  }
 }catch(e){result={...result,reason:String(e?.name||"FetchError"),state:"NETWORK_UNAVAILABLE"}}
 finally{clearTimeout(timer)}
 outcomes.tests.push(result);
 console.log(JSON.stringify(result));
}
outcomes.blockingRoutes=outcomes.tests.filter(x=>["license","clinicHub","install"].includes(x.type)&&x.state!=="AUTH_GATE_PRESENT_UNVERIFIED"&&x.state!=="PUBLIC_HTML_UNVERIFIED").map(x=>({type:x.type,state:x.state,httpStatus:x.httpStatus??null}));
outcomes.voiceStatus=outcomes.tests.find(x=>x.type==="status")?.state||"UNKNOWN";
mkdirSync("release-evidence",{recursive:true});
writeFileSync("release-evidence/piga-ortho-public-readback.json",JSON.stringify(outcomes,null,2)+"\n");
console.log("MARKET_RELEASE=HOLD; public reachability, including auth-gated HTML, never proves payment, tenant, clinical or device readiness.");
console.log("READ_ONLY_DONE: GET only; no POST, login, inference, checkout, device or patient effects.");
