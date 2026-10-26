'use strict';
/* PIGA ORTHO 3D direct mode: persistent local workflows, no authentication, no network calls.
   Never send browser data to Supabase or medical devices; no clinical diagnosis. */
(()=>{
const $=id=>document.getElementById(id),KEY='piga-ortho-direct-v1';
const defaults=()=>({version:1,cases:[],tasks:[],calendar:[],inventory:[],team:[],audit:[],switches:{cases:true,tasks:true,calendar:true,inventory:true,team:true,studio:true}});
const safeList=(v,n=1000)=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)).slice(0,n):[];
let state;
try{let stored=JSON.parse(localStorage.getItem(KEY)||'null');state=stored&&stored.version===1?stored:defaults()}catch{state=defaults()}
for(const key of ['cases','tasks','calendar','inventory','team','audit'])state[key]=safeList(state[key]);
if(!state.switches||typeof state.switches!=='object')state.switches=defaults().switches;
for(const k of Object.keys(defaults().switches))if(typeof state.switches[k]!=='boolean')state.switches[k]=true;
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const iso=()=>new Date().toISOString();
const stamp=v=>v?new Date(v).toLocaleString('de-DE'):'–';
const short=(s,max=160)=>String(s||'').slice(0,max);
const msg=(s,err=false)=>{$('notice').textContent=String(s);$('notice').style.color=err?'#bd5148':'#1e8278'};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch{msg('Gerätespeicher voll oder nicht verfügbar. Bitte JSON-Export sichern.',true);return false}};
const audit=(type,detail)=>{state.audit.unshift({id:uid(),type,detail:short(detail,160),at:iso()});state.audit=state.audit.slice(0,1200)};
const commit=(type,detail)=>{audit(type,detail);save();renderAll();msg(detail)};
const el=(tag,t='')=>{const n=document.createElement(tag);n.textContent=t;return n};
const action=(wrap,title,fn)=>{let b=el('button',title);b.type='button';b.onclick=()=>{try{fn()}catch(e){msg(e.message,true)}};wrap.append(b);return b};
const line=(target,title,description,tools)=>{const n=el('div');n.className='record';const copy=el('div');copy.append(el('strong',title),el('small',description));const controls=el('div');controls.className='tools';n.append(copy,controls);target.append(n);if(tools)tools(controls,n)};
const requirement=module=>{if(!state.switches[module])throw Error('Dieser Bereich wurde in der lokalen Inhabersteuerung pausiert.')};
const check=fn=>e=>{e.preventDefault();try{fn()}catch(err){msg(err.message,true)}};
const pick=(id,items,placeholder='Bitte zuerst einen Fall anlegen')=>{
 const select=$(id),value=select.value;select.replaceChildren();
 for(const item of items){let o=el('option',item.label);o.value=item.id;select.append(o)}
 if(!items.length){let o=el('option',placeholder);o.value='';select.append(o);select.disabled=true}else{select.disabled=false;select.value=items.some(x=>x.id===value)?value:items[0].id}
};
function renderAll(){
 $('metricCases').textContent=state.cases.length;
 $('metricTasks').textContent=state.tasks.filter(t=>t.status==='open'||t.status==='not_done').length;
 $('metricCalendar').textContent=state.calendar.length;
 $('metricInventory').textContent=state.inventory.length;
 const tiles=$('overview');tiles.replaceChildren();
 for(const [panel,title,desc] of [
  ['cases','Fälle verwalten','Lokal anlegen, schließen, entfernen'],
  ['tasks','Aufträge steuern','Zuweisen, erledigt, nicht erledigt'],
  ['calendar','Terminkalender','Termine anlegen und entfernen'],
  ['inventory','Inventur','Material anlegen, Mengen buchen'],
  ['team','Personal','Rollen- und Teamkürzel'],
  ['studio','3D & STL','Dateien lokal prüfen'],
  ['reports','Glassbox','Ereignisprotokoll und Exporte'],
  ['controls','Inhabersteuerung','Module starten oder pausieren']]){
   const b=el('button',title);b.type='button';b.append(el('small',desc));b.onclick=()=>panelOpen(panel);tiles.append(b);
 }
 renderCases();renderTasks();renderCalendar();renderInventory();renderTeam();renderControls();renderAudit();
}
function renderCases(){
 const out=$('caseItems');out.replaceChildren();
 if(!state.cases.length)line(out,'Noch keine Fälle','Ersten Vorgang oben anlegen.');
 for(const c of state.cases){
  const pending=state.tasks.filter(t=>t.caseId===c.id&&t.status!=='done').length;
  line(out,short(c.ref,40),short(c.label,160)+' · '+(c.state==='closed'?'Abgeschlossen':'Offen')+' · '+pending+' Aufgaben nicht abgeschlossen',tools=>{
   if(c.state!=='closed')action(tools,'Abschließen',()=>{
    if(!state.tasks.some(t=>t.caseId===c.id)||pending)throw Error('Fallabschluss benötigt mindestens eine erledigte Aufgabe und keine offenen/negativen Aufgaben.');
    c.state='closed';c.closedAt=iso();commit('case_closed',c.ref+' abgeschlossen');
   });
   action(tools,'Entfernen',()=>{if(!confirm('Fall inklusive zugeordneter Aufgaben wirklich löschen?'))return;
    state.cases=state.cases.filter(x=>x.id!==c.id);state.tasks=state.tasks.filter(x=>x.caseId!==c.id);commit('case_removed',c.ref+' entfernt')});
  });
 }
 pick('taskCase',state.cases.filter(c=>c.state==='open').map(c=>({id:c.id,label:c.ref})));
 $('taskForm').querySelector('button').disabled=!state.cases.some(c=>c.state==='open');
}
function renderTasks(){
 const out=$('taskItems');out.replaceChildren();
 if(!state.tasks.length)line(out,'Keine Aufgaben','Zuerst Fall anlegen, dann Arbeitsauftrag hinzufügen.');
 const staff=state.team.map(s=>({id:s.id,label:s.label}));pick('taskStaff',[{id:'',label:'Nicht zugeordnet'},...staff]);
 for(const t of state.tasks){
  const c=state.cases.find(c=>c.id===t.caseId),u=state.team.find(s=>s.id===t.staffId);
  line(out,short(t.title,200),'Fall: '+(c?.ref||'Gelöscht')+' · '+(u?.label||'Ohne Zuweisung')+' · '+t.status.toUpperCase()+(t.note?' · '+short(t.note,200):''),tools=>{
   if(t.status!=='done'){
    action(tools,'Erledigt',()=>{
     const note=prompt('Optionale Rückmeldung','');
     if(note===null)return;t.status='done';t.note=short(note,1000);t.respondedAt=iso();commit('task_done',t.title+' erledigt');
    });
    action(tools,'Nicht erledigt',()=>{
     const note=prompt('Warum nicht erledigt? Pflichtbegründung');
     if(note===null)return;if(note.trim().length<3)throw Error('Eine Begründung mit mindestens drei Zeichen ist erforderlich.');
     t.status='not_done';t.note=short(note,1000);t.respondedAt=iso();commit('task_not_done',t.title+' nicht erledigt');
    });
   }
   action(tools,'Löschen',()=>{if(!confirm('Aufgabe löschen?'))return;state.tasks=state.tasks.filter(x=>x.id!==t.id);commit('task_removed',t.title)});
  });
 }
}
function renderCalendar(){
 const out=$('calendarItems');out.replaceChildren();
 const events=[...state.calendar].sort((a,b)=>a.start.localeCompare(b.start));
 if(!events.length)line(out,'Keine Termine','Lokale Termine oben erfassen.');
 for(const a of events)line(out,short(a.title,160),stamp(a.start)+' · '+a.minutes+' Minuten',tools=>{
  action(tools,'Löschen',()=>{state.calendar=state.calendar.filter(x=>x.id!==a.id);commit('appointment_removed',a.title)});
 });
}
function renderInventory(){
 const out=$('inventoryItems');out.replaceChildren();
 if(!state.inventory.length)line(out,'Keine Materialien','Technische Artikel oben anlegen.');
 for(const item of state.inventory)line(out,short(item.code,50)+' · '+short(item.name,160),'Bestand: '+item.count+' Stück',tools=>{
  action(tools,'−1',()=>{requirement('inventory');if(item.count<1)throw Error('Kein negativer Bestand erlaubt.');item.count--;commit('stock_issue',item.code+' −1')});
  action(tools,'+1',()=>{requirement('inventory');if(item.count>=100000)throw Error('Bestandsobergrenze erreicht.');item.count++;commit('stock_receipt',item.code+' +1')});
  action(tools,'Entfernen',()=>{if(!confirm('Artikel löschen?'))return;state.inventory=state.inventory.filter(x=>x.id!==item.id);commit('stock_removed',item.code)});
 });
}
function renderTeam(){
 const out=$('teamItems');out.replaceChildren();if(!state.team.length)line(out,'Noch keine Teamprofile','Lokal ein Kürzel hinzufügen.');
 const roles={owner:'Praxisleitung',doctor:'Arzt',employee:'Mitarbeiter',accountant:'Steuerberatung'};
 for(const s of state.team)line(out,short(s.label,70),roles[s.role]||'Mitarbeiter',tools=>{
  action(tools,'Entfernen',()=>{if(!confirm('Profil aus lokaler Liste entfernen?'))return;state.team=state.team.filter(x=>x.id!==s.id);for(const t of state.tasks)if(t.staffId===s.id)t.staffId='';commit('staff_removed',s.label)});
 });
}
function renderControls(){
 const out=$('switches');out.replaceChildren();
 const labels={cases:'Fallanlage',tasks:'Aufgabenanlage',calendar:'Terminverwaltung',inventory:'Inventurbuchung',team:'Teamliste',studio:'Lokale STL-Prüfung'};
 for(const k of Object.keys(labels)){
  const row=el('div');row.className='switch';const label=el('label',labels[k]);const c=document.createElement('input');c.type='checkbox';c.checked=state.switches[k];c.setAttribute('aria-label',labels[k]);c.onchange=()=>{state.switches[k]=c.checked;commit('owner_switch',labels[k]+(c.checked?' aktiviert':' pausiert'))};row.append(label,c);out.append(row);
 }
}
function renderAudit(){
 const out=$('auditItems');out.replaceChildren();if(!state.audit.length)line(out,'Keine Aktionen','Alle lokalen Änderungen werden hier dokumentiert.');
 for(const e of state.audit.slice(0,120))line(out,short(e.type,80),stamp(e.at)+' · '+short(e.detail,180));
}
function panelOpen(id){
 if(!$('p-'+id))return;
 document.querySelectorAll('nav button[data-panel]').forEach(b=>{let active=b.dataset.panel===id;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active?'true':'false')});
 document.querySelectorAll('main .panel').forEach(p=>p.hidden=p.id!=='p-'+id);
}
document.querySelectorAll('nav button[data-panel]').forEach(b=>b.onclick=()=>panelOpen(b.dataset.panel));
$('caseForm').onsubmit=check(()=>{
 requirement('cases');const ref=$('caseRef').value.trim().toUpperCase(),label=short($('caseLabel').value.trim(),150);
 if(!/^[A-Z0-9_-]{3,32}$/.test(ref))throw Error('Fallkürzel ungültig');
 if(state.cases.some(c=>c.ref===ref))throw Error('Fallkürzel existiert bereits.');
 state.cases.push({id:uid(),ref,label,state:'open',created:iso()});$('caseForm').reset();commit('case_created',ref+' angelegt');
});
$('taskForm').onsubmit=check(()=>{
 requirement('tasks');const caseId=$('taskCase').value,title=short($('taskTitle').value.trim(),180),staffId=$('taskStaff').value;
 if(title.length<3||!state.cases.some(c=>c.id===caseId&&c.state==='open'))throw Error('Fall oder Aufgabe nicht gültig.');
 state.tasks.push({id:uid(),caseId,title,staffId,status:'open',created:iso(),note:''});$('taskForm').reset();commit('task_created',title+' angelegt');
});
$('calendarForm').onsubmit=check(()=>{
 requirement('calendar');const title=short($('apptTitle').value.trim(),150),start=$('apptTime').value,minutes=Number($('apptMinutes').value);
 if(title.length<3||!start||!Number.isInteger(minutes)||minutes<5||minutes>360)throw Error('Ungültiger Termin');
 state.calendar.push({id:uid(),title,start,minutes,created:iso()});$('calendarForm').reset();commit('appointment_created',title+' eingetragen');
});
$('inventoryForm').onsubmit=check(()=>{
 requirement('inventory');const code=$('stockCode').value.trim().toUpperCase(),name=short($('stockName').value.trim(),150),count=Number($('stockCount').value);
 if(!/^[A-Z0-9_-]{3,32}$/.test(code)||name.length<3||!Number.isInteger(count)||count<0||count>100000)throw Error('Materialdaten ungültig');
 if(state.inventory.some(s=>s.code===code))throw Error('Artikelnummer existiert bereits');
 state.inventory.push({id:uid(),code,name,count});$('inventoryForm').reset();commit('stock_added',code+' erfasst');
});
$('teamForm').onsubmit=check(()=>{
 requirement('team');const label=short($('staffName').value.trim(),50),role=$('staffRole').value;
 if(label.length<2||!['owner','doctor','employee','accountant'].includes(role))throw Error('Ungültiges Teamprofil');
 state.team.push({id:uid(),label,role});$('teamForm').reset();commit('staff_added',label+' angelegt');
});
function download(name,content,type){
 const url=URL.createObjectURL(new Blob([content],{type}));
 const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function exportJson(){audit('export','JSON-Sicherung exportiert');save();download('PIGA-ORTHO-3D-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(state,null,2),'application/json');renderAll();msg('Lokale Datensicherung erstellt.')}
$('export').onclick=exportJson;$('exportTop').onclick=exportJson;
$('exportCsv').onclick=()=>{
 const rows=[['Artikelnummer','Bezeichnung','Bestand'],...state.inventory.map(x=>[x.code,x.name,x.count])];
 const csv=rows.map(row=>row.map(s=>'"'+String(s).replace(/"/g,'""').replace(/^[=+\-@\t]/,'\\$&')+'"').join(';')).join('\r\n');
 download('PIGA-ORTHO-Inventur.csv','\uFEFF'+csv,'text/csv;charset=utf-8');msg('Inventur-CSV erstellt.');
};
$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  if(file.size>2000000)throw Error('Sicherung darf höchstens 2 MB groß sein.');
  const d=JSON.parse(await file.text());
  if(d.version!==1||!['cases','tasks','calendar','inventory','team','audit'].every(k=>Array.isArray(d[k])))throw Error('Ungültiges PIGA-ORTHO-Sicherungsformat.');
  if(!confirm('Lokale Daten mit der ausgewählten Sicherung ersetzen?'))return;
  state={...defaults(),...d};
  for(const k of ['cases','tasks','calendar','inventory','team','audit'])state[k]=safeList(state[k]);
  if(!state.switches||typeof state.switches!=='object')state.switches=defaults().switches;
  commit('import','Lokale Sicherung eingelesen');
 }catch(err){msg(err.message,true)}finally{e.target.value=''}
};
$('enableAll').onclick=()=>{for(const k of Object.keys(state.switches))state.switches[k]=true;commit('owner_switch','Alle lokalen Module aktiviert')};
$('stopAll').onclick=()=>{for(const k of Object.keys(state.switches))state.switches[k]=false;commit('owner_switch','Neue lokale Einträge pausiert')};
$('erase').onclick=()=>{if(!confirm('ALLE lokalen Fälle, Termine, Aufgaben, Profile und Ereignisse endgültig von diesem Gerät löschen?'))return;
 state=defaults();commit('reset','Lokaler Gerätebestand zurückgesetzt')};
$('offlineCheck').onclick=()=>msg(navigator.onLine?'Browser meldet Verbindung. Die App speichert trotzdem ausschließlich auf diesem Gerät.':'Browser meldet offline. Lokale Funktionen bleiben verfügbar.');
$('stlInput').onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  requirement('studio');if(file.size<30||file.size>25*1024*1024)throw Error('STL muss 30 Byte bis 25 MiB groß sein.');
  const data=await file.arrayBuffer(),dv=new DataView(data);
  let triangles=0,bounds=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity],binary=false;
  if(data.byteLength>=84){
   const count=dv.getUint32(80,true);
   if(count>0&&84+count*50===data.byteLength){
    binary=true;triangles=count;
    for(let i=0;i<count;i++){const start=84+i*50;
     for(let j=0;j<3;j++){
      const x=dv.getFloat32(start+12+j*12,true),y=dv.getFloat32(start+16+j*12,true),z=dv.getFloat32(start+20+j*12,true);
      if(![x,y,z].every(Number.isFinite))throw Error('Ungültige, nichtendliche STL-Koordinaten.');
      bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.min(bounds[2],z);
      bounds[3]=Math.max(bounds[3],x);bounds[4]=Math.max(bounds[4],y);bounds[5]=Math.max(bounds[5],z);
     }
    }
   }
  }
  if(!binary){
   const txt=new TextDecoder('utf-8',{fatal:false}).decode(data);
   const matches=txt.matchAll(/vertex\s+([-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)\s+([-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)\s+([-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)/g);
   let vertices=0;
   for(const m of matches){let p=[Number(m[1]),Number(m[2]),Number(m[3])];if(!p.every(Number.isFinite))throw Error('Ungültige Koordinaten.');
    for(let a=0;a<3;a++){bounds[a]=Math.min(bounds[a],p[a]);bounds[a+3]=Math.max(bounds[a+3],p[a])}vertices++;
   }
   if(vertices<3||vertices%3!==0)throw Error('Kein plausibles STL-Dreiecksmodell erkannt.');
   triangles=vertices/3;
  }
  const sha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(n=>n.toString(16).padStart(2,'0')).join('');
  const measurements=bounds.slice(0,3).map((n,i)=>(bounds[i+3]-n).toFixed(2)).join(' × ');
  const out=$('stlSummary');out.replaceChildren();
  line(out,file.name,triangles.toLocaleString('de-DE')+' Dreiecke · '+measurements+' STL-Einheiten · '+(binary?'Binär-STL':'ASCII-STL'));
  line(out,'SHA-256-Dateihash',sha);
  audit('stl_inspected','STL '+short(file.name,80)+' · '+triangles+' Flächen · SHA256 '+sha);save();msg('STL lokal geometrisch geprüft. Keine medizinische Schlussfolgerung.');
 }catch(err){msg(err.message,true)}finally{e.target.value=''}
};
let promptEvent=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;$('install').hidden=false});
$('install').onclick=async()=>{if(promptEvent){await promptEvent.prompt();promptEvent=null;$('install').hidden=true}};
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
renderAll();
const allowedPanels=new Set(['overview','cases','tasks','calendar','inventory','team','studio','reports','controls']);
const navigateFromHash=()=>{const panel=decodeURIComponent(location.hash.slice(1));panelOpen(allowedPanels.has(panel)?panel:'overview');};
window.addEventListener('hashchange',navigateFromHash);
navigateFromHash();
})();