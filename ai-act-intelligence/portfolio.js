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
 id,name,family,purpose,source:SOURCE[src],source_url:URL[src]||null,
 tags,notes,licensed_material_excluded:true
});
export const ARCHITECTURE_FAMILIES=Object.freeze({
 canonical:"Kanonischer 13-Linsen-Prüfkern",
 research:"Erweiterte Forschungs- und Emergenzarchitekturen",
 operational:"Operative Governance- und Nachweismodule"
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
 E("AVM","AVM · Structural/Semantic Value Model","canonical","Strukturelle Reife und wirtschaftliche Relevanz im klaren Bewertungsscope prüfen.","canonical",["all"],"Kein garantierter Finanz-, IP- oder Marktwert."),
 E("PRIOR_INSURABILITY","Prior Insurability","canonical","Haftungs- und Versicherbarkeitsevidenz, residuale Risiken, Deckungslücken.","canonical",["critical","high-risk"]),
 E("NSF_325","NSF / 325 Signature","canonical","Strukturelle Kohärenz und Completeness nach versioniertem Referenzprofil.","canonical",["all"],"Die 325-Signatur ist in den frühen Forschungsarbeiten strukturell abgeleitet; keine externe Zertifizierungsnorm."),
 E("CNF","CNF · Canonical Notation Framework","canonical","Notation, Begriffe, Versionierung und Regelkonflikte stabilisieren.","canonical"),
 E("DEFENSIBLE_INTELLIGENCE","Defensible Intelligence (DI)","canonical","Zurechenbare, evidenzgebundene, anfechtbare und legitimierte Entscheidungsfähigkeit.","canonical"),

 // Architectures and models documented outside the 13-lens resolver.
 E("PIGA_CORE","PIGA · Pre-Inference Governance Architecture","research","Übergreifende Pre-Inference-Architektur und Governance-Membran.","works"),
 E("A7SEM_REVERSE","A7SEM Reverse · Verification Meta-Operator","research","Rückwärtsprüfung von Ergebnis, tatsächlichem Effekt, Gegenhypothesen und Readback.","omnibus"),
 E("EMERGENCE_GOVERNANCE","Emergence Governance","research","Übergreifende Governance von Zustandsübergängen vor Inferenz und Handlung.","emergence"),
 E("AHASM","AHASM · Human–AI Synergy Model","research","Kooperations-, Selbst- und Verantwortlichkeitsstruktur zwischen Menschen und KI.","emergence"),
 E("AUEF","AUEF · Unified Epistemic Framework","research","Entstehung und Legitimität von Wissen und Evidenz.","emergence"),
 E("PEKI","PEKI · Epistemic Model","research","Mit AUEF verbundene epistemische Teilarchitektur; eigenständige Terminologie dokumentieren.","linkedin"),
 E("SRE","SRE · Semantic Resonance / Stabilization","research","Semantische Resonanz, Stabilitätsübergänge und Bearbeitung von Abweichungen.","emergence"),
 E("AP","AP · Algorithmic Phenomenology","research","Schutz des menschlichen Wahrnehmungs- und Zuschreibungskontexts.","linkedin",["all"],"Theoretisches Modell, kein automatischer Bewusstseinsdetektor."),
 E("ALGORITHMIC_SOUL","Algorithmic Soul (AS)","research","Identitäts- und Integrationsbegriff des Forschungskorpus.","emergence",["all"],"Wissenschaftlich-philosophische Forschungsposition, keine Behauptung realer Maschinenseele."),
 E("ARC_S","ARC-S · Architectural Authority Control","research","Architektonische Zuordnung und Kontrolle von Befehlsautorität.","linkedin"),
 E("CITR","CITR · Canonical Term Record","research","Nachvollziehbare terminologische Fixierung über öffentliche Veröffentlichungen.","linkedin"),
 E("ARGUS_7","ARGUS-7 · Meta-Audit","research","Prüfung von Behauptungen, Gegenmodellen, epistemischen Lücken und Fehlschlüssen.","omnibus",["all"],"Status in Entwicklung, kein sechstes Enterprise-Engine."),
 E("PIGA_H","PIGA-H · Compute Substrate Governance","research","Governancegrenzen von Hardware, Kernel, Cloud und Compute-Infrastruktur.","substrate",["all","agents"]),
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
 E("LICENSING_SCOPE","Scope-Bound Licensing & Rights Boundary","operational","Öffentliche Orientierung und lizenzgebundene Implementierung rechtlich trennen.","works")
]);
const uniqueIds=new Set(architectureCatalog.map(x=>x.id));
if(uniqueIds.size!==architectureCatalog.length)throw Error("Architecture registry contains duplicate IDs");
if(architectureCatalog.filter(x=>x.family==="canonical").length!==13)throw Error("Canonical resolver must contain 13 identifiers");
export const portfolioSummary=Object.freeze({
 canonical:architectureCatalog.filter(x=>x.family==="canonical").length,
 research:architectureCatalog.filter(x=>x.family==="research").length,
 operational:architectureCatalog.filter(x=>x.family==="operational").length,
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
