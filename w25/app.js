"use strict";
const $=id=>document.getElementById(id),state=$("state"),log=$("log"),btn=$("send"),stopBtn=$("stop"),enc=new TextEncoder();
const qs=new URL(location.href).searchParams;
const link=qs.get("link")||localStorage.getItem("pigaW25Link")||"";
let token=qs.get("token"),keyPair=null,lastSent=0,halted=false,busy=false;
const allowedId=x=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x||"");
const base64url=x=>btoa(String.fromCharCode(...new Uint8Array(x))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const display=x=>{state.textContent=x};
const logline=x=>{log.textContent=new Date().toLocaleString("de-DE")+"\n"+x};
async function http(path,payload){
 const res=await fetch("https://sanrkcovmkkhgdqydxfk.supabase.co/functions/v1/piga-w25-browser-agent-v1/"+path,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload),cache:"no-store",credentials:"omit",referrerPolicy:"no-referrer"});
 const body=await res.json();
 if(!res.ok)throw Error(body.reason||body.status||("HTTP "+res.status));
 return body;
}
async function readKey(){
 const db=await new Promise((yes,no)=>{const r=indexedDB.open("piga-w25-browser-agent-v1",1);r.onupgradeneeded=()=>r.result.createObjectStore("keys");r.onsuccess=()=>yes(r.result);r.onerror=()=>no(r.error)});
 const existing=await new Promise((yes,no)=>{const r=db.transaction("keys","readonly").objectStore("keys").get(link);r.onsuccess=()=>yes(r.result);r.onerror=()=>no(r.error)});
 if(existing)return existing;
 const kp=await crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},false,["sign","verify"]);
 await new Promise((yes,no)=>{const tx=db.transaction("keys","readwrite");tx.objectStore("keys").put(kp,link);tx.oncomplete=()=>yes();tx.onerror=()=>no(tx.error)});
 return kp;
}
async function sign(message){return base64url(await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},keyPair.privateKey,enc.encode(message)))}
async function send(){
 if(halted||busy||document.hidden||!keyPair)return;
 if(Date.now()-lastSent<15000)return;
 busy=true;btn.disabled=true;
 try{
 const now=Math.floor(Date.now()/1000);
 const text="PIGA W25 meldet sich eigenständig aus der sichtbaren Samsung-Browsersitzung. Zeit: "+new Date().toISOString()+"; Sprache: "+navigator.language+"; Online: "+navigator.onLine+"; Quelle: Browser-Agent, nicht Besitzer. Keine externe Wirkung angefordert.";
 const report={schema:"piga.w25.browser-agent.v1",principal:"piga_browser_non_owner",origin:"piga_phone_browser",link_id:link,message_id:crypto.randomUUID(),nonce:base64url(crypto.getRandomValues(new Uint8Array(24))),observed_at:now,expires_at:now+170,text,gate1:"SOURCE",gate2:"BLOCK",external_effect:false};
 const response=await http("message",{report,signature:await sign(JSON.stringify(report))});
 if(response.status!=="RECEIVED_DURABLE"||response.messageId!==report.message_id)throw Error("ACK nicht korreliert");
 lastSent=Date.now();
 logline("RECEIVED_DURABLE\nMessage-ID: "+response.messageId+"\nSHA256: "+response.payloadSha256+"\nHerkunft: piga_browser_non_owner\nNächster Schritt: ChatGPT-Aufgabe muss quittieren.");
 display("Nachricht signiert und im Backend bestätigt – ChatGPT-Antwort noch ungeprüft.");
 }catch(e){display("DELAY/BLOCK · "+e.message)}finally{busy=false;btn.disabled=halted}
}
async function init(){
 try{
 if(!allowedId(link))throw Error("Keine gültige W25-Kopplungs-ID. Öffne den von deiner Android-Bridge bestätigten Link.");
 keyPair=await readKey();
 if(token){
  if(!/^[0-9a-f]{64}$/.test(token))throw Error("Ungültiger Einmal-Link");
  const pub=base64url(await crypto.subtle.exportKey("spki",keyPair.publicKey));
  const proof=await sign(["PIGA_W25_BROWSER_ENROLL_V1",link,pub,token].join("\n"));
  const result=await http("enroll",{link_id:link,token,public_key:pub,proof});
  if(result.status!=="ENROLLED")throw Error("Kopplungsbestätigung fehlt");
  localStorage.setItem("pigaW25Link",link);
  history.replaceState(null,"","./");
  token=null;
 }else if(localStorage.getItem("pigaW25Link")!==link){
  throw Error("Erste Kopplung nur über signierten Android-Start möglich");
 }
 display("P-256-Browserschlüssel vorhanden. Nachricht kann gesendet werden.");
 btn.disabled=false;stopBtn.disabled=false;
 btn.addEventListener("click",()=>send());
 stopBtn.addEventListener("click",()=>{halted=true;btn.disabled=true;stopBtn.disabled=true;localStorage.removeItem("pigaW25Link");display("Agent angehalten. Neue Nachrichten gesperrt.");});
 await send();
 setInterval(()=>{if(!document.hidden&&Date.now()-lastSent>=900000)send()},60000);
 }catch(e){display("BLOCK/DELAY · "+e.message);logline("Kein gesicherter Versand erfolgt.")}
}
init();