// PIGA AI Act Intelligence — public regulatory screening, not proprietary licensed implementation.
// Legal source: EU AI Act consolidated 2026-07-27; Digital Omnibus AI Regulation (EU) 2026/1744.
// This module is intentionally deterministic and always preserves uncertainty.
export const LAW_VERSION = "2026-07-27";
export const LAW_URL = "https://eur-lex.europa.eu/eli/reg/2024/1689/2026-07-27/eng";
export const TIMELINE_URL = "https://ai-act-service-desk.ec.europa.eu/en/ai-act/eu-ai-act-implementation-timeline";
export const TERMS = {
  literacy:{article:"4",label:"AI-Kompetenz",why:"Nachweis angemessener KI-Kompetenz relevanter Personen"},
  prohibited:{article:"5",label:"Verbotene KI-Praktiken",why:"Anwendungszweck und verbotene Praktiken abgrenzen"},
  classification:{article:"6",label:"Hochrisiko-Einstufung",why:"Anhang I/III und Ausnahmen einzelfallbezogen prüfen"},
  risk:{article:"9",label:"Risikomanagement",why:"Dokumentiertes, fortlaufendes Risikomanagement"},
  data:{article:"10",label:"Daten & Daten-Governance",why:"Relevanz und Nachweis von Datenqualität, Bias und Herkunft"},
  technical:{article:"11",label:"Technische Dokumentation",why:"Versionierte technische Dokumentation"},
  logs:{article:"12",label:"Aufzeichnungspflichten",why:"Traceability, Ereignisaufzeichnungen und Aufbewahrung"},
  transparency:{article:"13",label:"Information an Betreiber",why:"Informationen, Gebrauchsanweisung und Grenzen"},
  oversight:{article:"14",label:"Menschliche Aufsicht",why:"Wirksame unabhängige Übersteuerung und Eingriffsmöglichkeiten"},
  robustness:{article:"15",label:"Genauigkeit & Cybersicherheit",why:"Robustheit, Genauigkeit und Cyberresilienz"},
  provider:{article:"16",label:"Anbieterpflichten",why:"Konkrete Betreiber-/Anbieterrolle und Verpflichtungen"},
  quality:{article:"17",label:"Qualitätsmanagement",why:"Kontinuierliche Governance und Qualitätsmanagement"},
  retention:{article:"18",label:"Dokumentation vorhalten",why:"Dokumentation und Nachweise aufbewahren"},
  providerlogs:{article:"19",label:"Anbieter-Aufzeichnungen",why:"Anwendbare technische Log-Aufbewahrung"},
  corrective:{article:"20",label:"Korrekturmaßnahmen",why:"Abhilfe und Rücknahmeprozesse"},
  cooperation:{article:"21",label:"Behördenkooperation",why:"Nachweisverfügbarkeit für Aufsichtsbehörden"},
  deployer:{article:"26",label:"Betreiberpflichten",why:"Nutzungskontrolle, Überwachung, Menschenaufsicht"},
  fr:{article:"27",label:"Grundrechts-Folgenabschätzung",why:"Prüfen, ob eine FRIA erforderlich ist"},
  conformity:{article:"43",label:"Konformitätsbewertung",why:"Passenden formellen Bewertungspfad identifizieren"},
  declaration:{article:"47",label:"EU-Konformitätserklärung",why:"Bei Einschlägigkeit Erklärung vorbereiten"},
  registration:{article:"49",label:"EU-Datenbank",why:"Registrierungspflichten und ggf. Ausnahmen prüfen"},
  marking:{article:"50",label:"Transparenz bei KI-Interaktion",why:"KI-Interaktion und synthetische Inhalte kennzeichnen"},
  gpai:{article:"53",label:"GPAI-Modellanbieterpflichten",why:"Modellinformationen, Copyright und Trainingszusammenfassung"},
  gpaisystemic:{article:"55",label:"GPAI mit systemischem Risiko",why:"Zusätzliche Risikoevaluierung und Sicherheit"},
  monitoring:{article:"72",label:"Marktüberwachung",why:"Post-Market-Monitoring für einschlägige Hochrisiko-KI"},
  incident:{article:"73",label:"Schwerwiegende Vorfälle",why:"Melde- und Eskalationswege prüfen"},
  penalties:{article:"99",label:"Sanktionen",why:"Haftungs- und Sanktionsrisiken dokumentieren"}
};
const ANNEX3 = new Set(["biometric","infrastructure","education","employment","essential","policing","migration","justice","democracy"]);
const PRODUCTS = [
  {sku:"PIGA-PROD-001",title:"Inference Admission Memo",type:"Inference / Nachweis",url:"https://buy.stripe.com/7sY00c1UY9xH4FtfACaAw05"},
  {sku:"PIGA-PROD-002",title:"Action Admission Memo",type:"Handlung / Autorität",url:"https://buy.stripe.com/14A6oA43625fgob3RUaAw06"},
  {sku:"PIGA-PROD-005",title:"Agentic Action Boundary Review",type:"Agenten / Tools",url:"https://buy.stripe.com/aFa8wIgPS7pzgob0FIaAw08"},
  {sku:"PIGA-PROD-011",title:"VBR & Structural Completeness Evaluation",type:"Blockiernachweis",url:"https://buy.stripe.com/8x2eV657a25f1th0FIaAw09"},
  {sku:"PIGA-PROD-022",title:"Prior Insurability Assessment",type:"Versicherbarkeit",url:"https://buy.stripe.com/cNi14g436h099ZN602aAw0c"},
  {sku:"PIGA-PROD-043",title:"Governed Compute Assessment",type:"Systemleistung",url:"https://buy.stripe.com/aFa00c1UYh09gobcoqaAw0d"},
  {sku:"PIGA-BUNDLE-01",title:"Two-Gate Admission Pack",type:"Governance-Paket",url:"https://buy.stripe.com/9B69AM7fi39j3Bp1JMaAw0e"},
  {sku:"PIGA-BUNDLE-07",title:"Insurability Evidence Pack",type:"Risiko- und Versicherungsnachweis",url:"https://buy.stripe.com/14AfZafLOdNX4Ft4VYaAw0h"}
];
export { PRODUCTS };
// The 2026 Digital Omnibus inserted six additional article identifiers beyond the 113 original numbered articles.
// Newly inserted provisions are indexed, but are never silently marked as assessed.
export const INSERTED_2026_ARTICLES=[
 {after:4,number:"4a",title:"Besondere Kategorien personenbezogener Daten zur Erkennung und Korrektur von Verzerrungen"},
 {after:60,number:"60a",title:"Realtests bestimmter Hochrisiko-KI-Systeme außerhalb regulatorischer Reallabore"},
 {after:75,number:"75a",title:"Aufsichts- und Durchsetzungsbefugnisse des KI-Büros"},
 {after:75,number:"75b",title:"Verpflichtungszusagen"},
 {after:75,number:"75c",title:"Nichteinhaltung, Geldbußen und Zwangsgelder"},
 {after:75,number:"75d",title:"Verfahrensgarantien und weitere Konkretisierung"}
];
export const articleCatalog = Array.from({length:113},(_,i)=>{
 const n=String(i+1),item=Object.values(TERMS).find(x=>x.article===n);
 return {number:i+1,title:item?.label||"Artikel "+n,screened:Boolean(item),amended:false};
}).flatMap(article=>[article,...INSERTED_2026_ARTICLES.filter(x=>x.after===article.number).map(x=>({number:x.number,title:x.title,screened:false,amended:true}))]);
const d=(x)=>String(x||"").trim();
export function evaluate(raw,documents=[]) {
  const f={...raw};
  const now=new Date().toISOString();
  const title=d(f.title);
  const purpose=d(f.purpose);
  const sector=d(f.sector);
  const role=d(f.role);
  const version=d(f.version)||"nicht angegeben";
  const highRisk=ANNEX3.has(sector)||f.productSafety===true;
  const prohibited=f.prohibited===true;
  const gpai=f.gpai===true;
  const bot=f.chatbot===true||f.synthetic===true;
  const isProvider=role==="provider"||role==="both";
  const isDeployer=role==="deployer"||role==="both";
  const applicable=new Set(["4","5","6","99"]);
  if(highRisk) ["9","10","11","12","13","14","15","17","18","19","20","21","43","47","49","72","73"].forEach(x=>applicable.add(x));
  if(isProvider&&highRisk) applicable.add("16");
  if(isDeployer&&highRisk){applicable.add("26");applicable.add("27");}
  if(bot)applicable.add("50");
  if(gpai){applicable.add("53");if(f.systemic===true)applicable.add("55");}
  const clues={
    4:"literacy",5:"prohibited",6:"classification",9:"risk",10:"data",11:"technical",12:"logs",13:"transparency",14:"oversight",15:"robustness",16:"provider",17:"quality",18:"retention",19:"providerlogs",20:"corrective",21:"cooperation",26:"deployer",27:"fr",43:"conformity",47:"declaration",49:"registration",50:"marking",53:"gpai",55:"gpaisystemic",72:"monitoring",73:"incident",99:"penalties"
  };
  const evidence=documents.map(x=>({name:d(x.name).slice(0,160),size:Number(x.size)||0,path:d(x.path),sha256:d(x.sha256),uploaded:Boolean(x.uploaded)}));
  const controls=typeof f.controls==="object"&&f.controls?f.controls:{};
  const findings=[];
  for(const [a,key] of Object.entries(clues)){
    if(!applicable.has(a))continue;
    const term=TERMS[key];
    if(a==="5"&&!prohibited)continue;
    if(a==="6"&&!highRisk)continue;
    const claimed=Boolean(controls[key]);
    // A checkbox or uploaded file does NOT prove legal compliance.
    const status=(a==="5"&&prohibited)?"POTENTIAL_PROHIBITION":claimed?"SELF_DECLARED_UNVERIFIED":"EVIDENCE_REQUIRED";
    findings.push({article:a,title:term.label,issue:term.why,status,control:key,claimed,source:LAW_URL+"#art_"+a});
  }
  // All EU AI Act articles are indexed. Non-mapped provisions are NOT marked compliant.
  const articles=articleCatalog.map(a=>{
    const matched=findings.find(fnd=>Number(fnd.article)===a.number);
    return {article:a.number,title:a.title,status:matched?.status||(a.screened?"SCREENING_NOT_TRIGGERED":"NOT_ASSESSED"),note:matched?.issue||(a.screened?"Aus den Angaben keine automatische Einstufung":"Manuelle Normenprüfung erforderlich")};
  });
  const missing=findings.filter(x=>x.status==="EVIDENCE_REQUIRED").length;
  const contradiction=prohibited&&Boolean(controls.prohibited);
  const unknown=!title||!purpose||!sector||!role;
  const gate1=prohibited?"BLOCK":unknown?"UNKNOWN":"DELAY";
  const gate2="BLOCK";
  const risk=prohibited?"PROHIBITED_POTENTIAL":highRisk?"HIGH_RISK_POTENTIAL":gpai?"GPAI_SPECIFIC":bot?"TRANSPARENCY_FOCUS":"CLASSIFICATION_PENDING";
  const dates=[
    {scope:"Allgemeine Verbote und KI-Kompetenz",date:"2025-02-02"},
    {scope:"GPAI-Modellpflichten",date:"2025-08-02"},
    {scope:"Transparenz & weitere geltende Pflichten",date:"2026-08-02"},
    {scope:"Zusätzliche Verbote / bestimmte Art.-50(2)-Übergänge",date:"2026-12-02"},
    {scope:"Hochrisiko Anhang III",date:"2027-12-02"},
    {scope:"Hochrisiko Anhang I / Produkt-KI",date:"2028-08-02"}
  ];
  const ladder=[
    {label:"01 · System & Zweck",state:unknown?"UNKNOWN":"DOCUMENTED"},
    {label:"02 · Risikoklasse & Rechtsgrundlage",state:prohibited?"BLOCK":"REVIEW_REQUIRED"},
    {label:"03 · Kontrollen & Organisationspflichten",state:missing?"GAPS":"SELF_REPORTED"},
    {label:"04 · Belegkette / Glassbox",state:evidence.some(x=>x.uploaded)?"UNVERIFIED_UPLOAD":"MISSING_EVIDENCE"},
    {label:"05 · PIGA Gate 1 / Inference",state:gate1},
    {label:"06 · PIGA Gate 2 / Action",state:gate2},
    {label:"07 · VBR / Effekt-Readback",state:"NOT_VERIFIED"},
    {label:"08 · Haftung / Versicherbarkeit",state:"UNDERWRITING_REQUIRED"}
  ];
  const priorities=[];
  if(prohibited)priorities.push("Die mögliche verbotene Praxis stoppen und Artikel 5 mit qualifizierter juristischer Prüfung abklären.");
  if(unknown)priorities.push("Zweck, Rolle, Version und Einsatzbereich vollständig deklarieren.");
  if(highRisk)priorities.push("Anhang-I/III-Klassifikation mit Artikeln 6 und 9–15 sowie Ausnahmen aus Artikel 6(3) begründen.");
  if(bot)priorities.push("Art.-50-Offenlegung und Kennzeichnung maschinenlesbarer synthetischer Inhalte prüfen.");
  if(gpai)priorities.push("Rolle als GPAI-Modellanbieter gegen Artikel 53 und ggf. 55 abgrenzen.");
  if(missing)priorities.push(missing+" kontrollbezogene Nachweislücken aus der vorläufigen Checkliste schließen.");
  priorities.push("Evidenzquelle, Versionsbindung, Verantwortlichkeit, Ablaufdatum und Gegenhypothese dokumentieren.");
  priorities.push("Vor jeder realen Außenwirkung eine separate, zeitaktuelle Handlungsermächtigung prüfen.");
  priorities.push("Produkthaftung, Datenschutz, Vertragsrisiken, Policenbedingungen und Versicherbarkeit gesondert bewerten; der AI Act begründet keine allgemeine Pflicht zur KI-Versicherung.");
  const suggestions=[PRODUCTS[0],PRODUCTS[1],PRODUCTS[3],PRODUCTS[4]];
  if(f.agents===true)suggestions.unshift(PRODUCTS[2]);
  if(highRisk)suggestions.unshift(PRODUCTS[6]);
  if(f.critical===true)suggestions.push(PRODUCTS[7]);
  return {
    schema:"PIGA-AIACT-PREASSESSMENT-1.0",created_at:now,law_version:LAW_VERSION,law_url:LAW_URL,
    subject:{title,purpose,role,sector,version,developer:d(f.developer),productSafety:f.productSafety===true,highRisk,prohibited,gpai,bot},
    classification:risk,gate1,gate2, findings,articles,ladder,evidence,
    evidence_status:"USER_DECLARED_NOT_INDEPENDENTLY_VERIFIED",
    a7sem:{status:"CONCEPTUAL_LENS_ONLY",note:"Kanonische sieben Stufen sind ohne verifizierte Implementierung nicht automatisch als PASS attestierbar."},
    reverse:{status:contradiction?"CONTRADICTION":"REVIEW_REQUIRED",questions:[
      "Ist der dokumentierte Systemzweck identisch mit dem tatsächlichen Einsatz?",
      "Welche indirekten Wirkungswege umgehen einen behaupteten BLOCK?",
      "Sind Evidenz, Version und Delegation am Entscheidungszeitpunkt noch gültig?",
      "Lässt sich ein behaupteter Nichteffekt unabhängig nachweisen?"
    ]},
    liability:{status:"SEPARATE_ASSESSMENT_REQUIRED",areas:["EU-AI-Act-Pflichten","DSGVO","EU-Produkthaftung 2024/2853, falls einschlägig","Vertrags- und Deliktshaftung","Schadensszenarien","Versicherbarkeit und Deckungsausschlüsse"]},
    priorities,dates,suggestions,
    coverage:{indexed:articleCatalog.length,inserted_2026:INSERTED_2026_ARTICLES.length,contextual_findings:findings.length,remaining_manual_review:articles.filter(a=>a.status==="NOT_ASSESSED").length,submitted_documents:evidence.length},
    caveat:"Vorprüfung, keine Rechtsberatung, Konformitätsbescheinigung, Zertifizierung, Versicherungs- oder Handlungsgarantie. Kein ALLOW ohne unabhängige Belege und Gate-2-Autorität."
  };
}
