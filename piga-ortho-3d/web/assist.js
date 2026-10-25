'use strict';(()=>{
const $=id=>document.getElementById(id),stages=5;
const flags=['Engstand','Lückenstand','Kreuzbiss-Verdacht','Offener Biss','Tiefer Biss','Vergrößerter sagittaler Überbiss','Negativer sagittaler Überbiss','Zähneknirschen / Bruxismus','Dentitionsstörung','Habits','Platzmangel','Retentionsfrage','Kiefergelenkbeschwerden','Asymmetrie','Mundatmung','Trauma / Risikofaktor'];
const therapy=[['fixed','Festsitzende Apparatur / Brackets'],['removable','Herausnehmbare Apparatur'],['aligner','Aligner / Schienentherapie'],['retainer','Retention / Retainer'],['functional','Funktionskieferorthopädie'],['space','Lückenhalter'],['expand','Gaumennahterweiterung'],['referral','Interdisziplinäre Abklärung'],['observe','Verlaufskontrolle / keine Therapieentscheidung']];
const tasks=[
 ['TEAM','Scanner prüfen und eindeutige Dateikennung dokumentieren','Ohne echte Patientendaten in dieser Evaluation'],
 ['TEAM','Modell- und Einheitennachweis technisch kontrollieren','Maßstab, geometrische Defekte und Geräteversion protokollieren'],
 ['TEAM','Anamnese- und Befundunterlagen für die Fachprüfung vorbereiten','Kein eigenständiges Stellen einer Diagnose'],
 ['ARZT','Klinische Untersuchung und KIG persönlich feststellen','Falls erforderlich; KIG nicht automatisch bestimmen'],
 ['ARZT','Therapieindikation, Risiken, Gerät und Einwilligung freigeben','Kein Modell allein entscheidet über Brackets, Aligner oder lose Spange'],
 ['TEAM','Labor-/CAD-Auftrag anhand ärztlicher Planung vorbereiten','Nur nach ausreichender Freigabe und geeigneter Software'],
 ['ARZT','Behandlungsmittel und Druckversion vor Ausführung freigeben','PIGA Gate 2 bleibt BLOCK bis zur gesonderten Autorisierung'],
 ['TEAM','EBZ-/KIM-Unterlagen im angeschlossenen PVS vorbereiten','Keine direkte Krankenkassenübermittlung aus dieser App'],
 ['ARZT','BEMA-/GOZ-/BEL-Positionen prüfen und signieren','Nur real erbrachte und zulässige Leistungen abrechnen']
];
const codes=[["01k","Kieferorthopädische Untersuchung","Untersuchung, ärztliche Anamnese und KIG ggf. dokumentieren"],["5","Kieferorthopädische Behandlungsplanung","Befundorientierter Plan, Aufklärung, Dokumentation; Ausschlüsse beachten"],["7a","Abformung / Bissnahme diagnostisches Modellpaar","Leistungsinhalt und Dokumentation prüfen"],["116","Profil-/En-face-Fotografie","Je Aufnahme mit diagnostischer Auswertung; Mengenbegrenzung"],["117","Dreidimensionale Modellanalyse","Nur bei erfülltem Leistungsinhalt je Nr. 7a; Mengenbegrenzung"],["118","Fernröntgenanalyse","Ärztliche Indikation / Dokumentation und erforderliche Aufnahme"],["119a","Kieferumformung einfach","Schwierigkeitsbestimmung und Genehmigung prüfen"],["119b","Kieferumformung mittelschwer","Schwierigkeitsbestimmung und Genehmigung prüfen"],["119c","Kieferumformung schwierig","Schwierigkeitsbestimmung und Genehmigung prüfen"],["119d","Kieferumformung besonders schwierig","Schwierigkeitsbestimmung und Genehmigung prüfen"],["120a","Einstellung Unterkiefer einfach","Sagittal/lateral; dokumentierte Einstufung"],["120b","Einstellung Unterkiefer mittelschwer","Sagittal/lateral; dokumentierte Einstufung"],["120c","Einstellung Unterkiefer schwierig","Sagittal/lateral; dokumentierte Einstufung"],["120d","Einstellung Unterkiefer besonders schwierig","Sagittal/lateral; dokumentierte Einstufung"],["121","Habitbehandlung","Leistungsvoraussetzungen und KIG prüfen"],["122a","Kontrolle des Behandlungsverlaufs","Leistungsinhalt, Zeit und Änderung dokumentieren"],["122b","Vorbereitung KFO-Behandlungsmittel","Je Kiefer; Leistungsinhalt und tatsächliche Ausführung"],["122c","Einfügen KFO-Behandlungsmittel","Je Kiefer; tatsächliche Eingliederung"],["123a","Lückenhalter bei vorzeitigem Milchzahnverlust","Indikation und betroffenes Kiefersegment prüfen"],["123b","Kontrolle Lückenhalter","Behandlungsquartal / Voraussetzungen prüfen"],["124","Einschleifen Milchzähne bei Kreuz-/Zwangsbiss","Zahnangabe, Indikation und Einwilligung"],["125","Wiederherstellung Behandlungsmittel","Tatsächliche Wiederherstellung / Kiefer"],["126a","Bracket / Attachment eingliedern","Tatsächliche Maßnahme, Material und Ausschlüsse"],["126b","Band eingliedern","Tatsächliche Maßnahme, Material und Ausschlüsse"],["126c","Band wiedereingliedern","Tatsächliche Maßnahme dokumentieren"],["126d","Band / Bracket / Attachment entfernen","Tatsächliche Maßnahme dokumentieren"],["127a","Teilbogen einsetzen","Material und tatsächliche Eingliederung"],["127b","Teilbogen ausgliedern","Tatsächliche Maßnahme dokumentieren"],["128a","Vollbogen konfektioniert einsetzen","Tatsächliche Eingliederung dokumentieren"],["128b","Vollbogen individualisiert einsetzen","Tatsächliche Eingliederung dokumentieren"],["128c","Vollbogen ausgliedern","Je Bogen; tatsächliche Maßnahme dokumentieren"],["129","Voll-/Teilbogen wiedereingliedern","Leistungsinhalt / tatsächliche Durchführung"],["130","Ergänzende festsitzende Apparatur","Anwendungsfall und Material- / Laborkosten berücksichtigen"],["131a","Gaumennahterweiterungsapparatur","Ein-/Ausgliederung, ärztliche Indikation"],["131b","Festsitzende Apparatur Bisslagekorrektur","Spezifische Voraussetzungen, ärztliche Indikation"],["131c","Gesichtsmaske","Ärztliche Indikation und reale Behandlung"]];
let i=0;const chosenFlags=()=>[...document.querySelectorAll('[data-observation]:checked')].map(el=>el.value);
const chosenTherapy=()=>[...document.querySelectorAll('[data-therapy]:checked')].map(el=>el.value);
function draw(){
 for(let k=0;k<stages;k++){const s=$('slide'+k);s.hidden=k!==i;}
 $('stepNo').textContent='SCHRITT '+(i+1)+' VON '+stages;
 $('stepPercent').textContent=Math.round((i+1)*100/stages)+' %';
 $('progressBar').style.width=((i+1)*100/stages)+'%';
 document.querySelectorAll('[data-go]').forEach(x=>{if(Number(x.dataset.go)===i)x.setAttribute('aria-current','step');else x.removeAttribute('aria-current');});
 $('back').disabled=i===0;$('next').textContent=i===stages-1?'Erneut beginnen ↺':'Weiter →';
 $('skip').disabled=i===stages-1;
 if(i===3)drawTasks();
 if(i===4)renderCodes();
}
function go(n){i=(n+stages)%stages;draw();}
document.querySelectorAll('[data-go]').forEach(x=>x.addEventListener('click',()=>go(Number(x.dataset.go))));
$('back').onclick=()=>go(i-1);$('next').onclick=()=>go(i+1);$('skip').onclick=()=>go(i+1);
let touch=null;document.querySelector('.stepper').addEventListener('touchstart',e=>{if(e.touches.length===1)touch={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});
document.querySelector('.stepper').addEventListener('touchend',e=>{if(!touch||!e.changedTouches[0])return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;touch=null;if(Math.abs(dx)>70&&Math.abs(dy)<60)go(i+(dx<0?1:-1));},{passive:true});
function node(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt)e.textContent=txt;return e;}
const obs=$('observationChoices');flags.forEach(f=>{const label=node('label');const input=node('input');input.type='checkbox';input.value=f;input.dataset.observation='true';label.append(input,document.createTextNode(f));obs.append(label);});
const options=$('therapyOptions');therapy.forEach(([key,title])=>{const label=node('label');const inp=node('input');inp.type='checkbox';inp.value=key;inp.dataset.therapy='true';label.append(inp,node('b','',title),node('span','','Nur zur ärztlichen Diskussion und persönlichen Prüfung'));options.append(label);});
function drawTasks(){
 const root=$('tasks');root.textContent='';
 tasks.forEach(([who,title,description],index)=>{const row=node('div','task');if(who==='ARZT')row.setAttribute('aria-disabled','true');row.append(node('span','',who),(()=>{const x=node('div');x.append(node('strong','',title),node('small','',description));return x;})());root.append(row);});
}
function renderCodes(){
 const q=$('codeSearch').value.toLowerCase().trim();const rows=codes.filter(a=>a.join(' ').toLowerCase().includes(q)).slice(0,80);
 const root=$('codeList');root.textContent='';
 if(!rows.length){root.append(node('p','','Keine passenden BEMA-Positionen.'));return;}
 rows.forEach(([code,title,rule])=>{const row=node('div','code-row');row.append(node('b','',code),(()=>{const x=node('div');x.append(node('strong','',title),node('small','',rule));return x;})());root.append(row);});
}
$('codeSearch').addEventListener('input',renderCodes);
function snapshot(){return {schema:'piga-ortho-clinician-review-draft.v1',createdAt:new Date().toISOString(),testOnly:true,noPatientData:true,selectedSyntheticModel:document.querySelector('[name=model]:checked')?.value||'unknown',observationsForClinician:chosenFlags(),optionsForClinicalDiscussion:chosenTherapy(),kig:'UNKNOWN',diagnosis:'NOT_ASSIGNED',therapeuticDecision:'NOT_AUTHORIZED',pigaGate1:'DELAY',pigaGate2:'BLOCK',bema:'NOT_BILLABLE_UNTIL_PROVEN_AND_APPROVED',doctorMustReview:true,externalEffects:0,source:'KZBV BEMA 2026; KZBV EBZ/PVS/KIM'};}
$('exportSummary').onclick=()=>{const data=new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'}),u=URL.createObjectURL(data),a=node('a');a.href=u;a.download='PIGA_ORTHO_KFO_PRUEFENTWURF.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);};
$('emailOwner').onclick=()=>{
 const subject='PIGA ORTHO 3D – Prüfstatus / keine Patientendaten';
 const body='Lieber Herr Dr. Akarkach,\n\nEin neuer technischer Prüfentwurf ist vorbereitet. Es werden keine Patienten- oder Gesundheitsdaten übermittelt.\n\nBefund, KIG, Therapie und Abrechnung warten auf Ihre persönliche Prüfung.\n\nMit freundlichen Grüßen\nPIGA\nim Auftrag von Mounir Akarkach';
 if(window.PigaNative?.composeOwnerEmail){window.PigaNative.composeOwnerEmail(subject,body);}
 else window.location.href='mailto:dr.akarkach@gmx.de?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
};
draw();
})();