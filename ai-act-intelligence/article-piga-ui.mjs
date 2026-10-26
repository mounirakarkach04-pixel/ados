import {PIGA_ARTICLE_GUIDES,PIGA_AI_ACT_SOURCE,validatePigaGuides} from "./article-piga-guides.mjs";
/* Public client-only index, no account or payment, no user telemetry. */
const $=id=>document.getElementById(id);
const html=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let limit=16;
const roleMatch=(r,role)=>role==="all"||r.roles.includes(role);
const option=(v,t)=>'<option value="'+html(v)+'">'+html(t)+'</option>';
function controls(){
 const host=$("piga-article-controls");if(!host)return;
 const chapters=[...new Set(PIGA_ARTICLE_GUIDES.map(x=>x.chapter))];
 host.innerHTML=
  '<div class="piga-law-quick-stats"><b>119 / 119</b><span>Artikel mit offen zugänglichen PIGA-Kontrollskizzen</span><span>13 Kapitel · 6 eingefügte Artikel · 0€ für die Übersicht</span></div>'+
  '<div class="piga-law-filters"><label>Kapitel<select id="piga-law-chapter">'+option("all","Alle 13 Kapitel")+chapters.map(c=>option(c,"Kapitel "+c)).join("")+'</select></label>'+
  '<label>Perspektive<select id="piga-law-role">'+option("all","Alle Rollen")+option("provider","Anbieter / Provider")+option("deployer","Betreiber / Deployer")+option("authority","Behörden / benannte Stellen")+'</select></label></div>'+
  '<div class="piga-law-actions"><button type="button" class="btn ghost smaller" id="piga-law-export-json">Alle 119 als JSON</button><button type="button" class="btn ghost smaller" id="piga-law-export-csv">Alle 119 als CSV</button></div>'+
  '<p class="piga-law-disclaimer">Frei zugänglich: pro Artikel Rechtsbezug, PIGA-Kontrollidee, Prüffrage, Gegenprobe und benötigter Nachweis. Das ist eine technische Arbeitshilfe, keine Rechtsberatung, keine behördliche Konformitätsfeststellung und keine aktivierte Kundeninstallation. Besondere Behörden-/Verfahrensnormen sind nicht automatisch Pflichten jedes Unternehmens.</p>';
 for(const id of ["piga-law-chapter","piga-law-role"])$(id)?.addEventListener("change",()=>{limit=16;render()});
 $("piga-law-export-json")?.addEventListener("click",()=>save("piga-eu-ai-act-119-mapping.json",JSON.stringify({source:PIGA_AI_ACT_SOURCE,article_count:119,entries:PIGA_ARTICLE_GUIDES},null,2),"application/json"));
 $("piga-law-export-csv")?.addEventListener("click",()=>save("piga-eu-ai-act-119-mapping.csv",csv(),"text/csv;charset=utf-8"));
}
function save(name,text,type){
 const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=name;a.style.display="none";document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function csv(){
 const cols=["article","title","chapter","group","roles","kind","lenses","control","focus","test","proof","statutory","implementationState","primarySource"];
 return "\uFEFF"+[cols,...PIGA_ARTICLE_GUIDES.map(x=>cols.map(k=>Array.isArray(x[k])?x[k].join("; "):String(x[k]||"")))]
  .map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\r\n")+"\r\n";
}
function card(x){
 return '<details class="piga-article-guide" data-article="'+html(x.article)+'"><summary>'+
   '<span class="piga-article-num">Art. '+html(x.article)+'</span><span class="piga-article-name"><b>'+html(x.title)+'</b><small>Kapitel '+html(x.chapter)+' · '+html(x.group)+'</small></span>'+
   '<span class="piga-article-open" aria-hidden="true">Details +</span></summary>'+
   '<div class="piga-article-guide-body">'+
   '<p class="piga-article-duty"><strong>Relevanz und Rechtsbezug:</strong> '+html(x.focus)+'</p>'+
   '<div class="piga-article-guide-grid">'+
   '<div><b>PIGA-Kontrollvorschlag</b><p>'+html(x.control)+'</p><small>Prüflinsen: '+html(x.lenses.join(" · "))+'</small></div>'+
   '<div><b>Konkrete Gegenprobe</b><p>'+html(x.test)+'</p></div>'+
   '<div><b>Benötigter Nachweis</b><p>'+html(x.proof)+'</p></div>'+
   '<div><b>Grenzen der Freigabe</b><p>'+html(x.statutory)+' Keine pauschale operative oder rechtliche Freigabe.</p></div>'+
   '</div>'+
   '<div class="piga-guide-next"><p>'+html(x.invariant)+'</p><a target="_blank" rel="noopener noreferrer" href="'+html(x.primarySource)+'">Amtlichen Artikel prüfen ↗</a></div>'+
   '</div></details>';
}
function render(){
 const root=$("view-articles"),out=$("article-table");if(!root||!out||root.classList.contains("hidden"))return;
 const q=($("article-search")?.value||"").toLocaleLowerCase("de").trim();
 const role=$("piga-law-role")?.value||"all",chapter=$("piga-law-chapter")?.value||"all";
 const matches=PIGA_ARTICLE_GUIDES.filter(x=>(chapter==="all"||x.chapter===chapter)&&roleMatch(x,role)&&
  [x.article,x.title,x.group,x.control,x.focus,x.proof,...x.lenses].join(" ").toLocaleLowerCase("de").includes(q));
 const slice=matches.slice(0,limit);
 out.innerHTML='<p class="piga-article-result-count" role="status">'+matches.length+' Artikel gefunden · '+slice.length+' angezeigt</p>'+
   slice.map(card).join("")+(matches.length>limit?'<button type="button" class="btn ghost" id="piga-law-more">Weitere Artikel anzeigen ('+(matches.length-limit)+' verbleiben)</button>':'')+
   (!matches.length?'<p>Keine Artikel gefunden. Suchbegriff oder Filter ändern.</p>':"");
 $("piga-law-more")?.addEventListener("click",()=>{limit=Math.min(matches.length,limit+24);render()});
}
function init(){
 const report=validatePigaGuides();if(!report.ok){console.error("PIGA legal guide integrity BLOCK",report.problems);return}
 controls();
 const root=$("view-articles");if(root)new MutationObserver(()=>{if(!root.classList.contains("hidden"))render()}).observe(root,{attributes:true,attributeFilter:["class"]});
 $("article-search")?.addEventListener("input",()=>{limit=16;render()});
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
