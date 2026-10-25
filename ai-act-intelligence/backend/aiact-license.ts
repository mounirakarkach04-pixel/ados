import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// PIGA AI Act Intelligence: strictly licensed, scoped implementation delivery.
// No client-side source contains the protected implementation payload.
type Playbook={title:string,scope:string,phases:string[],artifacts:string[],admission:string};
const PACKS:Record<string,Playbook>={
 "PIGA-PROD-001":{title:"Inference Admission — Integration Runbook",scope:"A specific system/version, inference type and relying actor",phases:[
  "1. Bind subject_id, version, intended purpose, operator, recipient, role, scope and event timestamp.",
  "2. Resolve authority source, authorization chain, scope, revocation and conflict before any model reliance.",
  "3. Attach signed or integrity-referenced evidence envelopes with provenance, collection time, validity and independent verification status.",
  "4. Evaluate required/conditional PIGA controls: absence or contradiction yields UNKNOWN/DELAY/BLOCK, never an averaged override.",
  "5. Run the seven-stage A7SEM according to the licensed canonical mapping; execute Reverse counterexamples and alternate-path review.",
  "6. Issue Gate-1 Decision Passport: ALLOW/DELAY/BLOCK/UNKNOWN/EXPIRED plus scoped expiry and re-entry triggers.",
  "7. Trigger re-entry on version, policy, data, authority, purpose or evidence validity changes; an inference permission never authorizes an external effect."
 ],artifacts:["subject.json","evidence-envelope.json","controls-assessment.json","gate1-decision-passport.json","a7sem-reverse-findings.json"],admission:"Controlled evaluation only until runtime evidence is read back."},
 "PIGA-PROD-002":{title:"Action Admission — Integration Runbook",scope:"One named external effect after a valid Gate-1 decision",phases:[
  "1. Prove current Gate-1 lineage and exact intended effect/recipient/permissions.",
  "2. Re-resolve live authority, delegation, time, revocation, destination, policy and material change immediately before action.",
  "3. Mint a bounded single-use nonce and lease. Persist consumption before any effect that can be retried.",
  "4. If any condition fails: BLOCK, UNKNOWN, EXPIRED or DELAY with non-execution receipt, never a blind retry.",
  "5. Execute exactly one capability-scoped operation in the existing five-engine governed runtime.",
  "6. Gather ACK → terminal result → observed effect / NOT_OBSERVED / UNKNOWN and post-effect readback.",
  "7. Apply A7SEM Reverse to indirect effect paths. Mark DONE only with truthful and current readback."
 ],artifacts:["gate2-authority-check.json","nonce-ledger.json","dispatch-receipt.json","effect-readback.json","reentry-event.json"],admission:"Gate 2 is independent from Gate 1, payment and technical capability."},
 "PIGA-PROD-005":{title:"Agentic Action Boundary — Integration Runbook",scope:"Tools, agents, delegation and memory boundaries",phases:[
  "1. Inventory every tool/capability, delegated authority and exfiltration boundary.",
  "2. Separate reasoning, planning, tool selection, capability and permission.",
  "3. Add bounded worker tickets with scope, TTL, ownership and effect class.",
  "4. Require per-action Gate 2 for every consequence-capable external effect.",
  "5. Record nondelivery, timeouts, idempotency and any fallback branch as evidence.",
  "6. Verify emergency stop, revocation, indirect paths and A7SEM Reverse."
 ],artifacts:["tool-capability-matrix.csv","authority-chain.json","worker-contract.json","effect-ledger.json"],admission:"Do not create a sixth engine or permanent unconstrained worker."},
 "PIGA-PROD-011":{title:"VBR Structural Completeness — Integration Runbook",scope:"A claimed blocked risk and all plausible alternate effect paths",phases:[
  "1. State prohibited consequence precisely with causality boundary and time interval.",
  "2. Identify direct, indirect, asynchronous, delegated and retry-based harm paths.",
  "3. Distinguish command rejection, dispatch absence, network trace, recipient-side receipt and independent effect readback.",
  "4. Grade and bind evidence. BLOCK label alone cannot prove the effect did not occur.",
  "5. Run deliberate negative controls and A7SEM Reverse counterexamples.",
  "6. Close findings only with bounded, reproducible proof; otherwise label UNKNOWN/DELAY."
 ],artifacts:["harm-path-map.json","alternate-path-register.csv","negative-controls.json","vbr-proof-bundle.json"],admission:"VBR is an evidence claim, not a risk-score badge."},
 "PIGA-PROD-022":{title:"Prior Insurability — Underwriting Evidence Runbook",scope:"Specific AI use-case and contractual coverage questions",phases:[
  "1. Record legal entity, role, jurisdiction, use-case, financial/physical effects and severity range.",
  "2. Map negligence, product liability, contractual duties, privacy, cyber, technology E&O and potential regulatory fines distinctly.",
  "3. Provide versioned control registry, residual risk owners, incidents, and remediation commitments.",
  "4. Assemble Gate-1/Gate-2 decision passports, VBR evidence and effect-readback proofs.",
  "5. Check existing exclusions, retroactive dates, sublimits, aggregation, exclusions for autonomous action and contractual warranties.",
  "6. Seek an underwriting determination from an authorized insurer; no automated coverage promise."
 ],artifacts:["insurance-risk-register.csv","coverage-gap-matrix.csv","underwriter-questionnaire.md","proof-index.json"],admission:"No guarantee of cover or insurability."},
 "PIGA-PROD-043":{title:"Governed Compute Assessment — Measurement Runbook",scope:"Bounded AI inference workflow and measured losses",phases:[
  "1. Declare model, workload, baseline, environment, versions and reproducible evaluation protocol.",
  "2. Measure model latency, token/energy/compute usage when instrumentation is available.",
  "3. Distinguish intrinsic model variance from tool coordination, governance waits and failed retries.",
  "4. Audit sample selection and reproducibility, reporting uncertainty and confounders.",
  "5. Connect inference admission events with measured compute and consequence effectiveness."
 ],artifacts:["experiment-manifest.json","metric-traces.csv","variance-analysis.json","assessment-report.json"],admission:"Not a generic GPU benchmark or production-readiness certificate."},
 "PIGA-BUNDLE-01":{title:"Two-Gate Admission Pack — Implementation Sequence",scope:"Inference plus one bounded external action",phases:[
  "1. First implement all applicable Inference Admission controls of PIGA-PROD-001.",
  "2. Implement the separate action boundary of PIGA-PROD-002 with nonce, TTL and live authority recheck.",
  "3. Record an end-to-end ACK/result/effect/readback chain and a failure-mode negative test.",
  "4. Run A7SEM Reverse on declared invariants before release.",
  "5. Publish versioned acceptance evidence; keep human-reserved actions human-reserved."
 ],artifacts:["inference-passport.json","action-passport.json","readback.json","acceptance-evidence.json"],admission:"Two gates are separate and neither is bypassed."},
 "PIGA-BUNDLE-07":{title:"Insurability Evidence Pack — Integration Sequence",scope:"Scoped liability / audit evidence dossier",phases:[
  "1. Run the Prior Insurability Assessment with bounded system and jurisdiction context.",
  "2. Collect the VBR / structural completeness evidence independently.",
  "3. Reconcile controls, incident history, all effective exclusions and residual uncertainty.",
  "4. Submit the insurer-ready package for independent coverage assessment."
 ],artifacts:["underwriter-questionnaire.md","harm-path-map.json","risk-register.csv","coverage-gap-matrix.csv"],admission:"Insurance may be denied; a framework is not a policy."}
};
const allowedOrigins=["https://mounirakarkach04-pixel.github.io","https://pigapocket.com","https://www.pigapocket.com","capacitor://localhost","http://localhost"];
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin")||"";
 const headers:Record<string,string>={"content-type":"application/json","vary":"Origin","cache-control":"no-store","access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"authorization,apikey,content-type"};
 if(allowedOrigins.includes(origin))headers["access-control-allow-origin"]=origin;
 const reply=(o:unknown,status=200)=>new Response(JSON.stringify(o),{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"METHOD_NOT_ALLOWED"},405);
 if(origin&&!allowedOrigins.includes(origin))return reply({error:"ORIGIN_NOT_ALLOWED"},403);
 const auth=req.headers.get("authorization")||"";
 if(!auth.startsWith("Bearer "))return reply({error:"AUTH_REQUIRED"},401);
 const url=Deno.env.get("SUPABASE_URL");
 const key=Deno.env.get("SUPABASE_ANON_KEY");
 if(!url||!key)return reply({error:"BACKEND_NOT_CONFIGURED"},503);
 let payload:any;
 try{payload=await req.json()}catch{return reply({error:"INVALID_JSON"},400)}
 const sku=typeof payload?.sku==="string"?payload.sku:"";
 if(!PACKS[sku])return reply({error:"UNKNOWN_SKU"},404);
 const h={apikey:key,authorization:auth};
 const authCheck=await fetch(url+"/auth/v1/user",{headers:h});
 if(!authCheck.ok)return reply({error:"AUTH_INVALID"},401);
 const account=await authCheck.json();
 if(!account?.id)return reply({error:"AUTH_INVALID"},401);
 const query=new URL(url+"/rest/v1/aiact_entitlements");
 query.searchParams.set("select","sku,status,expires_at,stripe_checkout_session");
 query.searchParams.set("owner_id","eq."+account.id);
 query.searchParams.set("sku","eq."+sku);
 query.searchParams.set("status","eq.ACTIVE");
 const result=await fetch(query,{headers:h});
 if(!result.ok)return reply({error:"ENTITLEMENT_LOOKUP_UNAVAILABLE"},503);
 const records=await result.json();
 const valid=Array.isArray(records)&&records.some((r:any)=>r.status==="ACTIVE"&&(!r.expires_at||Date.parse(r.expires_at)>Date.now()));
 if(!valid)return reply({error:"LICENSE_NOT_VERIFIED",message:"Payment alone does not create entitlement; server-side verified license is required."},403);
 // Fresh payment and refund readback: a stale ACTIVE database status cannot grant IP access.
 const stripeSecret=Deno.env.get("STRIPE_SECRET_KEY");
 if(!stripeSecret?.startsWith("sk_live_"))return reply({error:"LIVE_STRIPE_CHECK_NOT_CONFIGURED"},503);
 const eligible=records.find((r:any)=>r.status==="ACTIVE"&&(!r.expires_at||Date.parse(r.expires_at)>Date.now()));
 const sid=String(eligible?.stripe_checkout_session||"");
 if(!/^cs_live_[A-Za-z0-9]{8,256}$/.test(sid))return reply({error:"UNBOUND_PAYMENT_RECEIPT"},403);
 try{
   const headersStripe={"authorization":"Bearer "+stripeSecret};
   const sessRes=await fetch("https://api.stripe.com/v1/checkout/sessions/"+encodeURIComponent(sid),{headers:headersStripe});
   if(!sessRes.ok)return reply({error:"STRIPE_READBACK_UNAVAILABLE"},503);
   const sess=await sessRes.json();
   if(sess.livemode!==true||sess.payment_status!=="paid"||sess.status!=="complete"||sess.client_reference_id!==account.id||sess.metadata?.sku!==sku||!/^pi_[A-Za-z0-9]+$/.test(String(sess.payment_intent||"")))
     return reply({error:"PAID_STATUS_NOT_CURRENT"},403);
   const intentRes=await fetch("https://api.stripe.com/v1/payment_intents/"+encodeURIComponent(sess.payment_intent)+"?expand%5B%5D=latest_charge",{headers:headersStripe});
   if(!intentRes.ok)return reply({error:"CHARGE_READBACK_UNAVAILABLE"},503);
   const intent=await intentRes.json(),ch=intent.latest_charge;
   if(intent.status!=="succeeded"||typeof ch!=="object"||ch?.paid!==true||ch?.refunded===true||ch?.disputed===true||(ch?.amount_refunded||0)>0)
     return reply({error:"CHARGE_NOT_VALID"},403);
 }catch{return reply({error:"STRIPE_VERIFICATION_FAILED"},503)}

 return reply({sku,version:"PIGA-AIACT-PLAYBOOK-1.0",verified_at:new Date().toISOString(),scope_notice:"Technical licensed support material; no assignment of intellectual property or statutory certification.",playbook:PACKS[sku]});
});
