import {writeFileSync,mkdirSync} from "node:fs";
const sites={
 status:"https://pigapocket.com/api/piga/assistant/v1/status?app=ortho",
 landing:"https://pigapocket.com/piga-ortho-3d/",
 orthoVoice:"https://pigapocket.com/piga-ortho-3d/piga-voice.html"
};
const outcomes={schema:"piga.ortho-public-read-only-evidence.v1",recordedAt:new Date().toISOString(),tests:[],modelRequests:0,externalEffects:0};
for(const [type,url] of Object.entries(sites)){
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),9000);
 let result={type,url,admitted:false,state:"UNKNOWN",reason:"NOT_RUN"};
 try{
  const response=await fetch(url,{method:"GET",redirect:"manual",headers:{accept:type==="status"?"application/json":"text/html","user-agent":"PIGA-Ortho-ReadOnly-Canary/1.0"},signal:abort.signal});
  const text=await response.text();result={...result,httpStatus:response.status,contentType:response.headers.get("content-type"),reason:"HTTP_READBACK",state:response.ok?"REACHABLE":"NOT_READY"};
  if(type==="status"){
   let data;try{data=JSON.parse(text)}catch{data=null}
   result={...result,schemaObserved:data?.schema||null,appObserved:data?.app||null,ready:data?.ready===true,mode:data?.inferenceMode||null,
     modelWasInvoked:data?.modelRequestPerformed===true,
     admitted:response.ok&&data?.schema==="piga.shared.voice.v1"&&data?.app==="ortho"&&data?.ready===true,
     state:response.ok&&data?.schema==="piga.shared.voice.v1"?(data.ready===true?"READY_BINDING_ONLY":"NOT_READY"):"MISSING_OR_WRONG_SCHEMA"};
  }else if(type==="landing"){
   result={...result,has18LinkMarker:text.includes("funktionsstand-2026")&&text.includes("18 Links"),hasKfoTitle:text.includes("PIGA ORTHO 3D"),
     admitted:response.ok&&text.includes("funktionsstand-2026"),state:response.ok&&text.includes("funktionsstand-2026")?"CURRENT_MARKER_ON_EDGE":"OLDER_CANONICAL_RELEASE"};
  }else{
   result={...result,admitted:response.ok&&text.includes("voiceShowroomCheck"),state:response.ok&&text.includes("voiceShowroomCheck")?"VOICE_UI_ON_CANONICAL":"VOICE_UI_NOT_ON_CANONICAL"};
  }
 }catch(e){result={...result,reason:String(e?.name||"FetchError"),state:"NETWORK_UNAVAILABLE"}}
 finally{clearTimeout(timer)}
 outcomes.tests.push(result);
 console.log(JSON.stringify(result));
}
mkdirSync("release-evidence",{recursive:true});
writeFileSync("release-evidence/piga-ortho-public-readback.json",JSON.stringify(outcomes,null,2)+"\n");
console.log("READ_ONLY_DONE: no POST, no model spend, no device or clinical effects.");
