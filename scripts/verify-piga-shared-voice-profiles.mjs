#!/usr/bin/env node
// Static parity tests: user identity never inferred from an app role or spoken PIN.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const file=readFileSync("quality/piga-assistant-widget.mjs","utf8");
const status=readFileSync("piga-ortho-3d/ortho-ai-status.js","utf8");
const pairs={
  '"ados-portal":"showroom"':"Showroom",
  '"ortho-workspace":"ortho"':"KFO practice",
  '"ortho-shop":"kfo-shop"':"KFO Shop",
  '"ai-act":"ai_act"':"AI Act",
  '"nadias-bloom":"nadias_bloom"':"Nadia Bloom",
  '"cancer-research":"cancer"':"Cancer research",
  '"la-preuve-lab":"la_preuve"':"La Preuve",
  '"barakah":"barakah"':"Barakah"
};
for(const [token,name] of Object.entries(pairs))assert(file.includes(token),name+" missing fixed profile");
assert(file.includes('credentials:"omit"'),"Do not forward browser sessions");
assert(file.includes('answer.gate2!=="BLOCK"')&&file.includes('answer.externalEffects!==0'),"No silent effects");
assert(!file.includes("120617"),"Never embed user voice code or identifier in public browser JS");
assert(status.includes('/api/piga/assistant/v1/status?app=ortho'),"Use current central readiness");
assert(status.includes("data.ready===true"),"Only actual ready status");
assert(!status.includes("neuen Schlüssel")&&!status.includes("/piga-ortho-3d/ai/status"),"No obsolete Gemini status");
console.log("PASS: shared PIGA profile/status parity, gate2 BLOCK, no owner PIN in public code");
