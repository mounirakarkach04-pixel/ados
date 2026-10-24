#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const file=fs.readFileSync("nadias-bloom/index.html");
const sum=x=>crypto.createHash("sha256").update(x).digest("hex");
const sha=sum(file),routes=[
["book_home","https://pigapocket.com/nadias-bloom"],
["book_index","https://pigapocket.com/nadias-bloom/index.html"],
["offline_download","https://pigapocket.com/nadias-bloom/download"],
["pages_backup","https://mounirakarkach04-pixel.github.io/ados/nadias-bloom/"],
["privacy","https://pigapocket.com/datenschutz"],
["imprint","https://pigapocket.com/impressum"],
["happy_api_health","https://qjvopzschqukitvudgfz.supabase.co/functions/v1/happy-live-token/health"],
["piga_root","https://pigapocket.com/"]];
async function get(name,url){const response=await fetch(url,{redirect:"follow",signal:AbortSignal.timeout(14000),headers:{"accept":"text/html,application/json;q=0.9"}});const content=Buffer.from(await response.arrayBuffer());return{name,url,status:response.status,sha256:sum(content),content,headers:response.headers}};
(async()=>{const results=[];for(const [name,url] of routes){
 try{const r=await get(name,url),txt=r.content.toString("utf8"),note={name,status:r.status,sha:r.sha256,match:undefined,details:""};
 if(["book_home","book_index","offline_download","pages_backup"].includes(name)){note.match=r.sha256===sha;note.details="v26="+txt.includes('nadias-bloom-barakah-v26')+"; book="+txt.includes('BARAKAH HOME 2027')+"; happy="+txt.includes('happy-live-token');if(name!=="pages_backup")note.header=r.headers.get("x-nadias-bloom");if(name==="offline_download")note.attachment=r.headers.get("content-disposition")?.includes("attachment")||false;}
 if(name==="happy_api_health"){const x=JSON.parse(txt);note.details="configured="+Boolean(x.keyConfigured)+"; spec="+String(x.version||"").slice(0,70);note.configured=Boolean(x.keyConfigured);note.keyReturned=Boolean(x.key||x.token);}
 if(name==="piga_root")note.details="independent website route; Nadia application not served="+(!txt.includes("nadias-bloom-barakah-v26"));
 results.push(note);
 }catch(e){results.push({name,error:String(e)})}
}
const failures=results.filter(x=>x.error||x.status!==200||(["book_home","book_index","offline_download","pages_backup"].includes(x.name)&&(!x.match||(x.name!=="pages_backup"&&x.header!=="v26-barakah-home")||(x.name==="offline_download"&&!x.attachment)))||(x.name==="happy_api_health"&&!x.configured||x.keyReturned));
console.log(JSON.stringify({status:failures.length?"CANONICAL_DELAY":"CANONICAL_PASS",scope:"Nadia only; PIGA root unchanged by code",htmlSourceSha256:sha,failed:failures.map(x=>x.name),results},null,2));if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
