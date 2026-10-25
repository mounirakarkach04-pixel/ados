import {createClient} from "https://esm.sh/@supabase/supabase-js@2.78.0?bundle";
import {evaluate,articleCatalog,TERMS,PRODUCTS,LAW_URL,LAW_VERSION} from "./engine.js";

const client=createClient("https://sanrkcovmkkhgdqydxfk.supabase.co","sb_publishable_GWNQHoz-ML6wphVEyXz0pA_TLuNDzDQ",{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const escapeHTML=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const small=(text,cls="")=>'<span class="pill '+cls+'">'+escapeHTML(text)+'</span>';
const gateBadge=x=>small(x,x==="BLOCK"?"danger":x==="UNKNOWN"||x==="DELAY"?"warn":"");
const titles={home:"Übersicht",assessment:"Neue Analyse",results:"Ergebnis & Ladder",articles:"Artikel-Explorer",licensing:"Lizenzlösungen",account:"Konto & Nachweise"};
let user=null,activeReport=null,activeId=null,selectedFiles=[],docRecords=[],toastTimer;
function toast(message){const el=$("toast");el.textContent=String(message);el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),4700);}
function show(view){
 if(!titles[view])view="home";
 document.querySelectorAll(".view").forEach(e=>e.classList.toggle("hidden",e.id!=="view-"+view));
 document.querySelectorAll(".nav-item").forEach(e=>e.classList.toggle("active",e.dataset.view===view));
 $("current-title").textContent=titles[view];
 if(view==="articles")renderArticles();
 if(view==="licensing")loadEntitlements();
 if(view==="account")renderAuth();
 history.replaceState(null,"","#"+view);
 scrollTo({top:0,behavior:"instant"});
}
document.querySelectorAll("[data-view]").forEach(e=>e.addEventListener("click",()=>show(e.dataset.view)));
document.querySelectorAll("[data-go]").forEach(e=>e.addEventListener("click",()=>show(e.dataset.go)));
$("sign-header").addEventListener("click",()=>show(user?"account":"account"));
window.addEventListener("hashchange",()=>{const v=location.hash.slice(1);if(titles[v])show(v);});
const keys=["literacy","risk","data","technical","logs","transparency","oversight","robustness","quality","retention","corrective","cooperation","deployer","fr","conformity","declaration","registration","marking","gpai","monitoring","incident"];
$("controls").innerHTML=keys.map(k=>'<label class="check"><input type="checkbox" data-control="'+escapeHTML(k)+'"><span>'+escapeHTML(TERMS[k].label)+' · Art. '+escapeHTML(TERMS[k].article)+'</span></label>').join("");
function gather(){
 const fields=["title","version","role","developer","purpose","sector"];
 const f=Object.fromEntries(fields.map(x=>[x,$("f-"+x).value.trim()]));
 for(const k of ["productSafety","prohibited","gpai","systemic","chatbot","synthetic","agents","critical"]) f[k]=$("f-"+k).checked;
 f.controls={};
 document.querySelectorAll("[data-control]").forEach(x=>{f.controls[x.dataset.control]=x.checked;});
 return f;
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
  const input=gather();activeId=crypto.randomUUID();
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
 if($("architecture"))$("architecture").innerHTML=(r.architecture||[]).map(x=>'<div class="result-row"><div><b>'+escapeHTML(x.name)+' · '+escapeHTML(x.domain)+'</b><small>'+escapeHTML(x.purpose)+'</small></div>'+small(x.status,"warn")+'</div>').join("");
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
 const f=gather();
 const payload={id:activeId,owner_id:user.id,title:activeReport.subject.title,subject_version:activeReport.subject.version,case_data:f,report:activeReport,status:activeReport.gate1,source_version:"EU-AI-ACT-"+LAW_VERSION,updated_at:new Date().toISOString()};
 const {error}=await client.from("aiact_assessments").upsert(payload,{onConflict:"id"});
 if(error)toast("Speichern fehlgeschlagen: "+error.message);
 else {toast("Prüfung geschützt im Konto gespeichert.");loadSaved();}
}
$("save-report").addEventListener("click",saveReport);
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
  const label=user?"Sicher zu Stripe ↗":"Anmelden und Angebot ansehen";
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
$("reset").addEventListener("click",()=>withAuth(async email=>{
 const result=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname+"#account"});
 if(!result.error)toast("Falls das Konto existiert und die Weiterleitungsadresse zugelassen ist, erhältst du eine E-Mail.");
 return result;
}));
$("logout").addEventListener("click",async()=>{const {error}=await client.auth.signOut();if(error)toast(error.message);else{user=null;renderAuth();toast("Abgemeldet.");}});
async function loadSaved(){
 if(!user)return;
 const {data,error}=await client.from("aiact_assessments").select("id,title,created_at,status,report").eq("owner_id",user.id).order("created_at",{ascending:false}).limit(50);
 if(error){$("saved-assessments").textContent="Laden fehlgeschlagen: "+error.message;return;}
 $("saved-assessments").innerHTML=data?.length?data.map(x=>'<div class="saved-row"><div><b>'+escapeHTML(x.title)+'</b><small>'+new Date(x.created_at).toLocaleString("de-DE")+' · Gate 1: '+escapeHTML(x.status)+'</small></div><button data-open="'+escapeHTML(x.id)+'" type="button">Öffnen</button></div>').join(""):"Noch keine gespeicherten Prüfungen.";
 $("saved-assessments").querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>{
  const record=data.find(a=>a.id===b.dataset.open);if(!record)return;
  activeReport=record.report;activeId=record.id;renderReport();show("results");
 }));
}
client.auth.getUser().then(({data,error})=>{if(!error)user=data?.user||null;renderAuth();});
client.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;renderAuth();});
show(titles[location.hash.slice(1)]?location.hash.slice(1):"home");
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
