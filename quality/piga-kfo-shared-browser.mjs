import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync,writeFileSync} from "node:fs";
mkdirSync("qa-artifacts/kfo-shared",{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CI?{channel:'chrome'}:{})});
const page=await browser.newPage({viewport:{width:393,height:852}});
let questions=[],statusChecks=0,replyMode="good",jsErrors=[];
page.on("pageerror",e=>jsErrors.push(e.message));
await page.route(/https:\/\/pigapocket\.com\/api\/piga\/assistant\/v1\/(?:ask|status)(?:\?.*)?$/,async route=>{
 const url=route.request().url();
 if(url.includes("/status")){statusChecks++;return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({schema:"piga.shared.voice.v1",ready:true,app:"kfo-shop"})})}
 const request=route.request();
 const body=JSON.parse(request.postData()||"{}");
 questions.push(body);
 if(replyMode==="failure")return route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({status:"DELAY",reason:"model_unavailable",gate2:"BLOCK",externalEffects:0})});
 if(replyMode==="not-admitted")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({status:"ANSWER",answer:"DO NOT TRUST",gate2:"ALLOW",externalEffects:1})});
 return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({status:"ANSWER",answer:"Prüfe die validierte Materialkompatibilität. <script>window.leak=true</script>",gate2:"BLOCK",externalEffects:0,sources:[{title:"Herstellerdatenblatt",url:"https://example.org/datasheet"},{title:"XSS",url:"javascript:alert(1)"}]})});
});
try {
 await page.goto("http://127.0.0.1:4173/piga-ortho-3d/supply.html",{waitUntil:"domcontentloaded",timeout:35000});
 await page.locator("#kfoAdvisorForm").waitFor({state:"visible"});
 assert.equal(questions.length,0,"Never send a model request on page load");
 assert.equal(statusChecks,0,"No stealth status probe on load");
 await page.locator("#kfoAdvisorCheck").click();
 await page.locator("#kfoAdvisorStatus").getByText(/PIGA Zentrale freigegeben/).waitFor();
 assert.equal(statusChecks,1);
 assert.equal(questions.length,0,"Status check must not consume a model call");
 const question="Welche Kriterien sind bei KFO 3D-Druckharz wichtig?";
 await page.locator("#kfoAdvisorQuestion").fill(question);
 await page.locator("#kfoAdvisorSend").click();
 await page.locator("#kfoAdvisorAnswer").getByText(/validierte Materialkompatibilität/).waitFor();
 assert.equal(questions.length,1);
 assert.deepEqual(questions[0],{app:"kfo-shop",message:question,consent:true});
 assert.equal(await page.locator("#kfoAdvisorSpeak").isEnabled(),true);
 assert.equal(await page.evaluate(()=>window.leak),undefined,"Generated model HTML must never execute");
 assert.equal(await page.locator("#kfoAdvisorAnswer a[href^='javascript:']").count(),0,"Unsafe model links must not be clickable");
 assert.equal(await page.locator("#kfoAdvisorAnswer a[href^='https:']").count(),1);
 for(const width of [320,360,393,412,740,820]){
  await page.setViewportSize({width,height:820});
  const geometry=await page.evaluate(()=>{
   const panel=document.querySelector("#kfoAdvisorForm").getBoundingClientRect();
   const input=document.querySelector("#kfoAdvisorQuestion").getBoundingClientRect();
   const answer=document.querySelector("#kfoAdvisorAnswer").getBoundingClientRect();
   return {windowWidth:window.innerWidth,documentScroll:document.documentElement.scrollWidth,formWidth:panel.width,formLeft:panel.left,
     questionWidth:input.width,questionRight:input.right,answerWidth:answer.width,answerRight:answer.right};
  });
  assert.ok(geometry.formWidth>=Math.min(width*.70,500),"Form collapsed "+JSON.stringify(geometry));
  assert.ok(geometry.questionWidth>=Math.min(width*.6,460),"Question squashed "+JSON.stringify(geometry));
  assert.ok(geometry.questionRight<=width+5,"Input extends beyond viewport "+JSON.stringify(geometry));
  assert.ok(geometry.answerRight<=width+5,"Answer beyond viewport "+JSON.stringify(geometry));
  if([320,393,820].includes(width))await page.locator(".kfo-advisor-panel").screenshot({path:"qa-artifacts/kfo-shared/kfo-"+width+".png"});
 }
 await page.setViewportSize({width:393,height:852});
 replyMode="not-admitted";
 await page.locator("#kfoAdvisorSend").click();
 await page.locator("#kfoAdvisorAnswer").getByText(/bestätigte Modellantwort/).waitFor();
 assert.equal(await page.locator("#kfoAdvisorSpeak").isDisabled(),true,"Gate 2 violation must suppress TTS");
 replyMode="failure";
 await page.locator("#kfoAdvisorSend").click();
 await page.locator("#kfoAdvisorStatus").getByText(/model_unavailable/).waitFor();
 assert.equal(await page.locator("#kfoAdvisorSpeak").isDisabled(),true);
 await page.locator("#kfoAdvisorQuestion").fill("patientenakte vom letzten Termin");
 await page.locator("#kfoAdvisorSend").click();
 await page.locator("#kfoAdvisorStatus").getByText(/keine personenbezogenen/).waitFor();
 assert.equal(questions.length,3,"Public PII must not reach model backend");
 assert.deepEqual(jsErrors,[],"Unhandled JS runtime errors");
 writeFileSync("qa-artifacts/kfo-shared/result.json",JSON.stringify({status:"PASS",scopedTests:11,screenWidths:[320,360,393,412,740,820],noAutomaticModelCall:true,
   gate2NeverAutoEffect:true,credentialsNeverSent:true,patientDataBlocked:true,liveProviderCalled:false},null,2));
 console.log("PASS PIGA KFO shared advisor Chromium E2E: opt-in, gate2, PII, XSS, source filtering, responsive viewport");
} finally {await browser.close()}
