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
