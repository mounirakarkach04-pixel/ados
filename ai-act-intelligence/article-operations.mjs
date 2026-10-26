import {operationalArticles,atlasCategories,operationalAtlasSearch,ATLAS_LAW_VERSION,ATLAS_BOUNDARY} from "./article-operational-map.js";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const PAGE_SIZE=12;
let limit=PAGE_SIZE;
let lastKey="";
const labelFor=a=>a.detailLevel==="ARTICLE_FOCUSED"?"Artikelbezogene Prüfhilfe":"Themenbezogener Kontrollentwurf";
function articleMarkup(a){
 return '<article class="atlas-card"><details class="atlas-detail"><summary>'+
 '<span class="atlas-ref">ART. '+esc(a.ref)+'</span><span class="atlas-title">'+esc(a.topic)+'</span>'+
 '<span class="atlas-kind">'+esc(labelFor(a))+'</span></summary>'+
 '<div class="atlas-body"><p class="atlas-clause"><b>Prüffrage:</b> '+esc(a.question)+'</p>'+
 '<dl><div><dt>Wer ist betroffen?</dt><dd>'+esc(a.addressee)+'</dd></div>'+
 '<div><dt>Ihre konkrete Prüfung</dt><dd>'+esc(a.assessment)+'</dd></div>'+
 '<div><dt>PIGA: technisch vorbereiteter Kontrollentwurf</dt><dd>'+esc(a.pigaControl)+'</dd></div>'+
 '<div><dt>Mögliche Nachweise</dt><dd>'+esc(a.evidence)+'</dd></div>'+
 '<div><dt>A7SEM Reverse · Gegenprobe</dt><dd>'+esc(a.negativeTest)+'</dd></div></dl>'+
 '<p class="atlas-limit">Status: <strong>NOT ASSESSED</strong> · Keine Prüfung Ihres individuellen Systems, keine Konformitätsbestätigung und keine bereits wirksame Kundensperre.</p>'+
 '<div class="atlas-actions"><a href="'+esc(a.source)+'" target="_blank" rel="noopener noreferrer">Amtlichen Artikel prüfen ↗</a>'+
 '<button type="button" data-export-article="'+esc(a.ref)+'">Prüfauftrag als JSON speichern</button></div></div></details></article>';
}
function download(name,items){
 const data={schema:"PIGA-AIACT-OPERATIONAL-ATLAS-1.0",lawVersion:ATLAS_LAW_VERSION,source:"https://ai-act-service-desk.ec.europa.eu/en/ai-act-explorer",admission:"NOT_ASSESSED",boundary:ATLAS_BOUNDARY,items};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+"\n"],{type:"application/json;charset=utf-8"}));
 const link=document.createElement("a");link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function downloadCsv(){
 const cols=["ref","topic","categoryName","addressee","scope","question","assessment","pigaControl","evidence","negativeTest","reviewState","implementationState","source"];
 const neutral=v=>{
  const raw=String(v??"");
  // Prevent Excel formula injection if catalogue data is ever sourced externally.
  return /^[=+@\-\t\r]/.test(raw.trimStart())?"'"+raw:raw;
 };
 const csv=["# PIGA AI Act · 119 Kontrollentwürfe · Keine Konformitätsbescheinigung",cols.join(";"),
  ...operationalArticles.map(x=>cols.map(k=>'"'+neutral(x[k]).replace(/"/g,'""')+'"').join(";"))].join("\r\n")+"\r\n";
 const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
 const link=document.createElement("a");link.href=url;link.download="piga-aiact-119-kontrollatlas.csv";link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function activateAtlas(){
 const input=$("atlas-search"),filter=$("atlas-category"),list=$("atlas-list"),counter=$("atlas-count"),more=$("atlas-more"),downloadAll=$("atlas-export-all");
 if(!input||!filter||!list||!counter||!more||!downloadAll)return;
 filter.innerHTML='<option value="all">Alle Themenbereiche</option>'+atlasCategories.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.label)+'</option>').join("");
 function render(){
  const key=input.value+"|"+filter.value;
  if(key!==lastKey){limit=PAGE_SIZE;lastKey=key;}
  const rows=operationalAtlasSearch({query:input.value,category:filter.value});
  list.innerHTML=rows.slice(0,limit).map(articleMarkup).join("")||'<p class="atlas-empty">Keine passende Vorschrift gefunden. Suchen Sie nach Artikelnummer, Zweck, Nachweis oder Thema.</p>';
  counter.textContent=rows.length+" von "+operationalArticles.length+" Artikelkennungen zum gewählten Such- und Themenbereich.";
  more.hidden=rows.length<=limit;
 }
 input.addEventListener("input",render);filter.addEventListener("change",render);
 more.addEventListener("click",()=>{limit=Math.min(119,limit+PAGE_SIZE);render();});
 list.addEventListener("click",event=>{
  const button=event.target.closest("[data-export-article]");
  if(!button)return;
  const a=operationalArticles.find(x=>x.ref===button.dataset.exportArticle);
  if(a)download("piga-aiact-artikel-"+a.ref+"-kontrollauftrag.json",[a]);
 });
 downloadAll.addEventListener("click",()=>download("piga-aiact-119-artikel-kontrollatlas.json",operationalArticles));
 $("atlas-export-csv")?.addEventListener("click",downloadCsv);
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",activateAtlas,{once:true});else activateAtlas();
