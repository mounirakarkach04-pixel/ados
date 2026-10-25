import {createClient} from "https://esm.sh/@supabase/supabase-js@2.78.0?bundle";
import {evaluate,articleCatalog,TERMS,PRODUCTS,LAW_URL,LAW_VERSION} from "./engine.js";
import {architectureCatalog,portfolioSummary,ARCHITECTURE_FAMILIES} from "./portfolio.js";
import {publicationCatalog,publicationCategories,publicationSummary} from "./publications.js";

const client=createClient("https://sanrkcovmkkhgdqydxfk.supabase.co","sb_publishable_GWNQHoz-ML6wphVEyXz0pA_TLuNDzDQ",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const escapeHTML=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const small=(text,cls="")=>'<span class="pill '+cls+'">'+escapeHTML(text)+'</span>';
const gateBadge=x=>small(x,x==="BLOCK"?"danger":x==="UNKNOWN"||x==="DELAY"?"warn":"");
const titles={home:"Übersicht",assessment:"Neue Analyse",results:"Ergebnis & Ladder",articles:"Artikel-Explorer",portfolio:"PIGA Gesamtarchitektur",publications:"Zenodo-Forschungsbibliothek",licensing:"Lizenzlösungen",account:"Konto & Nachweise"};
let user=null,activeReport=null,activeInput=null,activeId=null,selectedFiles=[],docRecords=[],toastTimer,recoveryMode=false;
function toast(message){const el=$("toast");el.textContent=String(message);el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),4700);}
function show(view){
 if(!titles[view])view="home";
 $("more-sheet").classList.add("hidden");
 $("nav-more").setAttribute("aria-expanded","false");
 document.querySelectorAll(".view").forEach(e=>e.classList.toggle("hidden",e.id!=="view-"+view));
 document.querySelectorAll(".nav-item").forEach(e=>e.classList.toggle("active",e.dataset.view===view));
 $("current-title").textContent=titles[view];
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
 const btn=$("analyze");btn.disabled=true;btn.textContent="Prüfung läuft …";
 try{
  const input=gather();activeInput=structuredClone(input);activeId=crypto.randomUUID();
  docRecords=await uploadEvidence(activeId);
  activeReport=evaluate(input,docRecords);
  activeReport.assessment_id=activeId;
  activeReport.input_sha256=await sha256(new TextEncoder().encode(JSON.stringify(input)));
  activeReport.governance="A7SEM → Assessment → Evidence → A7SEM Reverse → Gate 1 → Gate 2 → Result; finite bounded iteration, re-entry on material change";
  activeReport.self_assessment_only=true;
  renderReport();
  toast("Vorprüfung erstellt. Nicht als behördliche Konformitätserklärung verwendbar.");
  show("results");
 }catch(err){toast("Analyse nicht abgeschlossen: "+(err?.message||err));}
 finally{btn.disabled=false;btn.innerHTML='Vorprüfung erstellen <span>↗</span>';}
});
function renderReport(){
 const r=activeReport;if(!r)return;
 $("empty-results").classList.add("hidden");$("result-content").classList.remove("hidden");
 $("result-title").textContent=r.subject.title||"Nicht benannt";
 $("result-summary").textContent=r.classification.replaceAll("_"," ")+" · "+r.coverage.contextual_findings+" relevante Prüfpositionen · "+r.coverage.remaining_manual_review+" Artikel nicht vertieft geprüft · Belegstatus: nicht unabhängig verifiziert";
 $("gate1").textContent=r.gate1;$("gate2").textContent=r.gate2;
 $("findings").innerHTML=r.findings.map(x=>'<div class="result-row"><div><b>Art. '+escapeHTML(x.article)+' · '+escapeHTML(x.title)+'</b><small>'+escapeHTML(x.issue)+'</small></div>'+small(x.status,x.status==="POTENTIAL_PROHIBITION"?"danger":"warn")+'</div>').join("")||"<p>Keine vertieft zugeordneten Artikel. Vollständige Prüfung weiterhin erforderlich.</p>";
 $("ladder").innerHTML=r.ladder.map(x=>'<div class="ladder-step"><b>'+escapeHTML(x.label)+'</b>'+gateBadge(x.state)+'</div>').join("");
 $("priorities").innerHTML='<ol class="numbered">'+r.priorities.map(x=>'<li>'+escapeHTML(x)+'</li>').join("")+'</ol>';
 $("reverse").innerHTML=r.reverse.questions.map(x=>'<div class="reverse-item">◇ '+escapeHTML(x)+'</div>').join("")+'<p class="subtle">Reverse: '+escapeHTML(r.reverse.status)+'; unabhängiger Wirkungsnachweis: nicht erbracht.</p>';
 if($("architecture-details")?.open)$("architecture").innerHTML=architectureMarkup(r.architecture||architectureCatalog,"");
 else $("architecture").replaceChildren();
 if($("case-architecture-count"))$("case-architecture-count").textContent=String((r.architecture||architectureCatalog).length);
 if($("suggestions")){
  $("suggestions").innerHTML=r.suggestions.map(p=>'<div class="result-row"><div><b>'+escapeHTML(p.title)+'</b><small>'+escapeHTML(p.type)+' · '+escapeHTML(PRICE_EUR[p.sku]||"Preis auf Anfrage")+'</small></div><button type="button" class="btn ghost smaller" data-suggest="'+escapeHTML(p.sku)+'">Lösung prüfen</button></div>').join("");
  $("suggestions").querySelectorAll("[data-suggest]").forEach(b=>b.addEventListener("click",()=>show("licensing")));
 }
}
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
$("print-report").addEventListener("click",()=>activeReport&&window.print());
async function saveReport(){
 if(!activeReport){toast("Erst einen Bericht erstellen.");return;}
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
const PRICE_EUR={
 "PIGA-PROD-001":"7.900 €","PIGA-PROD-002":"7.900 €",
 "PIGA-PROD-005":"12.900 €","PIGA-PROD-011":"24.900 €",
 "PIGA-PROD-022":"24.900 €","PIGA-PROD-043":"1.490 €",
 "PIGA-BUNDLE-01":"13.900 €","PIGA-BUNDLE-07":"44.900 €"
};
function renderLicenses(){
 $("licence-cards").innerHTML=PRODUCTS.map(p=>{
  const label=user?"Sicheren Checkout prüfen":"Anmelden und Angebot ansehen";
  return '<div class="license-card"><span class="type">'+escapeHTML(p.type)+'</span><h3>'+escapeHTML(p.title)+'</h3><p>'+escapeHTML(p.sku)+' · <strong>'+escapeHTML(PRICE_EUR[p.sku]||"Auf Anfrage")+'</strong></p><small>Auswahl, Anmeldung und Zahlung erfolgen getrennt; lizenzierte Implementierung wird nach erfolgreicher serverseitiger Stripe-Prüfung freigegeben.</small><button type="button" class="btn ghost smaller" data-buy="'+escapeHTML(p.sku)+'">'+label+'</button></div>';
 }).join("");
 $("licence-cards").querySelectorAll("[data-buy]").forEach(b=>b.addEventListener("click",()=>purchase(b.dataset.buy,b)));
}
async function purchase(sku,button){
 if(!user){toast("Für einen lizenzierten Kauf bitte zuerst anmelden.");show("account");return;}
 button.disabled=true;const label=button.textContent;button.textContent="Prüfe sicheren Checkout …";
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
  toast("Zahlung bestätigt. Deine Lizenz ist freigeschaltet.");
  await loadEntitlements();
 }catch(err){
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
async function renderAuth(){
 renderLicenses();
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
  $("auth-message").textContent=data?.user&&!data?.session?"Registrierung angelegt. Bitte den Bestätigungslink per E-Mail öffnen.":"Aktion erfolgreich.";
  if(data?.user&&data?.session){user=data.user;renderAuth();toast("Angemeldet.");}
 }catch(e){$("auth-message").textContent=e?.message||"Authentifizierung fehlgeschlagen.";}
}
$("register").addEventListener("click",()=>withAuth((email,password)=>{
 if(password.length<8)throw Error("Bitte mindestens acht Zeichen für das Passwort wählen.");
 return client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname+"#account"}});
}));
$("login").addEventListener("click",()=>withAuth((email,password)=>client.auth.signInWithPassword({email,password})));
$("reset").addEventListener("click",async()=>{
 const email=$("auth-email").value.trim();
 if(!email){$("auth-message").textContent="Bitte zuerst die E-Mail-Adresse deines Kontos eintragen.";return;}
 const button=$("reset");button.disabled=true;
 try{
  const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname+"#account"});
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
 $("saved-assessments").innerHTML=data?.length?data.map(x=>'<div class="saved-row"><div><b>'+escapeHTML(x.title)+'</b><small>'+new Date(x.created_at).toLocaleString("de-DE")+' · Gate 1: '+escapeHTML(x.status)+'</small></div><button data-open="'+escapeHTML(x.id)+'" type="button">Öffnen</button></div>').join(""):"Noch keine gespeicherten Prüfungen.";
 $("saved-assessments").querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>{
  const record=data.find(a=>a.id===b.dataset.open);if(!record)return;
  activeReport=record.report;activeId=record.id;activeInput=record.case_data||null;
  restoreInput(activeInput);renderReport();show("results");
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
