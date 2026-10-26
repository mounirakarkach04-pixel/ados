#!/usr/bin/env node
/**
 * PIGA AI Act Intelligence — bounded public-production readback worker.
 * READ-ONLY: no accounts, purchases, private data, mutation or unbounded retry.
 * Lifecycle: SOURCE -> LIVE READBACK -> REVERSE -> GATE 1 -> GATE 2 -> RESULT.
 */
import fs from "node:fs";
import crypto from "node:crypto";
const root="ai-act-intelligence";
const origin="https://mounirakarkach04-pixel.github.io/ados/ai-act-intelligence/";
const results=[];
const sha256=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
const record=(name,state,evidence)=>results.push({name,state,...evidence});
const STATIC=["index.html","app.bundle.js","engine.js","portfolio.js","publications.js","piga-act-bridge.js","welcome-journey.mjs","article-operational-map.js","article-operations.mjs","styles.css","design-v3.css","sw.js","manifest.webmanifest","privacy.html","terms.html"];
async function remote(path,{method="GET",headers={},body}={}){
 const response=await fetch(path,{method,headers,body,signal:AbortSignal.timeout(12000),redirect:"follow",cache:"no-store"});
 return response;
}
for(const name of STATIC){
 const file=root+"/"+name;
 if(!fs.existsSync(file)){record(name,"BLOCK",{reason:"local_source_missing"});continue;}
 try{
  const local=fs.readFileSync(file),res=await remote(new URL(name,origin));
  if(res.status!==200){record(name,"BLOCK",{http_status:res.status,reason:"live_source_unavailable"});continue;}
  const remoteBytes=Buffer.from(await res.arrayBuffer());
  const expected=sha256(local),actual=sha256(remoteBytes);
  record(name,expected===actual?"ALLOW":"DELAY",{http_status:res.status,bytes:remoteBytes.byteLength,hash_match:expected===actual,local_sha256:expected,remote_sha256:actual,...(expected===actual?{}:{reason:"deployment_not_equal_to_checked_commit"})});
 }catch(error){record(name,"UNKNOWN",{reason:"network_or_transport_error",message:String(error.message||error).slice(0,180)});}
}
try{
 const manifest=JSON.parse(fs.readFileSync(root+"/manifest.webmanifest","utf8"));
 const required=["name","id","start_url","scope","display","icons"];
 const missing=required.filter(x=>!manifest[x]);
 record("manifest_structure",missing.length?"BLOCK":"ALLOW",{missing});
}catch(error){record("manifest_structure","BLOCK",{reason:String(error.message||error).slice(0,160)});}
// Verify the newly published welcome journey is the actually reviewed customer experience.
// This is a source/readback contract, NOT a conversion-rate or commercial Gate-2 claim.
try{
 const html=fs.readFileSync(root+"/index.html","utf8");
 const welcome=fs.readFileSync(root+"/welcome-journey.mjs","utf8");
 const expected={
  welcome_headline:html.includes("Bevor Ihre KI entscheidet:"),
  audience_selector:["provider","deployer","both"].every(role=>html.includes('data-audience="'+role+'"')),
  free_preassessment:html.includes("Kostenfreie KI-Voranalyse starten"),
  report_specific_cta:html.includes('id="result-guide-cta"'),
  client_module_loaded:html.includes('src="welcome-journey.mjs"'),
  demo_never_sells_directly:welcome.includes('if(isDemo)return')&&welcome.includes('destination:"assessment"')
 };
 const failed=Object.entries(expected).filter(([,ok])=>!ok).map(([name])=>name);
 record("welcome_journey_contract",failed.length?"BLOCK":"ALLOW",{checks:expected,failed});
}catch(error){record("welcome_journey_contract","BLOCK",{reason:"welcome_readback_source_error",message:String(error.message||error).slice(0,160)});}
// Detect regressions where desktop grid minimums force one-character-wide
// report cards on narrow screens. Full geometry is checked independently
// by the Chromium end-to-end suite on eight viewport widths.
try {
 const css=fs.readFileSync(root+"/design-v3.css","utf8");
 const expected={
  narrow_screen_override:css.includes("@media screen and (max-width:880px)"),
  scoped_results_grid:css.includes("#view-results .report-overview"),
  one_column_layout:css.includes("grid-template-columns:minmax(0,1fr)"),
  print_media_preserved:css.includes("@media print")
 };
 const missing=Object.entries(expected).filter(([,ok])=>!ok).map(([key])=>key);
 record("mobile_report_grid_contract",missing.length?"BLOCK":"ALLOW",{checks:expected,missing,
  chromium_evidence:"https://github.com/mounirakarkach04-pixel/ados/actions/runs/40377211740"});
}catch(error){record("mobile_report_grid_contract","BLOCK",{reason:"mobile_css_contract_error",message:String(error.message||error).slice(0,160)});}
// Previously installed Android PWAs must not keep the old CSS indefinitely.
try {
 const sw=fs.readFileSync(root+"/sw.js","utf8");
 const current="piga-aiact-shell-v18-operational-atlas";
 const checks={
  cache_version_bumped:sw.includes(current),
  reload_http_cache:sw.includes('new Request(path, {cache:"reload"})'),
  old_piga_shells_expired:sw.includes('key.startsWith("piga-aiact-shell-") && key !== CACHE'),
  public_css_precached:sw.includes('"./design-v3.css"')
 };
 const missing=Object.entries(checks).filter(([,ok])=>!ok).map(([key])=>key);
 record("sw_cache_refresh_contract",missing.length?"BLOCK":"ALLOW",{checks,missing});
}catch(error){record("sw_cache_refresh_contract","BLOCK",{reason:"cache_version_readback_error",message:String(error.message||error).slice(0,150)});}
// Public operational mapping release: all 119 references must be published with a
// correctly scoped control template and no claim of customer-system certification.
try {
 const catalog=fs.readFileSync(root+"/article-operational-map.js","utf8");
 const entry=fs.readFileSync(root+"/article-operations.mjs","utf8");
 const html=fs.readFileSync(root+"/index.html","utf8");
 const ok={catalogCompleteGuard:catalog.includes('ids.length!==119'),legalScope:catalog.includes('NOT_ASSESSED'),
  clientAtlasLoaded:html.includes('src="article-operations.mjs"'),articleExplorer:html.includes('id="atlas-list"'),
  boundedPublicDelivery:entry.includes('PAGE_SIZE=12'),noAutoOrder:!entry.includes('client.functions.invoke')};
 const failures=Object.entries(ok).filter(([,pass])=>!pass).map(([k])=>k);
 record("all_articles_operational_atlas",failures.length?"BLOCK":"ALLOW",{checks:ok,failures,count:119,
 source:"https://ai-act-service-desk.ec.europa.eu/en/ai-act-explorer",status:"CONTROL_TEMPLATES_NOT_CASE_CERTIFICATIONS"});
}catch(error){record("all_articles_operational_atlas","BLOCK",{reason:String(error?.message||error).slice(0,160)});}
const sensitive=fs.readFileSync(root+"/app.bundle.js","utf8");
record("client_secret_boundary",/(?:sk_live_|whsec_|SUPABASE_SERVICE_ROLE_KEY\s*[=:]\s*['"])/.test(sensitive)?"BLOCK":"ALLOW",{checked:"no Stripe live secret / no public service-role assignment"});
try{
 const url="https://sanrkcovmkkhgdqydxfk.supabase.co/functions/v1/aiact-payment";
 const response=await remote(url,{method:"POST",headers:{"content-type":"application/json","origin":"https://mounirakarkach04-pixel.github.io"},body:'{"operation":"checkout","sku":"INVALID_NO_AUTH"}'});
 const denied=response.status===401||response.status===403;
 record("negative_checkout_no_auth",denied?"ALLOW":"BLOCK",{http_status:response.status,reason:denied?"unauthenticated_checkout_rejected":"unexpected_server_status",payment_created:false});
}catch(error){record("negative_checkout_no_auth","UNKNOWN",{reason:"edge_transport_unverified",message:String(error.message||error).slice(0,150),payment_created:false});}
try{
 const response=await remote("https://sanrkcovmkkhgdqydxfk.supabase.co/functions/v1/aiact-license",{method:"POST",headers:{"content-type":"application/json","origin":"https://mounirakarkach04-pixel.github.io"},body:'{"sku":"PIGA-PROD-001"}'});
 const denied=response.status===401||response.status===403;
 record("negative_proprietary_license_no_auth",denied?"ALLOW":"BLOCK",{http_status:response.status,reason:denied?"unauthenticated_private_playbook_rejected":"unexpected_server_status"});
}catch(error){record("negative_proprietary_license_no_auth","UNKNOWN",{reason:"edge_transport_unverified",message:String(error.message||error).slice(0,150)});}
try{
 // Empty/untrusted body must NEVER be admitted as a valid Stripe event.
 const response=await remote("https://sanrkcovmkkhgdqydxfk.supabase.co/functions/v1/aiact-stripe-webhook",{
  method:"POST",headers:{"content-type":"application/json"},body:'{"id":"evt_forged","type":"checkout.session.completed","livemode":true}'
 });
 const denied=response.status===400||response.status===401||response.status===403||response.status===503;
 record("negative_webhook_unsigned_event",denied?"ALLOW":"BLOCK",{http_status:response.status,
  reason:denied?"unsigned_webhook_denied_or_runtime_not_configured":"unexpected_unsigned_webhook_acceptance",
  payment_created:false,entitlement_granted:false});
}catch(error){record("negative_webhook_unsigned_event","UNKNOWN",{reason:"webhook_transport_unverified",message:String(error.message||error).slice(0,150)});}
const reverse=[
 "A SHA256 match proves bytes published, not accessibility or UX quality on physical phones",
 "Rejected unauthenticated checkout or unsigned webhook is not evidence that a real paid lifecycle works",
 "Historical CI tests are not real-world customer onboarding or Apple/Google signed release",
 "Operator identity, privacy, customer support, legal contracts and incident response need separate readback",
 "The 119 legal article identifiers contain a bounded subset of contextual analysis, not a certified legal opinion",
 "No unknown, BLOCK or missing independent evidence can be promoted to a positive Gate 2"
];
const failures=results.filter(x=>x.state==="BLOCK"),unknowns=results.filter(x=>x.state==="UNKNOWN"),delayed=results.filter(x=>x.state==="DELAY");
const report={
 schema:"piga-aiact-release-readback-v1",generated_at:new Date().toISOString(),
 target:origin,
 bounded:true,iterations:1,cost_class:"existing_public_github_actions",
 gate1:failures.length?"BLOCK":unknowns.length||delayed.length?"DELAY":"ALLOW",
 gate2:"BLOCK",
 launch_readiness:"NOT_CERTIFIED_FOR_FULL_COMMERCIAL_MARKET_RELEASE",
 reason_gate2:"No independently witnessed production paid checkout, complete account lifecycle, signed iOS release and finalized provider/legal identity in this worker.",
 claims:{web_source_readback:failures.length===0&&unknowns.length===0&&delayed.length===0,android_signed_store_release:false,ios_signed_store_release:false,live_payment_integration:false,legal_complete:false},
 summary:{checked:results.length,pass:results.filter(x=>x.state==="ALLOW").length,block:failures.length,unknown:unknowns.length,delay:delayed.length},
 results,reverse,
 next_action:"Remediate exact BLOCK/DELAY receipts; independent production onboarding/payment/identity/device tests require authorized operator."
};
fs.mkdirSync("qa-artifacts",{recursive:true});
fs.writeFileSync("qa-artifacts/piga-release-readback.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({schema:report.schema,summary:report.summary,gate1:report.gate1,gate2:report.gate2,launch_readiness:report.launch_readiness,issues:results.filter(x=>x.state!=="ALLOW").map(x=>({name:x.name,state:x.state,reason:x.reason}))},null,2));
if(failures.length||unknowns.length||delayed.length)process.exitCode=2;
