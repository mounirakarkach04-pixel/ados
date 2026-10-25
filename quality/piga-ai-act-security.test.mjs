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
 assert.ok(source.includes('const isVerifiedCheckoutReturnHost='));
 assert.ok(source.includes('if(!isVerifiedCheckoutReturnHost){toast('));
 assert.ok(source.includes('emailRedirectTo:accountEmailRedirect'));
 assert.ok(source.includes('redirectTo:accountEmailRedirect'));
 assert.ok(source.includes('const HOSTED_APP="https://mounirakarkach04-pixel.github.io/ados/ai-act-intelligence/"'));
});
