/**
 * EU AI Act to PIGA implementation bridge — deterministic public explanation.
 * Legislative obligations are not claims about a deployed customer runtime.
 * Source: AI Act Service Desk consolidated 27 July 2026, Articles 5, 9, 10, 12, 14.
 */
export const PIGA_ACT_BRIDGE=Object.freeze([
 Object.freeze({id:"prohibition",refs:["5"],label:"Verbotene Praktiken",title:"Unzulässige Einsätze vorab stoppen",duty:"Verbotene Verwendungszwecke und Konstellationen dürfen nicht eingesetzt werden.",architecture:"Ein vorgeschaltetes Inference Gate kann eine erkannte, untersagte Anfrage blockieren – bevor ein Modell rechnet.",question:"Ist der konkrete Zweck inklusive Umfeld und betroffener Personen zulässig?",proof:"Dokumentierte Zweck- und Kontextprüfung, Klassifikation und technische Negativprobe",sku:"PIGA-PROD-001",control:null}),
 Object.freeze({id:"risk_data",refs:["9","10"],label:"Risiko & Daten",title:"Nachweise an jede Inferenz binden",duty:"Für einschlägige Hochrisiko-KI sind ein fortlaufendes Risikomanagement und geeignete Daten-Governance erforderlich.",architecture:"PIGA kann Systemversion, erlaubten Datenkontext und Evidenzgültigkeit als Bedingungen vor der Inferenz prüfen.",question:"Sind Systemversion, Risikoprofil und genutzte Daten im dokumentierten Geltungsbereich?",proof:"Aktueller Risikostand, Datenherkunft, Validierungsgrenzen und versionierter Evidenzverweis",sku:"PIGA-BUNDLE-01",control:"risk"}),
 Object.freeze({id:"logs",refs:["12"],label:"Nachvollziehbarkeit",title:"Auch die Erlaubnisentscheidung protokollieren",duty:"Hochrisiko-Systeme müssen technisch die automatische Aufzeichnung relevanter Ereignisse ermöglichen.",architecture:"Ein Authorization Trail kann zusätzlich festhalten, weshalb eine Inferenz zugelassen, verzögert oder blockiert wurde.",question:"Können Sie neben dem Ereignis auch Mandat, Entscheidung und Wirkung belegen?",proof:"Zeitgebundener Entscheidungsbeleg, manipulationsgeschütztes Log und Effect-Readback",sku:"PIGA-PROD-011",control:"logs"}),
 Object.freeze({id:"oversight",refs:["14"],label:"Menschliche Aufsicht",title:"Echte Eingriffs- und Veto-Rechte vorsehen",duty:"Einschlägige Hochrisiko-Systeme müssen eine wirksame menschliche Aufsicht ermöglichen.",architecture:"Eine getrennte Authority Plane kann ein unabhängiges Veto und eine befristete Handlungsfreigabe technisch abbilden.",question:"Wer darf eine Inferenz oder Außenwirkung anhalten, widerrufen und erneut autorisieren?",proof:"Benannte Aufsichtsperson, Rollen- und Widerrufsregel, Veto-Test und Wiederanlaufprotokoll",sku:"PIGA-PROD-002",control:"oversight"})
]);
const LAW_ROOT="https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-";
const legalUrl=ref=>LAW_ROOT+ref;
export const evidenceBridgeForReport=(report,input={})=>{
 const high=report?.subject?.highRisk===true;
 const suspected=report?.subject?.prohibited===true;
 return PIGA_ACT_BRIDGE.map(item=>{
  let priority=item.id==="prohibition"&&suspected?"critical":high?"relevant":"scope";
  const stated=item.control?input?.controls?.[item.control]===true:false;
  let proofStatus=stated?"Selbstauskunft · nicht geprüft":"Nachweis nicht vorgelegt";
  if(item.id==="prohibition")proofStatus=suspected?"Verbotsrisiko angezeigt · nicht freigegeben":"Zulässigkeit noch zu prüfen";
  const applicability=item.id==="prohibition"?"Verbotenheit fallbezogen prüfen":high?"Hochrisiko-Bezug angezeigt":"Anwendbarkeit anhand der Klassifikation prüfen";
  return {...item,priority,applicability,proofStatus,links:item.refs.map(r=>({article:r,url:legalUrl(r)})),technicalStatus:"Konzeptueller Kontrollvorschlag · nicht als produktive Sperre nachgewiesen"};
 });
};
export const BRIDGE_BOUNDARY="Die Voranalyse erläutert PIGA-Kontrollen. Sie führt keine Kunden-Inferenz aus und beweist weder eine technische Sperre in fremden Systemen noch vollständige EU-AI-Act-Konformität.";
