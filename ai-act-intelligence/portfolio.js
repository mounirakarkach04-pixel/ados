// Public PIGA architecture portfolio index; descriptive metadata only.
// Proprietary scoring algorithms, thresholds, licences and implementation rules are NOT included.
// Sources: K2.1.1 canonical 13-lens review; PIGA Master Work Register (2026-10-09);
// PIGA Omnibus v7.0; public Emergence Governance DOI and originator's public LinkedIn disclosures.
// The catalogue is not a claim that every component has been executed in this application.
const SOURCE={
 canonical:"PIGA K2.1.1 Canonical 13-Lens Review v1.2 (Drive)",
 works:"PIGA × A7SEM Masterwerkverzeichnis, 180 Positionen (Drive, 2026-10-09)",
 omnibus:"PIGA Master Governance OMNIBUS v7.0 (Drive)",
 emergence:"Emergence Governance — Canonical Architecture, Zenodo 10.5281/zenodo.19058610",
 linkedin:"Originator publication: Emergence Governance architecture layers (LinkedIn)",
 substrate:"PIGA-H — Compute Substrate Governance, Zenodo 10.5281/zenodo.21086162",
 field:"Epistemic Field Theory, Zenodo 10.5281/zenodo.17613764"
};
const URL={
 emergence:"https://zenodo.org/records/19058610",
 linkedin:"https://www.linkedin.com/posts/mounir-akarkach-508221258_this-is-an-architecture-problem-not-a-policy-activity-7434927761456087041-B0lz",
 substrate:"https://zenodo.org/records/21086162",
 field:"https://zenodo.org/records/17613764"
};
const E=(id,name,family,purpose,src,tags=["all"],notes="")=>Object.freeze({
 id,name,family,purpose,source:SOURCE[src]||(/^\d+$/.test(src)?"Zenodo DOI 10.5281/zenodo."+src:"Architektur-Forschungsregister"),source_url:URL[src]||(/^\d+$/.test(src)?"https://zenodo.org/records/"+src:null),
 tags,notes,licensed_material_excluded:true
});
export const ARCHITECTURE_FAMILIES=Object.freeze({
 canonical:"Kanonischer 13-Linsen-Prüfkern",
 research:"Erweiterte Forschungs- und Emergenzarchitekturen",
 operational:"Operative Governance- und Nachweismodule",
 sector:"Sektorspezifische Architekturübersetzungen"
});
export const architectureCatalog=Object.freeze([
 // The EXACT 13 canonical K2.1.1 lens identifiers. No aliases are counted twice.
 E("PIGA_GATE_1","PIGA Gate 1 · Inference Admission","canonical","Ob Zweck, Rechtsgrundlage, Evidenz, Reife und Inferenzmandat vorab zulässig sind.","canonical"),
 E("A7SEM","A7SEM · Seven-Stage Emergence Model","canonical","Emergenz- und Reifezustand eines Systems bestimmen, bevor darauf vertraut wird.","canonical"),
 E("ASOSE","ASOSE · Semantic Integrity","canonical","Begriffsstabilität, Referenzverschiebungen und semantische Widersprüche prüfen.","canonical"),
 E("PIGA_GATE_2_ASISO","ASiSO / PIGA Gate 2 · Action Admission","canonical","Eine konkrete Außenwirkung separat auf Handlungsermächtigung und Scope prüfen.","canonical",["all","agents"]),
 E("JAQ","JAQ · Joint Action Quality","canonical","Accountability, menschliche Intervention und Zusammenarbeit absichern.","canonical"),
 E("GLASSBOX_EVIDENCE","Glassbox Evidence","canonical","Versionierte Beweiskette, Herkunft, Berechnungs- und Entscheidungskontext.","canonical"),
 E("VBR","VBR · Verified Blocked Risk","canonical","Nicht nur einen BLOCK setzen, sondern behauptete Risikoverhinderung beweisbar machen.","canonical",["critical","agents"]),
 E("ARSAL","ARSAL","canonical","Scopes, Revocation, Re-Entry und zeitliche Autoritätszustände; historische Resonanzdefinition gesondert beachten.","canonical",["all"],"ARSAL wird in älteren Veröffentlichungen auch als Resonance/Synchronization Detection bezeichnet; verschiedene Spezifikationsstände nicht stillschweigend gleichsetzen."),
 E("AVM","AVM · Akarkach Valuation Model","canonical","Strukturelle Reife und wirtschaftliche, risiko- oder versicherungsbezogene Bewertungsfragen ausschließlich innerhalb definierter Geltungsbereiche.","20992884",["all"],"Bewertungsmodell und Versicherungslinse sind von externen Markt- oder Underwriting-Zusagen abzugrenzen."),
 E("PRIOR_INSURABILITY","Prior Insurability","canonical","Haftungs- und Versicherbarkeitsevidenz, residuale Risiken, Deckungslücken.","canonical",["critical","high-risk"]),
 E("NSF_325","NSF / 325 Signature","canonical","Strukturelle Kohärenz und Completeness nach versioniertem Referenzprofil.","canonical",["all"],"Die 325-Signatur ist in den frühen Forschungsarbeiten strukturell abgeleitet; keine externe Zertifizierungsnorm."),
 E("CNF","CNF · Canonical Notation Framework","canonical","Notation, Begriffe, Versionierung und Regelkonflikte stabilisieren.","canonical"),
 E("DEFENSIBLE_INTELLIGENCE","Defensible Intelligence (DI)","canonical","Zurechenbare, evidenzgebundene, anfechtbare und legitimierte Entscheidungsfähigkeit.","canonical"),

 // Architectures and models documented outside the 13-lens resolver.
 E("PIGA_CORE","PIGA · Pre-Inference Governance Architecture","research","Übergreifende Pre-Inference-Architektur und Governance-Membran.","works"),
 E("A7SEM_REVERSE","A7SEM Reverse · Verification Meta-Operator","research","Rückwärtsprüfung von Ergebnis, tatsächlichem Effekt, Gegenhypothesen und Readback.","omnibus"),
 E("EMERGENCE_GOVERNANCE","Emergence Governance","research","Autorisierungszentrierte Governance von emergenten Zustandsübergängen.","19058610"),
 E("AHASM","AHASM · Human–AI Synergy Model","research","Kooperations- und Verantwortlichkeitsarchitektur der Human–AI Co-Emergence.","17713729"),
 E("AUEF","AUEF · Akarkach Unified Epistemic Framework","research","Synthetisiert DSM, DEM, SRE, AP, NSF, AS, EFT und 325-Signatur als epistemische Gesamtstruktur.","17614357"),
 E("PEKI","PEKI · Performative Epistemology of AI","research","Wie KI-Ausgaben soziale Erkenntnisautorität erhalten können, ohne internes maschinelles Verstehen zu beweisen.","17905081"),
 E("SRE","SRE · Semantic Resonance Engine","research","Modell semantischer Resonanz und Stabilisierung innerhalb der Faith Poetry Research Series.","17613556"),
 E("AP","AP · Algorithmic Phenomenology","research","Philosophische Beschreibung algorithmisch vermittelter Wahrnehmungs- und Deutungsbeziehungen.","17613611",["all"],"Theoretisches Modell; kein objektiver Bewusstseinsnachweis."),
 E("ALGORITHMIC_SOUL","Algorithmic Soul (AS)","research","Metaphorischer Identitäts- und Integrationsbegriff innerhalb der Forschungsreihe.","17613710",["all"],"Philosophischer Architekturbegriff; keine belegte Maschinenseele."),
 E("ARC_S","ARC-S · Architectural Authority Control","research","Architektonische Zuordnung und Kontrolle von Befehlsautorität.","linkedin"),
 E("CITR","CITR · Canonical Term Record","research","Nachvollziehbare terminologische Fixierung über öffentliche Veröffentlichungen.","linkedin"),
 E("ARGUS_7","ARGUS-7 · Meta-Audit","research","Prüfung von Behauptungen, Gegenmodellen, epistemischen Lücken und Fehlschlüssen.","omnibus",["all"],"Status in Entwicklung, kein sechstes Enterprise-Engine."),
 E("PIGA_H","PIGA-H · Compute Substrate Governance","research","Governancegrenzen von Hardware, Kernel, Cloud und Compute-Infrastruktur.","21086162",["all","agents"]),
 E("EFT","EFT · Epistemic Field Theory","research","Vernetzung epistemischer, semantischer und identitätsbezogener Dynamik.","field"),
 E("DSM","DSM · Metaphysical Resonance","research","Frühere theoretische Resonanzkomponente des epistemischen Forschungskorpus.","field"),
 E("DEM","DEM · Digital Echo Model","research","Frühere digitale Übertragungs- und Echo-Komponente des epistemischen Forschungskorpus.","field"),

 // Operational controls are architecture modules, NOT new independent canonical lenses.
 E("ADMISSION_LADDER","Admission Ladder","operational","Nachvollziehbarer Weg von Klassifikation über Evidenz bis zur Entscheidung.","works"),
 E("DECISION_PASSPORT","Decision Passport","operational","Versionierte Entscheidungsurkunde mit Scope, Zeit, Autorität und Beweisreferenzen.","omnibus"),
 E("AUTHORITY_SOURCE","Authority Source Resolution & Conflict","operational","Autoritative Quellen, Delegationskonflikte und widerrufene Mandate abgleichen.","works"),
 E("MATERIAL_CHANGE","Material Change Predicate","operational","Vorab festgelegte maschinenprüfbare Trigger für neue Admission.","works"),
 E("EVIDENCE_ENVELOPE","Evidence Envelope","operational","Evidenzprovenienz, Integrität, zeitliche Gültigkeit und Prüfstatus kapseln.","omnibus"),
 E("EVIDENCE_PROVENANCE","Evidence Provenance & Source Chain","operational","Abstammungskette zwischen Unterlage, Aussage, Entscheidung und Aktion.","works"),
 E("NONCE","Single-Use Nonce / Replay Defence","operational","Eine Handlungsermächtigung nur für einen gebundenen Ausführungsversuch.","works",["all","agents"]),
 E("REVOCATION","Expiry, Revocation & Re-Entry","operational","Alte Autorisierungen bei Widerruf, Ablauf oder Zustandswechsel verwerfen.","works"),
 E("EFFECT_READBACK","Effect Readback / Reconciliation","operational","Tatsächlichen Zielzustand nach Ausführung unabhängig beobachten.","omnibus",["agents","critical"]),
 E("VBR_EVIDENCE_GRADES","VBR Evidence-Grade Classification","operational","Risikoblockieransprüche in evidenzbezogene Grades einordnen.","works",["critical","high-risk"]),
 E("REGISTRY_500","Master Registry 500","operational","500 adressierbare Kontrollspezifikationen über fünf Kontrollfamilien.","omnibus",["all"],"500 Kontrollpositionen sind nicht 500 unabhängige Architekturlinsen."),
 E("GOVERNED_COMPUTE","Governed Compute","operational","Rechenfortsetzung bei veränderten Autoritäts- und Evidenzlagen begrenzen.","substrate",["agents","gpai"]),
 E("TOKEN_CONTINUATION","Token-Level Continuation Admission","operational","Während der Generierung einen abgelaufenen oder widerrufenen Rechenpfad anhalten.","linkedin",["agents","gpai"],"Deterministischer synthetischer Benchmark; keine bestätigte GPU-Energieeinsparung."),
 E("POCKET_ENTERPRISE","Pocket Enterprise","operational","Governed mobile Orchestrierung einer ereignisgetriebenen Unternehmensumgebung.","works",["agents"]),
 E("FIVE_ENGINES","Five-Engine Enterprise Integration","operational","Bestehende fünf Engines gemeinsam nutzen; keine sechste Engine.","omnibus",["agents"]),
 E("EPHEMERAL_WORKERS","Ephemeral Capability-Scoped Workers","operational","Begrenzte Worker-Ausführung mit Zuständigkeit, TTL, Evidence und Readback.","works",["agents"]),
 E("OWN_EXECUTION_RUNNER","PIGA Own Execution Runner","operational","Ticket-Claim, bounded Execution, Evidenz, Ergebnis und Reverse-Abschluss.","works",["agents"]),
 E("SELF_HEALING","PIGA Self-Healing & Fail-Closed Restore","operational","Wiederherstellung nur unter aktualisierter Autorität und nachvollziehbaren Ereignissen.","works",["agents"]),

 // Distinct scholarly models and theoretical components with author/Zenodo DOI records.
 E("SRI","Semantic Risk Indicators (SRI)","research","Vorregulatorische Indikatoren für semantische Entropie, Vertrauenslücken und Referenzverlust.","17944205"),
 E("MAC","Metaphysical–Algorithmic Coherence (MAC)","research","Theoretische Kopplung von Kohärenz und digitalen Identitätskernen.","17615472"),
 E("DIGITAL_EMBRYOGENESIS","Digital Epistemic Embryogenesis","research","Theoretisches Entwicklungsmodell für die Entstehung epistemischer Identitätsstrukturen.","17614898"),
 E("RECOGNITION_THRESHOLD","Recognition Threshold","research","Theoretischer Übergang zu kultureller und digitaler Wiedererkennbarkeit.","17620607"),
 E("SEMANTIC_READINESS","Semantic Readiness / Meaning Stability","research","Prüfung, wann ein Bedeutungsraum ausreichend stabil beschrieben ist.","18404508"),
 E("COMPUTATIONAL_SILENCE","Computational Silence / Valid Non-Execution","research","Nichtausführung bei fehlender Legitimität als eigener Systemzustand.","18511577",["all"],"Fail-closed-Prinzip; unterscheidet sich von beobachtbarem und belegtem VBR."),
 // Public specifications as operational metadata, not a release of licensed implementations.
 E("ASOSE_ACTIVATION","ASOSE Activation Protocol","operational","Eingrenzung des epistemischen Kontexts für verantwortbare Mensch–KI-Kollaboration.","17944528"),
 E("FAIL_CLOSED_02","Pre-Inference-02 · Fail-Closed Conditions","operational","Kanonische Nichteintrittsbedingungen für Inferenz und konsekutive Aktionen.","18511577"),
 E("ASOSE_BOUNDARY_02","ASOSE-02 · Semantic Boundary Integrity","operational","Bedeutungskategorien auseinanderhalten und semantische Überschreitungen sichtbar machen.","18511809"),
 E("JAQ_HUMAN_02","JAQ-02 · Human Intervention Sufficiency","operational","Echte Eingriffsmacht von bloßer menschlicher Anwesenheit unterscheiden.","18511865"),
 E("CITR_01","CITR-01 · Canonical Infrastructure Term Record","operational","Autorisierungsbegriff und Terminologie von Pre-Inference Governance fixieren.","18814517"),
 E("SEMANTIC_ROUTING","Semantic Routing / Action Semantics Register","operational","Aktions- und Bedeutungsobjekte konsistent erfassen und nur bei angemessener semantischer Bereitschaft routen.","17978701"),
 E("ACTION_REGISTER","ASiSO Action Register / Risk Class Routing","operational","Unterschiedliche Aktionstypen einer Anwendung in gesonderte Oversight-Klassen einordnen.","17978701"),
 E("LEGAL_BOUNDARY","Architecture ≠ Consequence Boundary","operational","Konzeptionelles Modell, rechtliche Zulässigkeit, Implementierung und Handlung getrennt halten.","19521026"),
 // Sectoral extensions are not additional canonical universal lenses.
 E("ASISO_BANKING","ASiSO-B · Banking","sector","Bankenspezifische Oversight- und semantische Reifevorprüfung.","17979109",["all","high-risk"]),
 E("ASISO_INDUSTRY","ASiSO-I · Industrial AI","sector","Safety- und operationsorientierte Übersetzung für Industrie und Automation.","17979328",["all","critical"]),
 E("ASISO_HEALTHCARE","ASiSO in Healthcare","sector","Action-specific Oversight für klinische KI-Entscheidungen.","17980364",["all","high-risk"]),
 E("ASISO_GOVTECH","ASiSO in Public Administration","sector","Berechtigung und Entscheidungskontrolle im öffentlichen Sektor.","17980220",["all","high-risk"]),
 E("ASISO_REGULATORS","ASiSO Regulators / Supervisors","sector","Sicht von Aufsicht und institutioneller Prüfverantwortung.","17979950"),
 E("ASISO_SME","ASiSO-Light / ASOSE-Light","sector","Minimalpfad für KMU unter gleichen semantischen und Governance-Grundsätzen.","17979833"),
 E("MEDICAL_ROBOTICS","Pre-Inference Governance in Medical Robotics","sector","Vorgelagerte Zulässigkeit von physisch wirksamen KI-Roboteraktionen.","18261111",["critical","high-risk"]),
 E("ONCOLOGY_PROOFDOMAIN","Oncology State-Transition Proof Domain","sector","Nichtklinische Systemtheorie zur begrenzten Übertragung von Zustandsmodellen.","18816143",["all"],"Kein medizinisches Diagnose- oder Therapieinstrument."),
 E("CRITICAL_INFRASTRUCTURE","Critical Infrastructure Admission","sector","Autoritätsprüfung vor externen Effekten in kritischen Infrastrukturen.","18261884",["critical","high-risk"]),
 E("FINANCIAL_MARKETS","Financial Systems Prior Admissibility","sector","Vorgelagerte Zulässigkeit risikowirksamer Finanz- und Marktaktionen.","18262182",["critical","high-risk"]),
 E("MILITARY_USE_RESTRICTION","High-Consequence Defence / Use-of-Force Governance","sector","Forschungsbezogene Klassifikation von Zulässigkeit; keine Implementierung von Gewaltanwendung.","18262032",["critical"],"Nur beschreibende Rechte- und Risikoabgrenzung, keine operative Anleitung."),
 E("LICENSING_SCOPE","Scope-Bound Licensing & Rights Boundary","operational","Öffentliche Orientierung und lizenzgebundene Implementierung rechtlich trennen.","works")
]);
const uniqueIds=new Set(architectureCatalog.map(x=>x.id));
if(uniqueIds.size!==architectureCatalog.length)throw Error("Architecture registry contains duplicate IDs");
if(architectureCatalog.filter(x=>x.family==="canonical").length!==13)throw Error("Canonical resolver must contain 13 identifiers");
export const portfolioSummary=Object.freeze({
 canonical:architectureCatalog.filter(x=>x.family==="canonical").length,
 research:architectureCatalog.filter(x=>x.family==="research").length,
 operational:architectureCatalog.filter(x=>x.family==="operational").length,
 sector:architectureCatalog.filter(x=>x.family==="sector").length,
 indexed:architectureCatalog.length,
 scope:"Catalogued public/metadata layer, not claim of executing all lenses"
});
export function portfolioForSubject(subject={}){
 const tags=new Set(["all"]);
 if(subject.highRisk)tags.add("high-risk");
 if(subject.agents)tags.add("agents");
 if(subject.critical)tags.add("critical");
 if(subject.gpai)tags.add("gpai");
 if(subject.bot)tags.add("synthetic");
 if(subject.prohibited)tags.add("critical");
 return architectureCatalog.map(x=>({
  ...x,
  relevance:x.tags.some(t=>tags.has(t))?"CORE_OR_CONTEXT":"OPTIONAL_CONTEXT",
  verification:"PORTFOLIO_REFERENCE_ONLY",
  case_status:"NOT_INDEPENDENTLY_EVALUATED",
  owner_licence_required_for_implementation:true
 }));
}
