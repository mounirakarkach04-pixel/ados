// PIGA ACT Customer Journey v2 · pure deterministic presentation mapper.
// Values are explanatory product-fit hints, NOT paid admission, certification or legal advice.
import {PRODUCTS} from "./engine.js";
export const JOURNEY_STAGES=Object.freeze([
 {id:"discover",label:"Entdecken",description:"Zweck und Nutzen verstehen"},
 {id:"assess",label:"Prüfen",description:"KI-Einsatz strukturiert erfassen"},
 {id:"review",label:"Verstehen",description:"Einordnung und fehlende Belege"},
 {id:"resolve",label:"Lösen",description:"Passenden Maßnahmenplan auswählen"},
 {id:"account",label:"Konto",description:"Zugriff und E-Mail bestätigen"},
 {id:"checkout",label:"Bezahlen",description:"Stripe-hosted Checkout"},
 {id:"activate",label:"Aktivieren",description:"Zahlung nachweisen, Lizenz abrufen"}
]);
export const LICENSE_PRICES_EUR=Object.freeze({
 "PIGA-PROD-001":7900,"PIGA-PROD-002":7900,"PIGA-PROD-005":12900,
 "PIGA-PROD-011":24900,"PIGA-PROD-022":24900,"PIGA-PROD-043":1490,
 "PIGA-BUNDLE-01":13900,"PIGA-BUNDLE-07":44900
});
export const priceLabel=sku=>Number.isSafeInteger(LICENSE_PRICES_EUR[sku])?new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(LICENSE_PRICES_EUR[sku]):"Preis auf Anfrage";
const ACTIONS=Object.freeze([
 {number:1,question:"Welches konkrete KI-System wird eingesetzt, und wer trägt die Verantwortung?",measure:"Systemversion, Anbieter, Betreiber, Zweck und tatsächlich betroffene Personen dokumentieren.",proof:"Systemakte mit Versionskennung und verantwortlicher Stelle",sku:"PIGA-PROD-001"},
 {number:2,question:"Unter welche EU-AI-Act-Risikokategorie und konkrete Norm fällt der Einsatzzweck?",measure:"Rolle, Zweck, Annex-I-/Annex-III-Bezug und mögliche Verbote rechtlich einordnen; Ausnahmen separat prüfen.",proof:"Begründete Klassifikation mit einschlägigen Normverweisen",sku:"PIGA-BUNDLE-01"},
 {number:3,question:"Welche Kontrollen sind belegt und welche wurden nur angekreuzt?",measure:"Risiko-, Daten-, Dokumentations- und Aufsichtsmaßnahmen einzeln einer überprüfbaren Evidenzquelle zuordnen.",proof:"Kontrollinventar und aktuelle Evidenzverweise",sku:"PIGA-PROD-011"},
 {number:4,question:"Sind Nachweise aktuell, versioniert und ihrer Herkunft zuordenbar?",measure:"Quellen, Hashes, Zuständigkeit, Gültigkeitsfenster und unabhängigen Kontrollnachweis erfassen.",proof:"Glassbox Evidence Envelope mit Herkunft, Zeit und Prüfumfang",sku:"PIGA-PROD-011"},
 {number:5,question:"Darf die angefragte Inferenz mit diesen Belegen überhaupt beginnen?",measure:"PIGA Gate 1 je System, Zweck und Kontext vor Auswertung dokumentieren; bei offener Evidenz DELAY oder UNKNOWN beibehalten.",proof:"Inference Admission Memo mit Ursache, Status und Ablauf",sku:"PIGA-PROD-001"},
 {number:6,question:"Wer darf welche reale Wirkung auslösen – und bis wann?",measure:"Gate 2 separat für Tools, Veröffentlichungen, Geld-, Daten- oder Systemänderungen mit frischer Autorisierung entscheiden.",proof:"Action Admission Memo mit Actor, Scope, Nonce und Expiry",sku:"PIGA-PROD-002"},
 {number:7,question:"Ist auch die tatsächliche Nichtausführung beziehungsweise Wirkung nachgewiesen?",measure:"Ereignis-, Sink- und Effekt-Readback mit A7SEM Reverse abgleichen; VBR nur bei geeigneter unabhängiger Evidenz beanspruchen.",proof:"Wirkungs- und Blockiernachweis mit Gegenprobe",sku:"PIGA-PROD-011"},
 {number:8,question:"Welche verbleibenden Folgen, Haftungsrisiken und Deckungslücken bestehen?",measure:"Haftung, Vertragsgrenzen und versicherungstechnische Deckung gesondert fachlich beurteilen; keine Policenzusage ableiten.",proof:"Prior-Insurability-Dossier und Risikoentscheidung",sku:"PIGA-PROD-022"}
]);
const NON_DONE=new Set(["UNKNOWN","BLOCK","DELAY","GAPS","REVIEW_REQUIRED","MISSING_EVIDENCE","UNVERIFIED_UPLOAD","NOT_VERIFIED","UNDERWRITING_REQUIRED"]);
export function actionPlan(report){
 if(!report||!Array.isArray(report.ladder))return[];
 return report.ladder.map((step,i)=>{
  const base=ACTIONS[i];if(!base)return null;
  return {...base,label:step.label,state:step.state,requiresWork:NON_DONE.has(step.state)||step.state==="SELF_REPORTED",
    urgency:report.subject?.prohibited&&i<3?"CRITICAL":i<=3?"HIGH":"PLANNED",
    kind:step.state==="DOCUMENTED"?"Bestandsaufnahme dokumentiert":"Maßnahme offen",
    article_refs:i===1?[5,6]:i===2?report.findings?.slice(0,6).map(x=>x.article):[]};
 }).filter(Boolean);
}
export function offersForReport(report){
 const bySku=new Map(PRODUCTS.map(p=>[p.sku,p]));
 if(!report)return PRODUCTS.map(p=>({...p,priority:0,why:"Für unterschiedliche Governance-Anforderungen",price:priceLabel(p.sku)}));
 const f=report.subject||{}, findings=report.findings||[];
 const high=!!f.highRisk, agents=!!f.agents,critical=!!f.critical,prohibited=!!f.prohibited;
 const value=sku=>{
  switch(sku){
   case "PIGA-PROD-001":return {score:high?7:5,why:"Admission vor jeder Inferenz mit überprüfbarem Scope"};
   case "PIGA-PROD-002":return {score:agents?10:critical?8:4,why:"Separates Handlungs-Gate vor externen Wirkungen"};
   case "PIGA-PROD-005":return {score:agents?14:1,why:"Agenten, Tools und delegierte Außenwirkungen gezielt begrenzen"};
   case "PIGA-PROD-011":return {score:findings.length>7?11:7,why:"Offene Evidenz- und VBR-Nachweiskette vervollständigen"};
   case "PIGA-PROD-022":return {score:critical?12:3,why:"Haftungs- und Versicherbarkeitsscope unabhängig prüfen"};
   case "PIGA-PROD-043":return {score:high||prohibited?2:9,why:"Kompakter Einstieg in Governed Compute für den Systemkontext"};
   case "PIGA-BUNDLE-01":return {score:high?16:agents?12:8,why:"Gate 1 und Gate 2 zusammen als durchgängige Nachweisarchitektur"};
   case "PIGA-BUNDLE-07":return {score:critical&&high?15:critical?10:2,why:"Vertiefte Verbindung von Admission, VBR und Haftungs-/Deckungsfragen"};
   default:return {score:0,why:"Gezielte Governance-Fachleistung"};
  }
 };
 return PRODUCTS.map(p=>({...p,...value(p.sku),price:priceLabel(p.sku)})).sort((a,b)=>b.score-a.score||a.sku.localeCompare(b.sku));
}
export function executiveFinding(report){
 if(!report)return null;
 const c=report.classification;
 const heading=report.subject?.prohibited?"Mögliche verbotene KI-Praxis":
  c==="HIGH_RISK_POTENTIAL"?"Potentiell hochriskanter KI-Einsatz":
  c==="GPAI_SPECIFIC"?"GPAI-Modellpflichten prüfen":
  c==="TRANSPARENCY_FOCUS"?"Transparenzpflichten gezielt prüfen":"Einstufung noch offen";
 const count=report.findings?.length||0;
 return {heading,summary:count?count+" relevante Prüfpositionen · konkrete Nachweise und zulässige Maßnahmen klären":"Weitere Informationen zur rechtlichen Einordnung erforderlich",
  status:report.gate1,action:report.subject?.prohibited?"Einsatz und Rechtslage vor jeder weiteren Wirkung prüfen":"Prüflücken schließen und Admission erneut bewerten",
  disclosure:"Eine vorläufige Einordnung ist keine Konformitätsbestätigung oder Handlungsfreigabe."};
}
