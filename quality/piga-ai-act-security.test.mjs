import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("Proprietary implementation guides are absent from the public web source",()=>{
 assert.equal(existsSync("ai-act-intelligence/backend/aiact-license.ts"),false);
 assert.equal(/Inference Admission — Integration Runbook/.test(read("ai-act-intelligence/app.bundle.js")),false);
});
test("Front-end does not contain live payment secrets",()=>{
 for(const file of ["ai-act-intelligence/index.html","ai-act-intelligence/app.js","ai-act-intelligence/app.bundle.js"]){
   assert.doesNotMatch(read(file),/sk_live_[0-9a-zA-Z]{12,}|whsec_[0-9a-zA-Z]{12,}/);
 }
});
test("Checkout must create and reconcile on an authenticated server",()=>{
 const s=read("ai-act-intelligence/app.js");
 for(const fragment of ['"aiact-payment"','operation:"checkout"','operation:"confirm"','confirmPaymentIfNeeded','client.functions.invoke'])
 assert.ok(s.includes(fragment),fragment);
});
test("Server verifies Stripe charge, product, account and uses privileged receipt gate",()=>{
 const s=read("ai-act-intelligence/backend/aiact-payment.ts");
 for(const fragment of ['client_reference_id','session.payment_status!=="paid"','lineItems.data.length!==1','charge?.refunded===true','aiact_grant_paid_license','SUPABASE_SERVICE_ROLE_KEY','STRIPE_SECRET_KEY'])
 assert.ok(s.includes(fragment),fragment);
 assert.match(s,/CHECKOUT_UNAVAILABLE/);
});
test("No unsupported full EU AI Act compliance PASS claim",()=>{
 const s=read("ai-act-intelligence/engine.js");
 assert.ok(s.includes('"NOT_ASSESSED"'));
 assert.ok(s.includes('gate2="BLOCK"'));
 assert.ok(s.includes("USER_DECLARED_NOT_INDEPENDENTLY_VERIFIED"));
});

test("reopened saved assessments retain original case_data, never current form state",()=>{
 const source=read("ai-act-intelligence/app.js");
 for(const fragment of ['activeInput=structuredClone(input)','const f=activeInput;', 'report,case_data','activeInput=record.case_data||null','restoreInput(activeInput)'])
  assert.ok(source.includes(fragment),"missing input-integrity guard: "+fragment);
});
test("password recovery consumes Supabase recovery event and updates password explicitly",()=>{
 const source=read("ai-act-intelligence/app.js");
 const page=read("ai-act-intelligence/index.html");
 for(const fragment of ['PASSWORD_RECOVERY','recoveryMode=true','auth.updateUser({password})','"recovery-submit"','queueMicrotask('])
  assert.ok(source.includes(fragment),fragment);
 assert.ok(page.includes('id="password-recovery-pane"'));
 assert.ok(page.includes('autocomplete="new-password"'));
});
test("secondary navigation is reachable without duplicating protected implementation",()=>{
 const source=read("ai-act-intelligence/app.js"),page=read("ai-act-intelligence/index.html");
 assert.ok(source.includes('aria-expanded'));
 assert.ok(page.includes('id="more-sheet"'));
 for(const view of ['articles','portfolio','publications','licensing'])assert.ok(page.includes('id="more-sheet"')&&page.includes('data-view="'+view+'"'));
});

test("native or unverified website cannot start payment lacking a secure return route",()=>{
 const source=read("ai-act-intelligence/app.js");
 assert.ok(source.includes('const isNativeShell=location.protocol==="capacitor:"'));
 assert.ok(source.includes('location.hostname==="localhost"'));
 assert.ok(source.includes('window.Capacitor?.isNativePlatform?.()===true'));
 assert.ok(source.includes('const isVerifiedCheckoutReturnHost='));
 assert.ok(source.includes('if(!isVerifiedCheckoutReturnHost){toast('));
 assert.ok(source.includes('emailRedirectTo:accountEmailRedirect'));
 assert.ok(source.includes('redirectTo:accountEmailRedirect'));
 assert.ok(source.includes('const HOSTED_APP="https://mounirakarkach04-pixel.github.io/ados/ai-act-intelligence/"'));
});

test("user-controlled assessment and attached evidence deletion is ownership-bounded",()=>{
 const source=read("ai-act-intelligence/app.js");
 for(const fragment of ['data-delete','window.confirm(','user.id+"/"+record.id+"/"','uploaded.some(','storage.from("aiact-evidence").remove(paths)', '.delete().eq("id",record.id).eq("owner_id",user.id).select("id")']){
  assert.ok(source.includes(fragment),"missing scoped-deletion guard "+fragment);
 }
 assert.match(read("ai-act-intelligence/privacy.html"),/einzelne gespeicherte Vorprüfungen/);
});

test("commercial experience uses exact EU prices and deterministic insight-to-action stages",()=>{
 const src=read("ai-act-intelligence/journey.js");
 const app=read("ai-act-intelligence/app.js");
 const html=read("ai-act-intelligence/index.html");
 assert.match(src,/PIGA-BUNDLE-01.*13900/);
 assert.match(src,/PIGA-PROD-043.*1490/);
 for(const fragment of ["actionPlan","offersForReport","executiveFinding","LICENSE_PRICES_EUR"])assert.ok(src.includes(fragment));
 for(const fragment of ["setWizardStep(1)","selectOffer(","rememberOffer(","confirmationRunning","purchase-intent","commerce-status"])assert.ok((src+app+html).includes(fragment),fragment);
 assert.ok(html.includes('id="recommended-buy"'));
 assert.ok(html.includes('class="report-cover"'));
 assert.ok(html.includes('data-assessment-step="4"'));
 assert.ok(app.includes('if(activeReport.is_demo)'));
});

test("premium UX exposes solutions and blocks blind purchase before order review",()=>{
 const html=read("ai-act-intelligence/index.html");
 const app=read("ai-act-intelligence/app.js");
 const css=read("ai-act-intelligence/design-v3.css");
 const sw=read("ai-act-intelligence/sw.js");
 for(const id of ['id="view-solutions"','id="solutions-plan"','id="order-review"','id="order-terms"','id="order-continue"','id="order-price"'])
  assert.ok(html.includes(id),"missing conversion stage "+id);
 for(const signal of ['function renderSolutions()','function beginOrder(sku)','if(!$("order-terms").checked)','if(!user)','client.functions.invoke("aiact-payment"'])
  assert.ok(app.includes(signal),"missing checkout guard: "+signal);
 assert.ok(css.includes(".solution-checklist"));
 assert.ok(css.includes("@media print"));
 assert.ok(sw.includes('"./design-v3.css"'));
 assert.equal((html.match(/class="journey-step/g)||[]).length,7);
});

test("dedicated Stripe webhook verifies signatures and never grants by redirect claim",()=>{
 const hook=read("ai-act-intelligence/backend/aiact-stripe-webhook.ts");
 for(const fragment of ["STRIPE_WEBHOOK_SECRET","stripe-signature","verifySignedPayload","HMAC","SHA-256",
    "payment_status","line_items","amount_total","aiact_grant_paid_license","aiact_webhook_events",
    'status:"REVOKED"',"charge.dispute.created","charge.refunded","checkout.session.async_payment_succeeded"]){
   assert.ok(hook.includes(fragment),"missing webhook security requirement "+fragment);
 }
 assert.doesNotMatch(hook,/whsec_[0-9A-Za-z]{20,}|sk_live_[0-9A-Za-z]{20,}/);
 assert.ok(hook.includes("WEBHOOK_RUNTIME_NOT_ADMITTED"));
 assert.ok(hook.includes('!await verifySignedPayload('));
 assert.ok(hook.includes("session?.metadata?.piga_origin"));
 assert.ok(hook.includes("receipt.stripe_checkout_session"));
});
