import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const text=path=>readFileSync(path,"utf8");
const registry=JSON.parse(text("quality/portfolio-registry.json"));
const assistant=JSON.parse(text("quality/piga-assistant-portfolio.v1.json"));
const model=text("quality/piga-assistant-widget.mjs");
const styles=text("quality/piga-assistant-widget.css");
new vm.Script(model,{filename:"quality/piga-assistant-widget.mjs"});
assert.equal(assistant.apps.length,11);
assert.equal(new Set(assistant.apps.map(a=>a.id)).size,11);
assert.deepEqual(assistant.apps.map(a=>a.id).sort(),registry.apps.map(a=>a.id).sort());
assert.deepEqual(assistant.coreEngines,["intake","queue","govern","evidence","decision"]);
assert.equal(assistant.gateway.credentialsInClient,false);
assert.equal(assistant.defaults.noAutomatedSend,true);
assert.equal(assistant.defaults.gate2,"BLOCK");
assert.equal(assistant.defaults.globalCostCeilingEur,0);
assert.match(model,/consent:true/);
assert.match(model,/form\.addEventListener\("submit"/);
assert.match(model,/credentials:"omit"/);
assert.match(model,/status!=="ANSWER"/);
assert.match(model,/externalEffects!==0/);
assert.match(model,/gate2!=="BLOCK"/);
assert.match(model,/SpeechSynthesisUtterance/);
assert.doesNotMatch(model,/localStorage|sessionStorage|document\.cookie|innerHTML/);
assert.match(styles,/\.piga-common :focus-visible/);
let active=0,pending=0,special=0;
for(const item of assistant.apps){
 const app=registry.apps.find(a=>a.id===item.id);
 const html=text(app.path);
 if(item.clientSurface==="generic_opt_in"||item.clientSurface.startsWith("generic_opt_in_")){
  assert.match(html,new RegExp('data-piga-app="'+item.id+'"'),"Missing adapter "+item.id);
  assert.match(html,/piga-assistant-widget\.css/);
  assert.match(html,/piga-assistant-widget\.mjs/);
  active++;
 }else if(item.clientSurface==="specialized_live_ui"){
  assert.ok(/piga-specialist\.mjs|kfo-shop-advisor\.js/.test(html),"Missing specialized UI "+item.id);
  special++;
 }else{
  assert.equal(item.clientSurface,"PENDING_SOURCE_ADAPTER_REVIEW");
  pending++;
 }
}
assert.equal(active,8);
assert.equal(special,2);
assert.equal(pending,1);
assert.equal(assistant.apps.find(a=>a.id==="ortho-preview").profile,"ortho");
assert.equal(assistant.apps.find(a=>a.id==="ortho-workspace").profile,"ortho");
assert.match(model,/field\.maxLength=420/);
assert.match(model,/confirm\.checked=false/);
assert.match(model,/answer\.app!==profile/);
assert.match(model,/data-piga-mount/);
console.log("PASS PIGA portfolio: 11 mapped; 8 generic opt-in, 2 specialized, 1 pending; bounded Showroom profiles, no external effects");
