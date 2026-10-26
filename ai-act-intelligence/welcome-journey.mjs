// Public, privacy-preserving customer guidance. No tracking, storage or payment side effects.
// Case-specific offers remain exclusively with the existing PIGA assessment/offer engine.
const STATES=new Set(["ALLOW","DELAY","BLOCK","UNKNOWN","EXPIRED"]);
const status=value=>STATES.has(String(value||"").trim().toUpperCase())?String(value).trim().toUpperCase():"UNKNOWN";
export function guidanceFor({gate1,gate2,isDemo=false}={}){
 if(isDemo)return {heading:"Dies ist ein Muster – keine Bewertung Ihrer KI.",explanation:"Der Beispielbericht zeigt nur, wie eine Auswertung aussieht. Ein fallbezogener Maßnahmenplan und passende Fachleistungen entstehen erst nach Ihrer eigenen kostenlosen Voranalyse.",next:"Eigene KI kostenlos prüfen",destination:"assessment",note:"Keine individuelle Produktempfehlung aus einem Musterfall."};
 const a=status(gate1),b=status(gate2);
 if(a==="BLOCK"||b==="BLOCK")return {heading:"Vor der nächsten Wirkung sind Voraussetzungen zu klären.",explanation:"Mindestens ein PIGA-Gate steht auf BLOCK. Das ist keine automatische Aussage über die Rechtmäßigkeit Ihres Systems. Prüfen Sie die konkreten offenen Punkte, Zuständigkeiten und Nachweise im Bericht.",next:"Offene Punkte und Maßnahmen prüfen",destination:"solutions",note:"Eine kostenpflichtige Fachleistung ist optional; die Vorprüfung bleibt unabhängig vom Kauf."};
 if(a==="EXPIRED"||b==="EXPIRED")return {heading:"Die bisherige Prüfgrundlage muss erneuert werden.",explanation:"Mindestens eine Admission ist abgelaufen. Prüfen Sie die aktuelle Systemversion, Berechtigungen und die Gültigkeit der Evidenz, bevor Sie eine neue Entscheidung treffen.",next:"Erforderliche Nachweise ansehen",destination:"solutions",note:"Ein Angebot ersetzt weder die erneute Prüfung noch eine Freigabe."};
 if(a==="UNKNOWN"||b==="UNKNOWN")return {heading:"Die nächsten Fragen sind noch offen.",explanation:"Die vorliegenden Angaben reichen für mindestens eine Gate-Entscheidung noch nicht aus. Der Maßnahmenplan erklärt, welche Informationen oder Nachweise Sie als Nächstes prüfen sollten.",next:"Fehlende Evidenz klären",destination:"solutions",note:"UNKNOWN ist keine Freigabe und kein Nachweis eines Rechtsverstoßes."};
 if(a==="DELAY"||b==="DELAY")return {heading:"Sie haben eine erste Einordnung – jetzt die Evidenz vervollständigen.",explanation:"Eine Entscheidung ist bis zu weiteren Prüfungen zurückgestellt. Im Maßnahmenplan finden Sie die nächsten fachlichen Schritte und die dazu erwarteten Nachweise.",next:"Nächste Schritte priorisieren",destination:"solutions",note:"DELAY bedeutet nicht automatisch, dass Ihr KI-System rechtswidrig ist."};
 return {heading:"Die Vorprüfung ist ein Ausgangspunkt, kein Zertifikat.",explanation:"Auch bei ALLOW im geprüften Umfang bleiben Anwendungszweck, Version, Nachweise und rechtliche Gesamtbewertung relevant. Der Maßnahmenplan macht die Grenzen der Prüfung sichtbar.",next:"Prüfumfang und nächste Schritte ansehen",destination:"solutions",note:"ALLOW ist keine generelle EU-AI-Act-Konformitätsbescheinigung."};
}
const AUDIENCES=Object.freeze({
 provider:{role:"provider",copy:"Sie entwickeln oder vertreiben KI? Starten Sie mit Zweck, Produktversion, Risikoeinordnung und den Nachweisen für Ihre Anbieterpflichten."},
 deployer:{role:"deployer",copy:"Sie setzen KI in Ihrer Organisation ein? Beginnen Sie mit Einsatzkontext, Verantwortlichkeiten, menschlicher Aufsicht und dokumentierten Kontrollen."},
 both:{role:"both",copy:"Sie sind zugleich Anbieter und Betreiber? Die Voranalyse hilft, beide Verantwortungsbereiche getrennt zu erfassen und offene Nachweise zu erkennen."}
});
function startWelcomeJourney(){
 const feedback=document.getElementById("audience-context"),roleInput=document.getElementById("f-role");
 document.querySelectorAll("[data-audience]").forEach(button=>{
  button.addEventListener("click",()=>{
   const choice=AUDIENCES[button.dataset.audience];if(!choice)return;
   document.querySelectorAll("[data-audience]").forEach(other=>other.setAttribute("aria-pressed",String(other===button)));
   if(roleInput){roleInput.value=choice.role;roleInput.dispatchEvent(new Event("change",{bubbles:true}));}
   if(feedback)feedback.textContent=choice.copy+" Ihre Auswahl wird erst beim Absenden der Analyse verarbeitet.";
  });
 });
 const result=document.getElementById("result-content"),heading=document.getElementById("result-guide-heading"),explanation=document.getElementById("result-guide-explanation"),note=document.getElementById("result-guide-note"),cta=document.getElementById("result-guide-cta");
 if(!result||!heading||!explanation||!note||!cta)return;
 const read=id=>document.getElementById(id)?.textContent?.trim()||"";
 const update=()=>{
  if(result.classList.contains("hidden")||!read("result-title"))return;
  const info=guidanceFor({gate1:read("gate1"),gate2:read("gate2"),isDemo:read("report-ref").includes("MUSTERBERICHT")});
  heading.textContent=info.heading;explanation.textContent=info.explanation;note.textContent=info.note;
  cta.textContent=info.next+" →";cta.dataset.go=info.destination;
 };
 const observer=new MutationObserver(update);
 observer.observe(result,{attributes:true,attributeFilter:["class"]});
 for(const id of ["gate1","gate2","result-title","report-ref"]){
  const node=document.getElementById(id);if(node)observer.observe(node,{characterData:true,childList:true,subtree:true});
 }
 update();
}
if(typeof document!=="undefined"){
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",startWelcomeJourney,{once:true});
 else startWelcomeJourney();
}
