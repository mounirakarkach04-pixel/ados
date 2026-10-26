import assert from "node:assert/strict";
import {guidanceFor} from "./welcome-journey.mjs";
const cases=[
 [{isDemo:true,gate1:"BLOCK",gate2:"BLOCK"},"assessment","Muster"],
 [{gate1:"BLOCK",gate2:"DELAY"},"solutions","Voraussetzungen"],
 [{gate1:"ALLOW",gate2:"BLOCK"},"solutions","Voraussetzungen"],
 [{gate1:"EXPIRED",gate2:"ALLOW"},"solutions","erneuert"],
 [{gate1:"UNKNOWN",gate2:"ALLOW"},"solutions","offen"],
 [{gate1:"DELAY",gate2:"ALLOW"},"solutions","Evidenz"],
 [{gate1:"ALLOW",gate2:"ALLOW"},"solutions","Zertifikat"],
 [{gate1:"invalid",gate2:"ALLOW"},"solutions","offen"]
];
for(const [input,destination,match] of cases){
 const result=guidanceFor(input);assert.equal(result.destination,destination);
 assert.match(result.heading,new RegExp(match,"i"));assert.ok(result.explanation.length>50);
 assert.ok(result.note.length>10);assert.ok(!/jetzt kaufen|nur heute|garantiert|zertifiziert!/i.test(Object.values(result).join(" ")));
}
console.log("PASS "+cases.length+" result-guidance cases");
