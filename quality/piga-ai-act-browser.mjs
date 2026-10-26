import {chromium} from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
fs.mkdirSync("qa-artifacts",{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1365,height:850},acceptDownloads:true});
const failures=[];
page.on("pageerror",e=>failures.push("PAGEERROR: "+e.message));
page.on("console",m=>{if(m.type()==="error")failures.push("CONSOLE: "+m.text());});
page.on("requestfailed",r=>{if(r.url().includes("esm.sh"))failures.push("ESM REQUEST: "+r.url()+" "+r.failure()?.errorText);});
try{
 await page.goto("http://127.0.0.1:4173/ai-act-intelligence/",{waitUntil:"domcontentloaded",timeout:45000});
 await page.locator("#view-home .hero h1").waitFor({state:"visible",timeout:30000});
 await page.waitForURL(/#home$/, {timeout:25000}).catch(()=>{throw new Error("App module not initialised: "+failures.join(" | "));});
 // Verified welcome onboarding: three roles, accessible selection and correct form prefill.
 assert.equal(await page.locator("[data-audience]").count(),3);
 await page.locator('[data-audience="both"]').click();
 assert.equal(await page.locator("#f-role").inputValue(),"both");
 assert.equal(await page.locator('[data-audience="both"]').getAttribute("aria-pressed"),"true");
 await page.locator('[data-audience="provider"]').click();
 assert.equal(await page.locator("#f-role").inputValue(),"provider");
 assert.equal(await page.locator('[data-audience="both"]').getAttribute("aria-pressed"),"false");
 assert.match(await page.locator("#audience-context").innerText(),/Anbieterpflichten/);
 // Cross-app PIGA: the public evaluation never silently submits anything.
 // Stub the backend so an E2E run cannot incur AI cost or transmit private text.
 let assistantCalls=0;
 await page.route("https://pigapocket.com/api/piga/assistant/**",async route=>{
  assistantCalls++;
  if(route.request().url().includes("/status"))return route.fulfill({
   status:200,contentType:"application/json",body:JSON.stringify({schema:"piga.shared.voice.v1",app:"ai-act",ready:false})
  });
  return route.fulfill({status:200,contentType:"application/json",
   body:JSON.stringify({status:"ANSWER",gate2:"BLOCK",externalEffects:0,
    answer:"Artikel 14: Aufsicht dokumentieren und evidenzbasiert prüfen.",sources:[{title:"EU AI Act",url:"https://eur-lex.europa.eu/"}]})});
 });
 assert.equal(assistantCalls,0,"Unsolicited PIGA model call before user click");
 assert.equal(await page.locator("#aiact-piga-read").isDisabled(),true);
 await page.locator("#aiact-piga-check").click();
 await page.waitForFunction(()=>document.querySelector("#aiact-piga-status")?.textContent?.includes("nicht freigegeben"),null,{timeout:8000});
 assert.match(await page.locator("#aiact-piga-status").innerText(),/nicht freigegeben/i);
 await page.locator("#aiact-piga-question").fill("Welche Nachweise empfiehlt PIGA für Artikel 14?");
 await page.locator("#aiact-piga-send").click();
 await page.waitForFunction(()=>document.querySelector("#aiact-piga-answer")?.textContent?.includes("Artikel 14: Aufsicht dokumentieren"));
 assert.equal(await page.locator("#aiact-piga-read").isEnabled(),true);
 assert.equal(assistantCalls,2,"Only explicit status + explicit answer call");
 assert.match(await page.locator("#aiact-piga-answer").innerText(),/EU AI Act/);

 assert.equal(await page.locator(".piga-bridge-principles > div").count(),4);
 assert.match(await page.locator("#piga-law-heading").innerText(),/Technische Entscheidung/);
 await page.screenshot({path:"qa-artifacts/01-dashboard.png",fullPage:true});
 // Editorial polish: the headline must not overlap the visual preview at enterprise desktop widths.
 const heroCheck=await page.evaluate(()=>{
  const title=document.querySelector("#view-home .hero h1").getBoundingClientRect();
  const preview=document.querySelector("#view-home .hero .preview-surface").getBoundingClientRect();
  return {titleRight:title.right,previewLeft:preview.left,intersects:title.right>preview.left&&title.top<preview.bottom&&title.bottom>preview.top};
 });
 assert.equal(heroCheck.intersects,false,"hero title overlaps interactive product preview: "+JSON.stringify(heroCheck));
 await page.locator("#sample-analysis").click();
 await page.locator("#view-results").waitFor({state:"visible"});
 assert.match(await page.locator("#report-ref").innerText(),/MUSTERBERICHT/);
 await page.waitForFunction(()=>document.querySelector("#result-guide-cta")?.dataset.go==="assessment");
 assert.match(await page.locator("#result-guide-heading").innerText(),/Muster/);
 assert.equal(await page.locator("#result-guide-cta").getAttribute("data-go"),"assessment");
 assert.match(await page.locator("#recommended-buy").innerText(),/Eigene Analyse starten/);
 assert.equal(await page.locator("#report-legal-map .legal-map-card").count(),4);
 await page.locator("#report-legal-map [data-bridge-sku]").first().click();
 await page.locator("#view-assessment").waitFor({state:"visible"});
 assert.equal(await page.locator("#order-review").isVisible(),false);
 await page.locator("#nav > [data-view='results']").click();
 // Public example is informative only: every sample-case CTA must lead to own assessment.
 await page.locator("#ladder .ladder-item").first().locator("summary").click();
 await page.locator("#ladder .ladder-item").first().locator("[data-ladder-offer]").click();
 await page.locator("#view-assessment").waitFor({state:"visible"});
 await page.locator("#nav > [data-view='results']").click();
 await page.locator("#view-results [data-go='solutions']").first().click();
 await page.locator("#view-solutions").waitFor({state:"visible"});
 assert.match(await page.locator("#solutions-intro").innerText(),/Musterfalls/);
 assert.match(await page.locator("#solutions-offers [data-solution]").first().innerText(),/Eigene Analyse starten/);
 await page.locator("#solutions-offers [data-solution]").first().click();
 await page.locator("#view-assessment").waitFor({state:"visible"});
 await page.locator("#nav > [data-view='results']").click();
 await page.locator("#recommended-buy").click();
 await page.locator("#view-assessment").waitFor({state:"visible"});
 assert.equal(await page.locator("#order-review").isVisible(),false);
 await page.locator("#nav > [data-view='home']").click();
 await page.locator("#view-home .hero [data-go='assessment']").click();
 await page.locator("#view-assessment").waitFor({state:"visible",timeout:10000});
 await page.fill("#f-title","Recruiting Engine 1.0");
 await page.fill("#f-version","v1.0");
 await page.selectOption("#f-role","provider");
 await page.fill("#f-purpose","AI ranks applicants for employment decisions");
 await page.locator("#wizard-next").click();
 await page.selectOption("#f-sector","employment");
 await page.locator("#wizard-next").click();
 assert.equal(await page.locator("[data-assessment-step='3']").isVisible(),true);
 await page.locator("#wizard-next").click();
 assert.equal(await page.locator("#analyze").isVisible(),true);
 await page.locator("#analyze").click();
 await page.locator("#result-content").waitFor({state:"visible",timeout:30000});
 const gate1=await page.locator("#gate1").innerText();
 const gate2=await page.locator("#gate2").innerText();
 assert.equal(gate1,"DELAY");assert.equal(gate2,"BLOCK");
 await page.waitForFunction(()=>document.querySelector("#result-guide-heading")?.textContent.includes("Voraussetzungen"));
 assert.equal(await page.locator("#result-guide-cta").getAttribute("data-go"),"solutions");
 assert.match(await page.locator("#result-guide-note").innerText(),/optional/);
 assert.match(await page.locator("#findings").innerText(),/Art\. 9/);
 assert.equal(await page.locator("#report-legal-map .legal-map-card").count(),4);
 assert.equal(await page.locator("#report-legal-map .legal-map-footer a").count(),5);
 assert.match(await page.locator("#report-legal-map").innerText(),/Nachweis nicht vorgelegt/);
 assert.match(await page.locator("#report-legal-map").innerText(),/Menschliche Aufsicht|Veto-Rechte/);
 assert.equal(await page.locator("#report-legal-map .legal-map-state").first().innerText(),"Zulässigkeit noch zu prüfen");
 assert.equal(await page.locator("#architecture-details").getAttribute("open"),null);
 await page.locator("#architecture-details > summary").click();
 await page.locator("#architecture .portfolio-entry").first().waitFor({state:"visible",timeout:10000});
 assert.match(await page.locator("#architecture").innerText(),/Gate|PIGA|A7SEM/);
 await page.locator("#architecture-details > summary").click();
 // Regression from actual Android screenshots: Executive Determination became a
 // one-character-wide left grid column because design-v3's 290px desktop
 // minimum overrode the earlier mobile one-column rule.
 // Assert real computed geometries at representative Android/Tablet widths.
 const layouts=[];
 for(const width of [320,360,375,393,412,480,740,820]){
  await page.setViewportSize({width,height:800});
  const layout=await page.evaluate(()=>{
   const overview=document.querySelector("#view-results .report-overview");
   const verdict=document.querySelector("#view-results .report-verdict");
   const evidence=document.querySelector("#view-results .report-evidence");
   const grid=overview.getBoundingClientRect(),left=verdict.getBoundingClientRect(),right=evidence.getBoundingClientRect();
   const viewport=document.documentElement.clientWidth;
   const columns=getComputedStyle(overview).gridTemplateColumns;
   return {viewport,scrollExcess:document.documentElement.scrollWidth-viewport,
     gridWidth:grid.width,leftWidth:left.width,rightWidth:right.width,
     leftX:left.x,rightX:right.x,leftY:left.y,rightY:right.y,columns,
     headingText:verdict.querySelector("h2")?.textContent?.trim()||"",
     leftScrollWidth:verdict.scrollWidth,leftClientWidth:verdict.clientWidth};
  });
  assert.ok(layout.gridWidth>=Math.min(width*.73,440),"report grid unexpectedly narrow at "+width+": "+JSON.stringify(layout));
  assert.ok(layout.leftWidth>=Math.min(220,width*.65),"Executive Determination collapsed at "+width+": "+JSON.stringify(layout));
  assert.ok(layout.rightWidth>=Math.min(220,width*.65),"Evidence Snapshot collapsed at "+width+": "+JSON.stringify(layout));
  assert.ok(layout.rightY>=layout.leftY+20,"Report cards must stack on "+width+"px: "+JSON.stringify(layout));
  assert.ok(layout.scrollExcess<=3,"Horizontal overflow at "+width+"px: "+JSON.stringify(layout));
  assert.ok(layout.leftScrollWidth<=layout.leftClientWidth+3,"Clipped executive finding at "+width+"px: "+JSON.stringify(layout));
  assert.ok(layout.headingText.length>4);
  layouts.push({width,...layout});
  if([320,360,393].includes(width)){
   await page.screenshot({path:"qa-artifacts/02-report-mobile-"+width+".png",fullPage:true});
  }
 }
 fs.writeFileSync("qa-artifacts/02-report-responsive-layout.json",JSON.stringify(layouts,null,2));
 await page.setViewportSize({width:1365,height:850});
 await page.screenshot({path:"qa-artifacts/02-report.png",fullPage:true});
 // The A4 print contains all eight Admission Ladder rows, not only the initially expanded two.
 const pdf=await page.pdf({path:"qa-artifacts/02-executive-report.pdf",format:"A4",printBackground:true,preferCSSPageSize:true});
 assert.ok(pdf.byteLength>12000,"Report PDF unexpectedly empty or too small");
 await page.emulateMedia({media:"print"});
 const printedGates=await page.evaluate(()=>{
  const cards=[...document.querySelectorAll(".report-gates>div")];
  const root=document.querySelector(".report-cover-grid").getBoundingClientRect();
  return cards.map(card=>{
   const text=card.querySelector("b");
   const r=text.getBoundingClientRect();
   return {value:text.textContent.trim(),withinPage:r.right<=root.right+3,notClipped:text.scrollWidth<=text.clientWidth+2};
  });
 });
 assert.deepEqual(printedGates.map(x=>x.value),["DELAY","BLOCK"]);
 assert.ok(printedGates.every(x=>x.withinPage&&x.notClipped),"A4 Gate-card clipping: "+JSON.stringify(printedGates));
 assert.match(await page.locator("#appendix-context").innerText(),/Artikelkennungen/);
 assert.match(await page.locator("#appendix-open").innerText(),/gesonderte Einzelfallprüfung/);
 assert.match(await page.locator("#appendix-evidence").innerText(),/Keine Dokumente übermittelt/);
 await page.emulateMedia({media:"screen"});
 // Genuine buyer journey: result -> tailored solution -> transparent order -> informed consent -> account.
 await page.locator("#view-results [data-go='solutions']").first().click();
 await page.locator("#view-solutions").waitFor({state:"visible"});
 assert.equal(await page.locator("#solutions-plan .solution-step").count(),8);
 assert.ok(await page.locator("#solutions-offers [data-solution]").count()>=3);
 await page.screenshot({path:"qa-artifacts/03-solutions-roadmap.png",fullPage:true});
 await page.locator("#solutions-offers [data-solution]").first().click();
 await page.locator("#view-licensing").waitFor({state:"visible"});
 await page.locator("#featured-license [data-buy]").click();
 await page.locator("#order-review").waitFor({state:"visible"});
 assert.match(await page.locator("#order-price").innerText(),/€/);
 assert.equal(await page.locator("#order-terms").isChecked(),false);
 await page.locator("#order-continue").click();
 assert.match(await page.locator("#order-status").innerText(),/Bitte lesen und bestätigen/);
 assert.equal(page.url().includes("stripe.com"),false);
 await page.locator("#order-terms").check();
 await page.locator("#order-continue").click();
 await page.locator("#view-account").waitFor({state:"visible"});
 assert.equal(page.url().includes("stripe.com"),false);
 assert.equal(await page.locator("#purchase-intent").isVisible(),true);
 assert.equal(await page.locator("#account-journey .account-milestone").count(),5);
 assert.match(await page.locator("#account-journey").innerText(),/E-Mail bestätigt/);
 await page.screenshot({path:"qa-artifacts/04-account-pending-purchase.png",fullPage:true});
 await page.locator("#nav > [data-view='results']").click();
 await page.locator("#nav > [data-view='articles']").click();
 await page.fill("#article-search","50");
 assert.match(await page.locator("#article-table").innerText(),/Art\. 50/);
 await page.locator("#nav > [data-view='portfolio']").click();
 await page.locator("#view-portfolio").waitFor({state:"visible",timeout:10000});
 assert.equal((await page.locator("#stat-portfolio-canonical").innerText()).trim(),"13");
 assert.equal((await page.locator("#stat-portfolio-all").innerText()).trim(),"73");
 await page.locator("#portfolio-search").fill("AHASM");
 assert.match(await page.locator("#portfolio-list").innerText(),/AHASM/);
 await page.locator("#portfolio-search").fill("AUEF");
 assert.match(await page.locator("#portfolio-list").innerText(),/AUEF/);
 await page.locator("#portfolio-search").fill("");
 await page.screenshot({path:"qa-artifacts/03-architecture-portfolio.png",fullPage:true});
 await page.locator("#nav > [data-view='publications']").click();
 await page.locator("#view-publications").waitFor({state:"visible",timeout:12000});
 assert.equal((await page.locator("#pub-total").innerText()).trim(),"96");
 assert.equal((await page.locator("#pub-inspected").innerText()).trim(),"43");
 await page.locator("#publication-search").fill("PEKI");
 assert.match(await page.locator("#publication-list").innerText(),/Performative Epistemology/);
 await page.locator("#publication-search").fill("zenodo.21393619");
 assert.match(await page.locator("#publication-list").innerText(),/Verified Blocked Risk/);
 await page.locator("#publication-search").fill("");
 await page.locator("#publication-category").selectOption("faith");
 assert.match(await page.locator("#publication-list").innerText(),/Divine Source Model/);
 await page.locator("#publication-category").selectOption("all");
 await page.screenshot({path:"qa-artifacts/04-zenodo-doi-library.png",fullPage:true});
 await page.locator("#nav > [data-view='licensing']").click();
 assert.equal(await page.locator(".license-card").count(),8);
 await page.screenshot({path:"qa-artifacts/05-licensing.png",fullPage:true});
 // Downloaded result must remain machine-readable and retain provenance boundaries.
 await page.locator("#nav > [data-view='results']").click();
 const [jsonDownload]=await Promise.all([page.waitForEvent("download"),page.locator("#download-json").click()]);
 const jsonPath=await jsonDownload.path();
 const exported=JSON.parse(fs.readFileSync(jsonPath,"utf8"));
 assert.equal(exported.gate1,"DELAY");
 assert.equal(exported.gate2,"BLOCK");
 assert.equal(exported.architecture.length,73);
 assert.equal(exported.architecture_summary.canonical,13);
 assert.ok(exported.input_sha256&&/^[a-f0-9]{64}$/.test(exported.input_sha256));
 const [csvDownload]=await Promise.all([page.waitForEvent("download"),page.locator("#download-csv").click()]);
 const csvText=fs.readFileSync(await csvDownload.path(),"utf8");
 assert.match(csvText,/"Artikel";"Titel";"Screening-Status";"Erläuterung"/);
 assert.match(csvText,/\r\n"9";/);
 // Guest account protection: never claim report persistence without an actual session.
 await page.locator("#save-report").click();
 await page.locator("#view-account").waitFor({state:"visible"});
 assert.match(await page.locator("#auth-pane").innerText(),/Willkommen bei PIGA/);
 assert.ok(await page.locator("#password-recovery-pane").count()===1);
 await page.locator("#reset").click();
 assert.match(await page.locator("#auth-message").innerText(),/E-Mail-Adresse/);
 // Mobile-first navigation at narrow Android-like breakpoints.
 const mobile=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,acceptDownloads:true});
 const mobilePage=await mobile.newPage();
 try{
  await mobilePage.goto("http://127.0.0.1:4173/ai-act-intelligence/",{waitUntil:"domcontentloaded",timeout:45000});
  await mobilePage.waitForURL(/#home$/,{timeout:25000});
  assert.equal(await mobilePage.locator("#nav-more").isVisible(),true);
  assert.equal(await mobilePage.locator("#more-sheet").isVisible(),false);
  const overflow=await mobilePage.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=2,"mobile 360px horizontal overflow: "+overflow);
  await mobilePage.locator("#nav-more").click();
  assert.equal(await mobilePage.locator("#more-sheet").isVisible(),true);
  assert.equal(await mobilePage.locator("#nav-more").getAttribute("aria-expanded"),"true");
  await mobilePage.locator("#more-sheet [data-view='publications']").click();
  await mobilePage.locator("#view-publications").waitFor({state:"visible"});
  assert.equal(await mobilePage.locator("#more-sheet").isVisible(),false);
  assert.equal((await mobilePage.locator("#pub-total").innerText()).trim(),"96");
  await mobilePage.locator("#publication-search").fill("zenodo.17905081");
  assert.match(await mobilePage.locator("#publication-list").innerText(),/Performative Epistemology/);
  await mobilePage.locator("#nav-more").click();
  await mobilePage.keyboard.press("Escape");
  assert.equal(await mobilePage.locator("#more-sheet").isVisible(),false);
  await mobilePage.screenshot({path:"qa-artifacts/06-mobile-360.png",fullPage:true});
  await mobilePage.setViewportSize({width:320,height:720});
  const narrowOverflow=await mobilePage.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(narrowOverflow<=2,"mobile 320px horizontal overflow: "+narrowOverflow);
  await mobilePage.locator("#nav-more").click();
  await mobilePage.locator("#more-sheet [data-view='articles']").click();
  await mobilePage.locator("#article-search").fill("50");
  assert.match(await mobilePage.locator("#article-table").innerText(),/Art\. 50/);
  await mobilePage.screenshot({path:"qa-artifacts/07-mobile-320.png",fullPage:true});

  // Offline-first PWA: static shell and bibliographic index must remain available without network.
  await mobilePage.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await mobilePage.waitForFunction(()=>navigator.serviceWorker.controller!==null,{timeout:15000});
  const cacheEvidence=await mobilePage.evaluate(async()=>{
   const names=await caches.keys();
   const current="piga-aiact-shell-v19-voice-specialist";
   const cache=await caches.open(current);
   const response=await cache.match("./design-v3.css");
   const css=response?await response.text():"";
   return {names,cssContainsMobileRepair:css.includes("#view-results .report-overview")&&css.includes("@media screen and (max-width:880px)")};
  });
  assert.ok(cacheEvidence.names.includes("piga-aiact-shell-v19-voice-specialist"),"Old mobile CSS cache not invalidated: "+JSON.stringify(cacheEvidence));
  assert.ok(!cacheEvidence.names.some(x=>x.startsWith("piga-aiact-shell-")&&x!=="piga-aiact-shell-v19-voice-specialist"),"Old shell cache survived activation: "+JSON.stringify(cacheEvidence));
  assert.equal(cacheEvidence.cssContainsMobileRepair,true,"Cached CSS does not contain mobile report fix");
  await mobile.setOffline(true);
  await mobilePage.goto("http://127.0.0.1:4173/ai-act-intelligence/",{waitUntil:"domcontentloaded",timeout:20000});
  await mobilePage.waitForURL(/#home$/,{timeout:15000});
  assert.equal((await mobilePage.locator("#home-publications-count").innerText()).trim(),"96");
  await mobilePage.locator("#nav-more").click();
  await mobilePage.locator("#more-sheet [data-view='publications']").click();
  assert.equal((await mobilePage.locator("#pub-total").innerText()).trim(),"96");
  await mobilePage.locator("#publication-search").fill("VBR");
  assert.match(await mobilePage.locator("#publication-list").innerText(),/Verified Blocked Risk/);
  await mobilePage.screenshot({path:"qa-artifacts/08-mobile-offline.png",fullPage:true});
  await mobile.setOffline(false);
 }finally{await mobile.close();}
 if(failures.length)throw new Error("Browser errors: "+failures.join(" | "));
 console.log(JSON.stringify({status:"PASS",guest_assessment:true,gate1,gate2,tailored_solution_steps:8,informed_order_review:true,no_stripe_without_auth:true,print_a4_pdf:true,article_explorer:true,licensing_cards:8,json_csv_downloads:true,mobile_360_320:true,offline_pwa:true,guest_save_guard:true,browser_errors:0},null,2));
}finally{await browser.close();}
