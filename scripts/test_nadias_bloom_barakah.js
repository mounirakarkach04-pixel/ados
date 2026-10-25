#!/usr/bin/env node
"use strict";
const {chromium}=require("playwright"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const src=path.resolve("nadias-bloom/index.html"),html=fs.readFileSync(src,"utf8");
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);assert(scripts.length>=1,"single-file offline scripts expected");scripts.forEach((s,i)=>new vm.Script(s,{filename:"nadia-inline-"+i+".js"}));
assert(!/service_role|OPENAI_API_KEY|piga-owner-voice-router/.test(html));
(async()=>{const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});let checks=0;const results=[];
try{for(const [name,viewport] of [["desktop",{width:1440,height:900}],["mobile",{width:390,height:844}]]){
 const cx=await browser.newContext({viewport}),p=await cx.newPage(),errs=[];
 p.on("pageerror",e=>errs.push(e.message));p.on("dialog",d=>d.accept());await p.route("**/*",r=>r.request().url().startsWith("file:")?r.continue():r.abort());
 await p.goto("file://"+src,{waitUntil:"load"});
 function check(v,label){assert(v,name+": "+label);checks++}
 check((await p.title()).includes("Nadia’s Bloom"),"title");check(await p.evaluate(()=>window.NADIAS_BLOOM_QA?.duaCount===365),"365 book duas");
 check(await p.evaluate(()=>window.NADIAS_BLOOM_QA?.gate2==="CONFIRM_REQUIRED"),"confirmed action gate");
 check(await p.locator(".side-btn[data-view]").count()===12,"12 active areas");check(await p.locator("#mobileModules [data-view]").count()===12,"all 12 mobile-accessible modules");check(await p.locator(".nb-promo a[href*='amazon.de']").count()===1,"Amazon title search link");check(await p.locator(".nb-excerpts blockquote").count()===2,"only preview excerpts");check(await p.locator("#view-buch a[href*='drive.google.com']").count()===0,"full KDP PDF no longer exposed");
 check((await p.locator("#homeDua").innerText()).length>30,"book dua shown");
 check((await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth))<=2,"responsive");
 async function nav(id){if(name==="mobile"){await p.locator('.mobilebar [data-view="buch"]').click();await p.locator('#mobileModules [data-view="'+id+'"]').click()}else{await p.locator('.side-btn[data-view="'+id+'"]').click()}check(await p.locator("#view-"+id+".active").count()===1,id+" opens")}
 await nav("aufgaben");await p.locator('#taskForm [name=title]').fill("Testaufgabe");await p.locator("#taskForm button").click();check((await p.locator("#taskList").innerText()).includes("Testaufgabe"),"task add");
 await p.locator("#taskList [data-toggle]").first().click();check(await p.locator("#taskList .done").count()===1,"task toggle");
 await nav("einkauf");await p.locator('#shopForm [name=title]').fill("Brot");await p.locator("#shopForm button").click();check((await p.locator("#shopList").innerText()).includes("Brot"),"shopping");
 await nav("kalender");await p.locator('#eventForm [name=title]').fill("Familienausflug");await p.locator('#eventForm [name=date]').fill("2027-01-04");await p.locator("#eventForm button").click();check((await p.locator("#eventList").innerText()).includes("Familienausflug"),"calendar");
 await nav("kinder");await p.locator('#memberForm [name=name]').fill("Testkind");await p.locator("#memberForm button").click();check((await p.locator("#memberList").innerText()).includes("Testkind"),"family");
 await nav("essen");await p.locator('#mealForm [name=title]').fill("Gemüsesuppe");await p.locator("#mealForm button").click();check((await p.locator("#mealList").innerText()).includes("Gemüsesuppe"),"meals");
 await nav("geld");await p.locator('#moneyForm [name=amount]').fill("12.50");await p.locator('#moneyForm [name=title]').fill("Markt");await p.locator("#moneyForm button").click();check((await p.locator("#moneyList").innerText()).includes("Markt"),"budget");
 await nav("iman");await p.locator("#duaDate").fill("2027-08-14");check((await p.locator("#duaText").innerText()).includes("Familie"),"missing book date now covered");check((await p.locator("#duaKind").innerText()).includes("Persönliche"),"attribution");
 await nav("haushalt");check(await p.locator("[data-chore]").count()===14,"book household");
 await p.locator("[data-chore]").first().check();check(await p.locator("[data-chore]").first().isChecked(),"chores");
 await nav("journal");await p.locator('#journalForm [name=text]').fill("Ein guter Tag");await p.locator("#journalForm button").click();check((await p.locator("#journalList").innerText()).includes("Ein guter Tag"),"journal");
 check(await p.locator('#view-happy').count()===0,'Happy withdrawn pending verified voice');
 await p.reload();check((await p.locator("#statShop").innerText())==="1","local persistence");
 await nav("buch");check(await p.locator("#backup").count()===1&&await p.locator("#restore").count()===1,"backup/restore");check(await p.locator("#downloadOffline").count()===1,"offline download");
 check(errs.length===0,"no pageerrors "+errs.join("; "));check((await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth))<=2,"no final overflow");
 results.push({viewport:name,checks,errors:errs});await cx.close();
}}finally{await browser.close()}
console.log(JSON.stringify({status:"PASS_NADIA_BARAKAH",checks,duas:365,rootPigaVoice:"UNCHANGED_BY_DESIGN",happy:"WITHDRAWN_UNVERIFIED",results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
