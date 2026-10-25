import {createClient} from "https://esm.sh/@supabase/supabase-js@2.78.0?bundle";
import {evaluate,articleCatalog,TERMS,PRODUCTS,LAW_URL,LAW_VERSION} from "./engine.js";
import {architectureCatalog,portfolioSummary,ARCHITECTURE_FAMILIES} from "./portfolio.js";
import {publicationCatalog,publicationCategories,publicationSummary} from "./publications.js";
import {priceLabel,offersForReport,actionPlan,executiveFinding} from "./journey.js";

const HOSTED_APP="https://mounirakarkach04-pixel.github.io/ados/ai-act-intelligence/";
const isNativeShell=location.protocol==="capacitor:"||location.protocol==="ionic:"||((location.hostname==="localhost"||location.hostname==="127.0.0.1")&&location.protocol==="https:")||window.Capacitor?.isNativePlatform?.()===true;
const accountEmailRedirect=isNativeShell?HOSTED_APP+"#account":location.origin+location.pathname+"#account";
const isVerifiedCheckoutReturnHost=location.origin==="https://mounirakarkach04-pixel.github.io"&&location.pathname.startsWith("/ados/ai-act-intelligence/");
const client=createClient("https://sanrkcovmkkhgdqydxfk.supabase.co","sb_publishable_GWNQHoz-ML6wphVEyXz0pA_TLuNDzDQ",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const escapeHTML=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const small=(text,cls="")=>'<span class="pill '+cls+'">'+escapeHTML(text)+'</span>';
const readableStatus=code=>({
 EVIDENCE_REQUIRED:"Nachweis fehlt",
 SELF_DECLARED_UNVERIFIED:"Angabe nicht geprüft",
 POTENTIAL_PROHIBITION:"Verbotsrisiko prüfen",
 NOT_ASSESSED:"Gesondert prüfen",
 UNKNOWN:"Unklar",DELAY:"Zurückgestellt",BLOCK:"Nicht freigegeben",
 GAPS:"Lücke offen",REVIEW_REQUIRED:"Prüfung offen",
 MISSING_EVIDENCE:"Beleg fehlt",UNVERIFIED_UPLOAD:"Noch nicht geprüft",
 NOT_VERIFIED:"Nachweis offen",UNDERWRITING_REQUIRED:"Fachprüfung offen",
 DOCUMENTED:"Erfasst",SELF_REPORTED:"Selbstauskunft"
})[String(code)]||String(code);
const gateBadge=x=>small(readableStatus(x),x==="BLOCK"?"danger":x==="UNKNOWN"||x==="DELAY"?"warn":"");
const titles={home:"Übersicht",assessment:"Neue Analyse",results:"Ergebnis & Ladder",articles:"Artikel-Explorer",portfolio:"PIGA Gesamtarchitektur",publications:"Zenodo-Forschungsbibliothek",licensing:"Angebote & Lizenzen",solutions:"Lösungen",account:"Konto & Nachweise"};
let user=null,activeReport=null,activeInput=null,activeId=null,selectedFiles=[],docRecords=[],toastTimer,recoveryMode=false,wizardStep=1,selectedSku=null;
const PAYMENT_INTENT_KEY="piga-aiact-pending-offer";
function pendingOffer(){try{const sku=localStorage.getItem(PAYMENT_INTENT_KEY);return PRODUCTS.some(p=>p.sku===sku)?sku:null;}catch{return null;}}
function rememberOffer(sku){if(!PRODUCTS.some(p=>p.sku===sku))return;selectedSku=sku;try{localStorage.setItem(PAYMENT_INTENT_KEY,sku);}catch{}}
function clearOffer(){selectedSku=null;try{localStorage.removeItem(PAYMENT_INTENT_KEY);}catch{}}
function toast(message){const el=$("toast");el.textContent=String(message);el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),4700);}
function show(view){
 if(!titles[view])view="home";
 $("more-sheet").classList.add("hidden");
 $("nav-more").setAttribute("aria-expanded","false");
 document.querySelectorAll(".view").forEach(e=>e.classList.toggle("hidden",e.id!=="view-"+view));
 document.querySelectorAll(".nav-item").forEach(e=>e.classList.toggle("active",e.dataset.view===view));
 $("current-title").textContent=titles[view];
 const stage={"home":0,"assessment":1,"results":2,"solutions":3,"licensing":5,"account":4}[view]??0;
 document.querySelectorAll("#journey-strip .journey-step").forEach((el,i)=>el.classList.toggle("on",i<=stage));
 if(view==="solutions")renderSolutions();
 if(view==="articles")renderArticles();
 if(view==="portfolio")renderPortfolio();
 if(view==="publications")renderPublications();
 if(view==="licensing")loadEntitlements();
 if(view==="account")renderAuth();
 history.replaceState(null,"","#"+view);
 scrollTo({top:0,behavior:"instant"});
}
document.querySelectorAll("[data-view]").forEach(e=>e.addEventListener("click",()=>show(e.dataset.view)));
document.querySelectorAll("[data-go]").forEach(e=>e.addEventListener("click",()=>show(e.dataset.go)));
$("nav-more").addEventListener("click",()=>{const open=$("more-sheet").classList.toggle("hidden")===false;$("nav-more").setAttribute("aria-expanded",String(open));});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){$("more-sheet").classList.add("hidden");$("nav-more").setAttribute("aria-expanded","false");}});
document.addEventListener("pointerdown",e=>{if(!e.target.closest("#more-sheet, #nav-more")){$("more-sheet").classList.add("hidden");$("nav-more").setAttribute("aria-expanded","false");}});
function setWizardStep(n){
 wizardStep=Math.min(4,Math.max(1,n));
 document.querySelectorAll("[data-assessment-step]").forEach(el=>el.classList.toggle("hidden",Number(el.dataset.assessmentStep)!==wizardStep));
 document.querySelectorAll("[data-step-jump]").forEach(el=>{const i=Number(el.dataset.stepJump);el.classList.toggle("active",i===wizardStep);el.classList.toggle("completed",i<wizardStep);});
 $("wizard-back").hidden=wizardStep===1;
 $("wizard-next").hidden=wizardStep===4;
 $("analyze").hidden=wizardStep!==4;
}
function wizardCurrentValid(){
 const panel=document.querySelector('[data-assessment-step="'+wizardStep+'"]');
 for(const field of panel?.querySelectorAll("[required]")||[]){
  if(!field.checkValidity()){field.reportValidity();field.focus();return false;}
 }
 return true;
}
$("wizard-next").addEventListener("click",()=>{if(wizardCurrentValid())setWizardStep(wizardStep+1);});
$("wizard-back").addEventListener("click",()=>setWizardStep(wizardStep-1));
document.querySelectorAll("[data-step-jump]").forEach(el=>el.addEventListener("click",()=>{if(Number(el.dataset.stepJump)<=wizardStep)setWizardStep(Number(el.dataset.stepJump));}));
setWizardStep(1);

$("sign-header").addEventListener("click",()=>show(user?"account":"account"));
window.addEventListener("hashchange",()=>{const v=location.hash.slice(1);if(titles[v])show(v);});
const keys=["literacy","risk","data","technical","logs","transparency","oversight","robustness","quality","retention","corrective","cooperation","deployer","fr","conformity","declaration","registration","marking","gpai","monitoring","incident"];
$("controls").innerHTML=keys.map(k=>'<label class="check"><input type="checkbox" data-control="'+escapeHTML(k)+'"><span>'+escapeHTML(TERMS[k].label)+' · Art. '+escapeHTML(TERMS[k].article)+'</span></label>').join("");
const inputFields=["title","version","role","developer","purpose","sector"];
const inputFlags=["productSafety","prohibited","gpai","systemic","chatbot","synthetic","agents","critical"];
function gather(){
 const fields=inputFields;
 const f=Object.fromEntries(fields.map(x=>[x,$("f-"+x).value.trim()]));
 for(const k of inputFlags) f[k]=$("f-"+k).checked;
 f.controls={};
 document.querySelectorAll("[data-control]").forEach(x=>{f.controls[x.dataset.control]=x.checked;});
 return f;
}
function restoreInput(f){
 if(!f)return;
 for(const key of inputFields){const field=$("f-"+key);if(field)field.value=String(f[key]??"");}
 for(const key of inputFlags){const field=$("f-"+key);if(field)field.checked=f[key]===true;}
 document.querySelectorAll("[data-control]").forEach(el=>{el.checked=f.controls?.[el.dataset.control]===true;});
 selectedFiles=[];docRecords=[];$("evidence-files").value="";
 $("evidence-list").textContent="Bereits gespeicherte Nachweise bleiben im Bericht referenziert. Für einen neuen Prüfbericht Dateien erneut auswählen.";
}
function fileAllowed(f){
 const ok=["application/pdf","text/plain","text/csv","application/json","text/markdown","image/png","image/jpeg"];
 const ext=/\.(pdf|txt|csv|json|md|png|jpe?g)$/i.test(f.name);
 return f.size<=10485760&&f.size>0&&(ok.includes(f.type)||(!f.type&&ext))&&ext;
}
$("evidence-files").addEventListener("change",e=>{
 const files=Array.from(e.target.files||[]).slice(0,12);
 const reject=files.filter(f=>!fileAllowed(f));
 selectedFiles=files.filter(fileAllowed);
 if(reject.length)toast(reject.length+" Dateien abgewiesen: Nur erlaubte Formate bis 10 MB.");
 $("evidence-list").innerHTML=selectedFiles.length?selectedFiles.map(f=>'<div>▣ '+escapeHTML(f.name)+' · '+(f.size/1024).toFixed(0)+' KB</div>').join(""):"Noch keine Dokumente ausgewählt.";
});
async function sha256(bytes){const digest=await crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");}
async function uploadEvidence(assessmentId){
 const out=[];
 for(const file of selectedFiles){
  const sha=await sha256(await file.arrayBuffer());
  const record={name:file.name,size:file.size,sha256:sha,uploaded:false,path:""};
  if(user){
   const extension=(file.name.split(".").pop()||"bin").toLowerCase();
   const path=user.id+"/"+assessmentId+"/"+crypto.randomUUID()+"."+extension;
   const {error}=await client.storage.from("aiact-evidence").upload(path,file,{upsert:false,contentType:file.type||"application/octet-stream"});
   if(error){toast("Upload "+file.name+": "+error.message);}else {record.uploaded=true;record.path=path;}
  }
  out.push(record);
 }
 return out;
}
$("assessment-form").addEventListener("submit",async e=>{
 e.preventDefault();
 if(wizardStep!==4){setWizardStep(Math.min(wizardStep+1,4));return;}
 const btn=$("analyze");btn.disabled=true;btn.textContent="Prüfung läuft …";
 try{
  const input=gather();activeInput=structuredClone(input);activeId=crypto.randomUUID();
  docRecords=await uploadEvidence(activeId);
  activeReport=evaluate(input,docRecords);
  activeReport.assessment_id=activeId;
  activeReport.input_sha256=await sha256(new TextEncoder().encode(JSON.stringify(input)));
  activeReport.governance="A7SEM → Assessment → Evidence → A7SEM Reverse → Gate 1 → Gate 2 → Result; finite bounded iteration, re-entry on material change";
  activeReport.self_assessment_only=true;
  activeReport.is_demo=false;
  renderReport();
  toast("Vorprüfung erstellt. Nicht als behördliche Konformitätserklärung verwendbar.");
  show("results");
 }catch(err){toast("Analyse nicht abgeschlossen: "+(err?.message||err));}
 finally{btn.disabled=false;btn.innerHTML='Vorprüfung erstellen <span>↗</span>';}
});
function renderReport(){
 const r=activeReport;if(!r)return;
 const finding=executiveFinding(r),plan=actionPlan(r),offers=offersForReport(r);
 $("empty-results").classList.add("hidden");$("result-content").classList.remove("hidden");
 $("result-title").textContent=r.subject.title||"KI-System";
 $("result-summary").textContent=finding?.summary||"Einordnung und Nachweislücken";
 $("report-classification").textContent=finding?.heading||"Risikoeinordnung offen";
 $("report-date").textContent=r.created_at?new Date(r.created_at).toLocaleDateString("de-DE"):"";
 $("report-ref").textContent=(r.is_demo?"MUSTERBERICHT · ":"PIGA / ")+(r.assessment_id||"PREASSESSMENT").slice(0,13).toUpperCase();
 $("gate1").textContent=r.gate1;$("gate2").textContent=r.gate2;
 $("result-heading").textContent=finding?.heading||"Vorläufige Einordnung";
 $("result-narrative").textContent=finding?.summary||"Vervollständigen Sie zunächst die Systembeschreibung.";
 $("result-next-step").textContent=finding?.action||"Verantwortlichkeit und Geltungsbereich klären.";
 $("metric-findings").textContent=String(r.findings?.length||0);
 $("metric-evidence").textContent=String((r.evidence||[]).length);
 $("metric-manual").textContent=String(r.coverage?.remaining_manual_review||0);
 $("metric-proof").textContent=(r.evidence||[]).some(x=>x.uploaded)?"Eingereicht · noch ungeprüft":"Noch nicht unabhängig belegt";
 $("report-document-id").textContent=(r.assessment_id||"PREASSESSMENT").slice(0,21).toUpperCase();
 $("report-system-version").textContent=r.subject?.version||"Nicht angegeben";
 $("report-law-version").textContent=r.law_version||"Quellenabgleich erforderlich";
 $("report-evidence-state").textContent=(r.evidence||[]).some(x=>x.uploaded)?"Dokumente eingereicht · ungeprüft":"Selbstauskunft · ungeprüft";
 $("findings").innerHTML=(r.findings||[]).slice(0,12).map(x=>'<div class="result-row"><div><b>Art. '+escapeHTML(x.article)+' · '+escapeHTML(x.title)+'</b><small>'+escapeHTML(x.issue)+'</small></div>'+small(readableStatus(x.status),x.status==="POTENTIAL_PROHIBITION"?"danger":"warn")+'</div>').join("")||"<p>Weitere Einordnung und Nachweise erforderlich.</p>";
 $("ladder").innerHTML=plan.map((x,i)=>'<details class="ladder-item" '+(i===1||i===4?"open":"")+'><summary><span class="ladder-ordinal">'+String(i+1).padStart(2,"0")+'</span><div><b>'+escapeHTML(x.label.replace(/^\d+\s*[·.-]\s*/,""))+'</b><small>'+escapeHTML(x.kind)+'</small></div>'+gateBadge(x.state)+'</summary><div class="ladder-action"><strong>'+escapeHTML(x.question)+'</strong><p>'+escapeHTML(x.measure)+'</p><small><b>Erwarteter Nachweis:</b> '+escapeHTML(x.proof)+'</small><button type="button" data-ladder-offer="'+escapeHTML(x.sku)+'">Passende Lösung ansehen →</button></div></details>').join("");
 $("ladder").querySelectorAll("[data-ladder-offer]").forEach(button=>button.addEventListener("click",()=>selectOffer(button.dataset.ladderOffer)));
 const priorities=(r.priorities||[]).slice(0,6);
 $("priorities").innerHTML='<ol class="priority-grid">'+priorities.map((x,i)=>'<li><span>'+String(i+1).padStart(2,"0")+'</span><p>'+escapeHTML(x)+'</p></li>').join("")+'</ol>';
 $("reverse").innerHTML=(r.reverse?.questions||[]).map(x=>'<div class="reverse-item">◇ '+escapeHTML(x)+'</div>').join("")+'<p class="subtle">Status: '+escapeHTML(r.reverse?.status)+' · Keine unbelegte Freigabe.</p>';
 if($("architecture-details")?.open)$("architecture").innerHTML=architectureMarkup(r.architecture||architectureCatalog,"");
 else $("architecture").replaceChildren();
 $("case-architecture-count").textContent=String((r.architecture||architectureCatalog).length);
 const featured=offers[0],other=offers.slice(1,4);
 $("recommended-title").textContent=featured?.title||"Governance-Assessment";
 $("recommended-price").textContent=featured?.price||"Preis auf Anfrage";
 $("recommended-why").textContent=featured?.why||"Passende Maßnahmen und nachvollziehbare Nachweise.";
 $("recommended-buy").dataset.offer=featured?.sku||"";
 $("suggestions").innerHTML=other.map(p=>'<div class="result-offer"><div><b>'+escapeHTML(p.title)+'</b><small>'+escapeHTML(p.why)+'</small></div><button type="button" data-suggest="'+escapeHTML(p.sku)+'">'+escapeHTML(p.price)+' →</button></div>').join("");
 $("suggestions").querySelectorAll("[data-suggest]").forEach(b=>b.addEventListener("click",()=>selectOffer(b.dataset.suggest)));
 if(!$("view-solutions").classList.contains("hidden"))renderSolutions();
 $("save-report").disabled=!!r.is_demo;
 $("save-report").title=r.is_demo?"Musterbericht: erst eigene Voranalyse durchführen":"Im persönlichen Konto speichern";
}
function renderSolutions(){
 const r=activeReport;
 $("solutions-empty").classList.toggle("hidden",!!r);
 $("solutions-content").classList.toggle("hidden",!r);
 if(!r)return;
 const plan=actionPlan(r),offers=offersForReport(r);
 $("solutions-subject").textContent=r.subject?.title||"Ihr persönlicher Maßnahmenplan";
 $("solutions-intro").textContent=(r.findings?.length||0)+" fallbezogene Prüfpositionen. "+(r.coverage?.remaining_manual_review||0)+" weitere Normen sind gesondert zu prüfen. Sie entscheiden über die nächsten Schritte.";
 $("solutions-open").textContent=String(plan.filter(x=>x.requiresWork).length);
 $("solutions-plan").innerHTML=plan.map((step,index)=>{
  const offer=PRODUCTS.find(p=>p.sku===step.sku);
  return '<article class="solution-step"><div class="solution-top"><span class="solution-num">'+String(index+1).padStart(2,"0")+'</span><div class="solution-title">'+escapeHTML(step.label.replace(/^\d+\s*[·.-]\s*/,""))+'</div><span class="solution-state">'+escapeHTML(step.state)+'</span></div>'+
   '<h3>'+escapeHTML(step.question)+'</h3><p>'+escapeHTML(step.measure)+'</p>'+
   '<div class="solution-proof"><b>Benötigter Nachweis:</b> '+escapeHTML(step.proof)+'</div>'+
   (offer?'<button type="button" data-solution="'+escapeHTML(offer.sku)+'">Passende Fachleistung: '+escapeHTML(offer.title)+' →</button>':'')+'</article>';
 }).join("");
 $("solutions-offers").innerHTML=offers.slice(0,3).map((p,i)=>
  '<div class="solution-offer"><div><b>'+(i===0?"Empfohlen · ":"")+escapeHTML(p.title)+'</b><span>'+escapeHTML(p.why)+'</span></div><button type="button" data-solution="'+escapeHTML(p.sku)+'">'+escapeHTML(p.price)+' →</button></div>'
 ).join("");
 document.querySelectorAll("#view-solutions [data-solution]").forEach(button=>button.addEventListener("click",()=>selectOffer(button.dataset.solution)));
}
$("recommended-buy").addEventListener("click",()=>selectOffer($("recommended-buy").dataset.offer));
$("sample-analysis").addEventListener("click",async()=>{
 const data={title:"KI-gestützte Bewerberauswahl · Beispiel",version:"DEMO-1.0",role:"provider",developer:"Demonstrationsfall",purpose:"Bewerbungen vorselektieren und priorisieren",sector:"employment",
 productSafety:false,prohibited:false,gpai:false,systemic:false,chatbot:false,synthetic:false,agents:false,critical:true,controls:{}};
 activeInput=structuredClone(data);activeId=crypto.randomUUID();docRecords=[];
 activeReport=evaluate(data,[]);activeReport.is_demo=true;activeReport.assessment_id=activeId;
 activeReport.input_sha256=await sha256(new TextEncoder().encode(JSON.stringify(data)));
 renderReport();show("results");
});
function download(filename,content,type){
 const obj=new Blob([content],{type});const url=URL.createObjectURL(obj);
 const a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$("download-json").addEventListener("click",()=>{if(activeReport)download("piga-ai-act-"+activeReport.assessment_id+".json",JSON.stringify(activeReport,null,2),"application/json");});
const csvSafe=v=>{const text=String(v??"").replace(/^[=+@\-\t\r\n]/,"'$&");return '"'+text.replaceAll('"','""')+'"';};
$("download-csv").addEventListener("click",()=>{
 if(!activeReport)return;
 const lines=[["Artikel","Titel","Screening-Status","Erläuterung"],...activeReport.articles.map(a=>[a.article,a.title,a.status,a.note])];
 download("piga-ai-act-articles.csv","\ufeff"+lines.map(row=>row.map(csvSafe).join(";")).join("\r\n"),"text/csv;charset=utf-8");
});
const printOpenStates=new Map();
let originalPrintTitle=null;
window.addEventListener("beforeprint",()=>{
 originalPrintTitle=document.title;
 if(activeReport)document.title="PIGA_AI_Act_Assessment_"+String(activeReport.assessment_id||"Report").slice(0,13);
 document.querySelectorAll(".ladder-item").forEach(el=>{printOpenStates.set(el,el.open);el.open=true;});
});
window.addEventListener("afterprint",()=>{for(const [el,open] of printOpenStates)el.open=open;printOpenStates.clear();if(originalPrintTitle!==null)document.title=originalPrintTitle;originalPrintTitle=null;});
$("print-report").addEventListener("click",()=>activeReport&&window.print());
async function saveReport(){
 if(!activeReport){toast("Erst einen Bericht erstellen.");return;}
 if(activeReport.is_demo){toast("Dies ist ein Beispiel. Bitte eine eigene Analyse erstellen.");return;}
 if(!user){toast("Zum Speichern bitte anmelden.");show("account");return;}
 const f=activeInput;
 if(!f){toast("Eingaben für diesen Bericht fehlen. Bitte neue Analyse durchführen.");return;}
 const payload={id:activeId,owner_id:user.id,title:activeReport.subject.title,subject_version:activeReport.subject.version,case_data:f,report:activeReport,status:activeReport.gate1,source_version:"EU-AI-ACT-"+LAW_VERSION,updated_at:new Date().toISOString()};
 const {error}=await client.from("aiact_assessments").upsert(payload,{onConflict:"id"});
 if(error)toast("Speichern fehlgeschlagen: "+error.message);
 else {toast("Prüfung geschützt im Konto gespeichert.");loadSaved();}
}
$("save-report").addEventListener("click",saveReport);
$("architecture-details").addEventListener("toggle",()=>{const panel=$("architecture-details");if(panel.open&&activeReport)$("architecture").innerHTML=architectureMarkup(activeReport.architecture||architectureCatalog,"");else $("architecture").replaceChildren();});
function architectureMarkup(items,search){
 const term=String(search||"").toLocaleLowerCase("de").trim();
 const hits=items.filter(x=>[x.name,x.id,x.purpose,x.notes,x.source,x.family].some(v=>String(v||"").toLocaleLowerCase("de").includes(term)));
 if(!hits.length)return '<p class="subtle">Keine Komponenten zu diesem Suchbegriff gefunden.</p>';
 return Object.entries(ARCHITECTURE_FAMILIES).map(([family,heading])=>{
  const rows=hits.filter(x=>x.family===family);
  if(!rows.length)return "";
  const expanded=family==="canonical"||Boolean(term);
  const inner=rows.map(x=>{
   const source=x.source_url&&/^https:\/\/(zenodo\.org|www\.linkedin\.com)\//.test(x.source_url)?
     '<a href="'+escapeHTML(x.source_url)+'" target="_blank" rel="noopener noreferrer">Öffentliche Quelle ↗</a>':
     '<span>Quellregister: '+escapeHTML(x.source||"internes Werkregister")+'</span>';
   return '<div class="result-row portfolio-entry"><div><b>'+escapeHTML(x.name)+'</b><small>'+escapeHTML(x.purpose)+'</small>'+
     (x.notes?'<small>'+escapeHTML(x.notes)+'</small>':'')+
     '<div class="portfolio-source">'+source+'</div></div>'+
     (x.case_status?small(x.relevance==="CORE_OR_CONTEXT"?"RELEVANT":"ERGÄNZEND",""):"")+'</div>';
  }).join("");
  return '<details class="portfolio-group" '+(expanded?'open':'')+'><summary>'+escapeHTML(heading)+' <span>'+rows.length+'</span></summary>'+inner+'</details>';
 }).join("");
}
function renderPortfolio(){
 const search=$("portfolio-search")?.value||"";
 $("portfolio-list").innerHTML=architectureMarkup(architectureCatalog,search);
 $("stat-portfolio-canonical").textContent=String(portfolioSummary.canonical);
 $("stat-portfolio-research").textContent=String(portfolioSummary.research);
 $("stat-portfolio-operational").textContent=String(portfolioSummary.operational);
 $("stat-portfolio-sector").textContent=String(portfolioSummary.sector);
 $("stat-portfolio-all").textContent=String(portfolioSummary.indexed);
}
$("portfolio-search")?.addEventListener("input",renderPortfolio);
function renderPublications(){
 const filter=($("publication-search")?.value||"").trim().toLocaleLowerCase("de");
 const category=$("publication-category")?.value||"all";
 const hits=publicationCatalog.filter(p=>(category==="all"||category===p.category)&&[p.title,p.doi,publicationCategories[p.category]].some(v=>String(v||"").toLocaleLowerCase("de").includes(filter)));
 $("pub-total").textContent=String(publicationSummary.indexed);
 $("pub-inspected").textContent=String(publicationSummary.zenodo_inspected);
 $("pub-indexed").textContent=String(publicationSummary.author_indexed);
 $("pub-coverage").textContent=String(Object.keys(publicationCategories).length);
 $("publication-result-info").textContent=hits.length+" von "+publicationSummary.indexed+" DOI-Einträgen. "+
  "Abgleichstatus kennzeichnet die Quellenherkunft, nicht die fachliche Begutachtung.";
 $("publication-list").innerHTML=Object.entries(publicationCategories).map(([key,title])=>{
  const papers=hits.filter(x=>x.category===key);
  if(!papers.length)return "";
  const entries=papers.map(p=>{
   const status=p.evidence_type==="ZENODO_RECORD_INSPECTED"?"Zenodo-Datensatz eingesehen":"DOI im Autorenindex";
   return '<div class="publication-item"><div><b>'+escapeHTML(p.title)+'</b><small>'+escapeHTML(p.doi)+'</small><small>'+escapeHTML(status)+'</small></div>'+
    '<a href="'+escapeHTML(p.url)+'" target="_blank" rel="noopener noreferrer" aria-label="'+escapeHTML(p.title)+' aufrufen">DOI öffnen ↗</a></div>';
  }).join("");
  return '<details class="portfolio-group" '+(filter||category!=="all"||key==="governance"?"open":"")+'><summary>'+escapeHTML(title)+' <span>'+papers.length+'</span></summary>'+entries+'</details>';
 }).join("")||'<p class="subtle">Keine Veröffentlichungen unter diesem Suchbegriff.</p>';
}
function setupPublications(){
 const picker=$("publication-category");
 picker.innerHTML='<option value="all">Alle Forschungsgebiete</option>'+Object.entries(publicationCategories).map(([id,name])=>'<option value="'+escapeHTML(id)+'">'+escapeHTML(name)+'</option>').join("");
 picker.addEventListener("change",renderPublications);
 $("publication-search").addEventListener("input",renderPublications);
 $("home-architecture-count").textContent=String(portfolioSummary.indexed);
 $("home-publications-count").textContent=String(publicationSummary.indexed);
}
function renderArticles(){
 const filter=$("article-search").value.toLowerCase().trim();
 const matches=articleCatalog.filter(a=>(a.number+" "+a.title).toLowerCase().includes(filter));
 $("article-table").innerHTML=matches.map(a=>{
  const r=activeReport?.articles?.find(x=>x.article===a.number);
  const state=r?.status||(a.screened?"VERTIEFTER INDEX":"NICHT VERTIEFT");
  return '<div class="article-row"><div class="num"><a href="'+LAW_URL+'#art_'+a.number+'" target="_blank" rel="noopener">Art. '+a.number+'</a></div><div><b>'+escapeHTML(a.title)+'</b><br><small>'+escapeHTML(r?.note||"Offiziellen Wortlaut prüfen")+'</small></div>'+small(state,["EVIDENCE_REQUIRED","NOT_ASSESSED","NICHT VERTIEFT"].includes(state)?"warn":"")+'</div>';
 }).join("")||'<p>Keine passenden Artikel.</p>';
}
$("article-search").addEventListener("input",renderArticles);
function selectOffer(sku){
 if(!PRODUCTS.some(p=>p.sku===sku))return;
 rememberOffer(sku);
 renderLicenses();
 show("licensing");
 $("featured-license").scrollIntoView({block:"start",behavior:"smooth"});
}
function showCommerceStatus(state,message){
 const node=$("commerce-status");node.className="commerce-status state-"+String(state||"info");node.textContent=message;node.classList.remove("hidden");
}
function renderPurchaseIntent(){
 const sku=pendingOffer(),p=PRODUCTS.find(x=>x.sku===sku),box=$("purchase-intent"),btn=$("continue-purchase");
 box.classList.toggle("hidden",!p);
 if(!p)return;
 $("purchase-intent-title").textContent=p.title+" · "+priceLabel(p.sku);
 btn.classList.toggle("hidden",!user);
}
$("continue-purchase").addEventListener("click",()=>{if(user&&pendingOffer())beginOrder(pendingOffer());});
function renderLicenses(){
 const sorted=offersForReport(activeReport);
 const featured=PRODUCTS.find(p=>p.sku===(selectedSku||pendingOffer()))||sorted[0];
 const recommend=sorted.find(p=>p.sku===featured?.sku);
 $("featured-license").innerHTML=featured?
  '<div class="featured-license"><div><span class="kicker">PASSEND ZU IHREM VORHABEN</span><h2>'+escapeHTML(featured.title)+'</h2><p>'+escapeHTML(recommend?.why||"Gezielte PIGA Admission- und Evidenzarchitektur")+'</p><ul><li>Klare Leistung und definierter Geltungsbereich</li><li>Nachvollziehbare Nachweise und Kontrollpunkte</li><li>Lizenzzugriff nur nach bestätigter Berechtigung</li></ul></div><aside><span>PREIS DER AUSGEWÄHLTEN LEISTUNG</span><strong>'+escapeHTML(priceLabel(featured.sku))+'</strong><small>Steuer- und Rechnungsbehandlung wird im Checkout ausgewiesen beziehungsweise separat geklärt.</small><button type="button" class="btn primary" data-buy="'+escapeHTML(featured.sku)+'">'+(user?"Weiter zum sicheren Checkout":"Lösung auswählen & anmelden")+' ↗</button><small>Verbindlich zahlungspflichtig wird erst der ausdrücklich bestätigte Stripe-Checkout.</small></aside></div>':"";
 $("licence-cards").innerHTML=sorted.map(p=>
  '<article class="license-card"><span class="type">'+escapeHTML(p.type)+'</span><h3>'+escapeHTML(p.title)+'</h3><p class="license-explain">'+escapeHTML(p.why)+'</p><div class="license-card-bottom"><strong>'+escapeHTML(p.price)+'</strong><button type="button" class="btn ghost smaller" data-buy="'+escapeHTML(p.sku)+'">Leistung auswählen ↗</button></div></article>'
 ).join("");
 document.querySelectorAll("[data-buy]").forEach(button=>button.addEventListener("click",()=>beginOrder(button.dataset.buy)));
}
function beginOrder(sku){
 const product=PRODUCTS.find(p=>p.sku===sku);
 if(!product)return;
 rememberOffer(sku);renderLicenses();show("licensing");
 $("order-title").textContent=product.title;
 $("order-price").textContent=priceLabel(sku);
 $("order-deliverable").textContent="Ausgewählter Leistungsumfang: "+product.type+". Inhalt und Zugang sind an eine bestätigte, produktspezifische Lizenz gebunden.";
 $("order-terms").checked=false;
 $("order-review").classList.remove("hidden");
 $("order-status").textContent="Bitte bestätigen Sie die Informationen. Es wurde noch keine Zahlung ausgelöst.";
 $("order-review").scrollIntoView({behavior:"smooth",block:"start"});
}
$("order-close").addEventListener("click",()=>{$("order-review").classList.add("hidden");$("order-terms").checked=false;});
$("order-continue").addEventListener("click",async()=>{
 if(!$("order-terms").checked){$("order-status").textContent="Bitte lesen und bestätigen Sie zuerst die Leistungsbedingungen und Datenschutzhinweise.";return;}
 const sku=pendingOffer();
 if(!sku){$("order-status").textContent="Bitte wählen Sie zuerst eine Leistung.";return;}
 if(!user){$("order-status").textContent="Ihre Auswahl bleibt gespeichert. Bitte kostenlos anmelden oder registrieren.";show("account");return;}
 await purchase(sku,$("order-continue"));
});
async function purchase(sku,button){
 if(!PRODUCTS.some(p=>p.sku===sku))return;
 if(!$("order-terms").checked){$("order-status").textContent="Bitte zunächst die Bestellübersicht bestätigen.";return;}
 rememberOffer(sku);renderPurchaseIntent();
 if(!isVerifiedCheckoutReturnHost){toast("Checkout ist aus dieser App-Adresse noch nicht sicher rückführbar. Bitte die verlinkte HTTPS-Webversion öffnen und dort nach Anmeldung kaufen. Es wurde keine Zahlung ausgelöst.");return;}
 if(!user){toast("Anmeldung ist erst für die Bestellung notwendig. Ihre Auswahl bleibt erhalten.");show("account");return;}
 button.disabled=true;const label=button.textContent;button.textContent="Checkout wird sicher vorbereitet …";
 showCommerceStatus("verifying","Serverseitige Produkt-, Preis- und Berechtigungsprüfung …");
 try{
  const {data,error}=await client.functions.invoke("aiact-payment",{body:{operation:"checkout",sku}});
  if(error||!data?.url)throw Error(data?.error||error?.message||"Checkout nicht verfügbar");
  const to=new URL(data.url);
  if(to.protocol!=="https:"||!to.hostname.endsWith(".stripe.com"))throw Error("Ungültiges Checkout-Ziel");
  location.assign(data.url);
 }catch(e){
  toast("Zahlung ist noch nicht freigegeben: "+(e.message||"Serverprüfung fehlgeschlagen")+". Es wurde keine Zahlung ausgelöst.");
  button.disabled=false;button.textContent=label;
 }
}
let confirmationRunning=false,confirmationCompleted=false;
async function confirmPaymentIfNeeded(){
 if(!user||confirmationRunning||confirmationCompleted)return;
 const params=new URLSearchParams(location.search);
 const session=params.get("session_id");
 if(params.get("payment")==="cancel"){
  history.replaceState(null,"",location.pathname+"#licensing");
  toast("Checkout abgebrochen. Es wurde keine Lizenz freigeschaltet.");return;
 }
 if(params.get("payment")!=="success"||!session)return;
 confirmationRunning=true;
 show("licensing");toast("Überprüfe Zahlung und Lizenzberechtigung beim Server …");
 try{
  const {data,error}=await client.functions.invoke("aiact-payment",{body:{operation:"confirm",session_id:session}});
  if(error||!data?.ok)throw Error(data?.error||error?.message||"Keine bestätigte Zahlung");
  confirmationCompleted=true;
  history.replaceState(null,"",location.pathname+"#licensing");
  showCommerceStatus("active","Zahlung serverseitig bestätigt. Ihre Lizenz steht in Ihrem Konto bereit.");
  $("order-review").classList.add("hidden");
  toast("Zahlung bestätigt. Deine Lizenz ist freigeschaltet.");
  await loadEntitlements();
 }catch(err){
  showCommerceStatus("error","Zahlung oder Freischaltung noch nicht bestätigt. Bitte prüfen Sie Ihren Kontostatus, bevor Sie eine neue Bestellung starten.");
  toast("Freigabe noch nicht bestätigt. Es wird keine Lizenz ohne Zahlungsnachweis ausgegeben. "+(err?.message||""));
 }finally{confirmationRunning=false;}
}
renderLicenses();
// Lists are rendered on first visit to keep mobile startup fast.
setupPublications();
async function loadEntitlements(){
 if(!user){$("entitlement-list").textContent="Bitte anmelden, damit serverseitig geprüfte Berechtigungen angezeigt werden.";return;}
 const {data,error}=await client.from("aiact_entitlements").select("sku,status,granted_at,expires_at").eq("owner_id",user.id);
 if(error){$("entitlement-list").textContent="Berechtigungsprüfung nicht möglich: "+error.message;return;}
 renderAccountJourney(data||[]);
 const valid=e=>e.status==="ACTIVE"&&(!e.expires_at||Date.parse(e.expires_at)>Date.now());
 $("entitlement-list").innerHTML=(!data||!data.length)?"Keine bestätigten, automatisch zugeordneten Lizenzberechtigungen.":data.map(e=>'<div class="saved-row"><div><b>'+escapeHTML(e.sku)+'</b><small>Status: '+escapeHTML(e.status)+'</small></div>'+(valid(e)?'<button type="button" data-licence="'+escapeHTML(e.sku)+'">Lizenzanleitung abrufen</button>':small(e.status,"warn"))+'</div>').join("")+'<div id="licensed-output" class="licensed-output"></div>';
 $("entitlement-list").querySelectorAll("[data-licence]").forEach(b=>b.addEventListener("click",()=>loadLicensed(b.dataset.licence)));
}
async function loadLicensed(sku){
 if(!user)return;
 const out=$("licensed-output");if(out)out.textContent="Prüfe Lizenz und lade geschützte Anleitung …";
 try{
  const {data,error}=await client.functions.invoke("aiact-license",{body:{sku}});
  if(error)throw error;
  if(!data?.playbook)throw new Error("Keine Implementierungsanleitung verfügbar.");
  const p=data.playbook;out.innerHTML="";
  const h=document.createElement("h3");h.textContent=p.title;out.appendChild(h);
  const note=document.createElement("p");note.textContent="Lizenzgebundener Scope: "+p.scope;out.appendChild(note);
  const list=document.createElement("ol");list.className="numbered";
  for(const phase of p.phases){const li=document.createElement("li");li.textContent=phase;list.appendChild(li);}
  out.appendChild(list);
  const artifacts=document.createElement("p");artifacts.textContent="Lieferartefakte: "+p.artifacts.join(", ");out.appendChild(artifacts);
  const boundary=document.createElement("p");boundary.textContent="Admission: "+p.admission;out.appendChild(boundary);
  const btn=document.createElement("button");btn.type="button";btn.className="btn primary smaller";btn.textContent="Lizenzanleitung als JSON";
  btn.addEventListener("click",()=>download("piga-license-"+sku+".json",JSON.stringify(data,null,2),"application/json"));
  out.appendChild(btn);
 }catch(error){if(out)out.textContent="Lizenz konnte nicht abgerufen werden. Die serverseitige Prüfung hat keine gültige Berechtigung bestätigt oder der Dienst ist nicht verfügbar.";toast(error?.message||"Lizenzprüfung fehlgeschlagen.");}
}
function renderAccountJourney(entitlements=[]){
 const entitled=Array.isArray(entitlements)&&entitlements.some(e=>e.status==="ACTIVE"&&(!e.expires_at||Date.parse(e.expires_at)>Date.now()));
 const selected=!!pendingOffer()||entitled;
 const steps=[
  ["Konto",!!user],
  ["E-Mail bestätigt",!!user&&(!!user.email_confirmed_at||!!user.confirmed_at)],
  ["Leistung gewählt",selected],
  ["Zahlung bestätigt",entitled],
  ["Lizenz aktiv",entitled]
 ];
 $("account-journey").innerHTML=steps.map(([label,done],i)=>'<div class="account-milestone '+(done?"complete":"pending")+'"><span>'+((done)?"✓":String(i+1).padStart(2,"0"))+'</span><b>'+escapeHTML(label)+'</b></div>').join("");
}
async function renderAuth(){
 renderLicenses();
 renderPurchaseIntent();
 renderAccountJourney();
 $("auth-pane").classList.toggle("hidden",Boolean(user));
 $("user-pane").classList.toggle("hidden",!user);
 $("sign-header").textContent=user?"Mein Konto":"Anmelden";
 $("password-recovery-pane").classList.toggle("hidden",!user||!recoveryMode);
 if(user){$("user-email").textContent=user.email||"Authentifiziert";loadSaved();confirmPaymentIfNeeded();}
}
async function withAuth(fn){
 const email=$("auth-email").value.trim();
 const password=$("auth-password").value;
 if(!email){toast("Bitte E-Mail-Adresse angeben.");return;}
 try{
  const {data,error}=await fn(email,password);
  if(error)throw error;
  $("auth-message").textContent=data?.user&&!data?.session?("Registrierung angelegt. Bitte den Bestätigungslink per E-Mail öffnen."+(isNativeShell?" Der Link öffnet die sichere Webversion; danach mit E-Mail und Passwort in der App anmelden.":"")):"Aktion erfolgreich.";
  if(data?.user&&data?.session){user=data.user;renderAuth();toast("Angemeldet.");}
 }catch(e){$("auth-message").textContent=e?.message||"Authentifizierung fehlgeschlagen.";}
}
$("register").addEventListener("click",()=>withAuth((email,password)=>{
 if(password.length<8)throw Error("Bitte mindestens acht Zeichen für das Passwort wählen.");
 return client.auth.signUp({email,password,options:{emailRedirectTo:accountEmailRedirect}});
}));
$("login").addEventListener("click",()=>withAuth((email,password)=>client.auth.signInWithPassword({email,password})));
$("reset").addEventListener("click",async()=>{
 const email=$("auth-email").value.trim();
 if(!email){$("auth-message").textContent="Bitte zuerst die E-Mail-Adresse deines Kontos eintragen.";return;}
 const button=$("reset");button.disabled=true;
 try{
  const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:accountEmailRedirect});
  if(error)throw error;
  $("auth-message").textContent="Falls zu dieser E-Mail ein Konto existiert, wird ein Wiederherstellungslink versendet. Anschließend kannst du hier ein neues Passwort wählen.";
 }catch(e){$("auth-message").textContent="Wiederherstellung nicht abgeschlossen: "+(e?.message||"Server nicht erreichbar");}
 finally{button.disabled=false;}
});
$("recovery-submit").addEventListener("click",async()=>{
 const password=$("recovery-password").value,confirmation=$("recovery-confirm").value;
 const message=$("recovery-message");
 if(password.length<8){message.textContent="Das neue Passwort muss mindestens acht Zeichen haben.";return;}
 if(password!==confirmation){message.textContent="Die beiden Passwörter stimmen nicht überein.";return;}
 const button=$("recovery-submit");button.disabled=true;message.textContent="Passwort wird sicher aktualisiert …";
 try{
  const {error}=await client.auth.updateUser({password});
  if(error)throw error;
  recoveryMode=false;$("recovery-password").value="";$("recovery-confirm").value="";
  message.textContent="Passwort erfolgreich aktualisiert.";
  renderAuth();toast("Das neue Passwort ist gespeichert.");
 }catch(e){message.textContent="Passwort nicht geändert: "+(e?.message||"Serverprüfung fehlgeschlagen");}
 finally{button.disabled=false;}
});
$("logout").addEventListener("click",async()=>{const {error}=await client.auth.signOut();if(error)toast(error.message);else{user=null;recoveryMode=false;activeReport=null;activeInput=null;activeId=null;docRecords=[];selectedFiles=[];$("evidence-files").value="";$("empty-results").classList.remove("hidden");$("result-content").classList.add("hidden");renderAuth();toast("Abgemeldet. Lokale Berichtsansicht zurückgesetzt.");}});
async function loadSaved(){
 if(!user)return;
 const {data,error}=await client.from("aiact_assessments").select("id,title,created_at,status,report,case_data").eq("owner_id",user.id).order("created_at",{ascending:false}).limit(50);
 if(error){$("saved-assessments").textContent="Laden fehlgeschlagen: "+error.message;return;}
 $("saved-assessments").innerHTML=data?.length?data.map(x=>'<div class="saved-row"><div><b>'+escapeHTML(x.title)+'</b><small>'+new Date(x.created_at).toLocaleString("de-DE")+' · Gate 1: '+escapeHTML(x.status)+'</small></div><div class="saved-actions"><button data-open="'+escapeHTML(x.id)+'" type="button">Öffnen</button><button data-delete="'+escapeHTML(x.id)+'" type="button" class="danger-action" aria-label="Prüfung '+escapeHTML(x.title)+' und Belege löschen">Löschen</button></div></div>').join(""):"Noch keine gespeicherten Prüfungen.";
 $("saved-assessments").querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>{
  const record=data.find(a=>a.id===b.dataset.open);if(!record)return;
  activeReport=record.report;activeId=record.id;activeInput=record.case_data||null;
  restoreInput(activeInput);renderReport();show("results");
 }));
 $("saved-assessments").querySelectorAll("[data-delete]").forEach(button=>button.addEventListener("click",async()=>{
  const record=data.find(a=>a.id===button.dataset.delete);if(!record||!user)return;
  if(!window.confirm("Prüfung „"+record.title+"“ samt den zugehörigen hochgeladenen Nachweisen dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden."))return;
  button.disabled=true;
  try{
   // Fail-closed: never unlink an evidence object unless it belongs to the active user and the selected assessment.
   const prefix=user.id+"/"+record.id+"/";
   const uploaded=(record.report?.evidence||[]).filter(x=>x.uploaded===true);
   if(uploaded.some(x=>typeof x.path!=="string"||!x.path.startsWith(prefix)))throw Error("Nicht eindeutig zugeordnete Belege: Manuelle Prüfung nötig.");
   const paths=[...new Set(uploaded.map(x=>x.path))];
   if(paths.length){
    const {error:storageError}=await client.storage.from("aiact-evidence").remove(paths);
    if(storageError)throw storageError;
   }
   const {data:removed,error:deleteError}=await client.from("aiact_assessments").delete().eq("id",record.id).eq("owner_id",user.id).select("id");
   if(deleteError)throw deleteError;
   if(!removed?.length)throw Error("Datenbank hat keine Löschung bestätigt.");
   if(activeId===record.id){activeId=null;activeReport=null;activeInput=null;$("result-content").classList.add("hidden");$("empty-results").classList.remove("hidden");}
   toast("Prüfung und zugeordnete Belege wurden entfernt.");
   await loadSaved();
  }catch(e){toast("Löschen nicht vollständig bestätigt: "+(e?.message||"Unbekannter Fehler")+". Bitte Kontenansicht aktualisieren und Zustand prüfen.");button.disabled=false;}
 }));
}
client.auth.getUser().then(({data,error})=>{if(!error)user=data?.user||null;renderAuth();}).catch(()=>renderAuth());
client.auth.onAuthStateChange((event,session)=>{
 // Supabase callbacks must not synchronously enter another awaited auth/client operation.
 queueMicrotask(()=>{
  user=session?.user||null;
  if(event==="PASSWORD_RECOVERY"){recoveryMode=true;show("account");}
  if(event==="SIGNED_OUT"){recoveryMode=false;activeReport=null;activeInput=null;activeId=null;selectedFiles=[];docRecords=[];$("evidence-files").value="";$("empty-results").classList.remove("hidden");$("result-content").classList.add("hidden");}
  renderAuth();
 });
});
show(titles[location.hash.slice(1)]?location.hash.slice(1):"home");
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
