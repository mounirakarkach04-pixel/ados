'use strict';
/* PIGA ORTHO 3D v1.2 browser-local backend, no Supabase or user authentication.
   Evaluation only: no clinical records, no sensitive payroll/real employee records. */
window.OrthoLocalReady=(async()=>{
 const restored=await window.PigaDeviceStore.initialize('suite');
 window.OrthoLocal=(()=>{
 const STORE='piga-ortho-v12-local';
 const initial=()=>({version:1,staff:[],shifts:[],clock:[],absences:[],schedule:[],manuals:[],acks:[],payroll:[],inventory:[],movements:[],costs:{},notices:[]});
 const defaults=initial();
 let db=restored;if(!db){try{db=JSON.parse(localStorage.getItem(STORE)||'null')}catch{}}
 if(!db||db.version!==1||typeof db!=='object')db=initial();
 for(const key of Object.keys(defaults)){if(Array.isArray(defaults[key])&&!Array.isArray(db[key]))db[key]=[];}
 if(!db.costs||typeof db.costs!=='object')db.costs={};
 /* Import existing direct-workspace records only once; never overwrite originals. */
 if(!db.importedDirect){
  try{const direct=JSON.parse(localStorage.getItem('piga-ortho-direct-v1')||'null');
   if(direct?.version===1){
    for(const entry of Array.isArray(direct.team)?direct.team:[]){
     const name=String(entry.label||'').slice(0,80);
     if(name)db.staff.push({id:String(entry.id||uuid()),name,code:'LOCAL-'+String(db.staff.length+1).padStart(3,'0'),role:String(entry.role||'employee')});
    }
    for(const entry of Array.isArray(direct.inventory)?direct.inventory:[]){
     const sku=String(entry.code||'').slice(0,32),label=String(entry.name||'').slice(0,150);
     if(sku&&label)db.inventory.push({id:String(entry.id||uuid()),sku,label,category:'3D / Praxis',variant:'',unit:'Stück',quantity:Math.max(0,Number(entry.count)||0),minimum:0,incoming:0,leadDays:0,reserveDays:0,packSize:1});
    }
   }
  }catch{}
  db.importedDirect=true;
  try{localStorage.setItem(STORE,JSON.stringify(db))}catch{}
  window.PigaDeviceStore.save('suite',db).catch(()=>{});
 }
 function uuid(){return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}
 const $=id=>document.getElementById(id);
 const value=id=>String($(id)?.value??'').trim();
 const number=id=>{const v=Number(value(id));return Number.isFinite(v)?v:0};
 const text=(id,v)=>{if($(id))$(id).textContent=String(v??'');};
 const visible=(id,yes=true)=>{if($(id))$(id).hidden=!yes;};
 const date=x=>x?new Date(x).toLocaleString('de-DE'):'–';
 const format=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(Number(n)||0);
 const euro=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(n)||0);
 const now=()=>new Date().toISOString();
 const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=String(text);if(cls)node.className=cls;return node};
 const button=(label,callback)=>{const b=el('button',label);b.type='button';b.addEventListener('click',callback);return b};
 const showMsg=(id,msg,fail=false)=>{text(id,msg);const e=$(id);if(e){e.style.color=fail?'#b13f41':'#20746b';}};
 const clear=id=>{if($(id))$(id).replaceChildren()};
 const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(db));window.PigaDeviceStore.save('suite',db).catch(err=>{console.warn('Gerätedatenbank nicht gespeichert:',err.message)});window.dispatchEvent(new Event('ortho-local-change'));return true}catch{alert('Gerätespeicher voll oder gesperrt. Bitte eine Datensicherung exportieren.');return false}};
 const row=(container,title,detail,actions=[])=>{
  if(!container)return;const root=el('div',undefined,'record local-entry');
  const info=el('div');info.append(el('b',title),el('small',detail||''));root.append(info);
  const buttons=el('div',undefined,'local-actions');for(const [label,fn] of actions)buttons.append(button(label,fn));if(actions.length)root.append(buttons);
  container.append(root);return root;
 };
 const download=(name,content,mime='text/plain;charset=utf-8')=>{
  const url=URL.createObjectURL(new Blob([content],{type:mime}));const a=el('a');a.download=name;a.href=url;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
 };
 const safeCell=v=>{let s=String(v??'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};
 const csv=(name,rows)=>download(name,'\uFEFF'+rows.map(r=>r.map(safeCell).join(';')).join('\r\n'),'text/csv;charset=utf-8');
 const backup=()=>download('PIGA-ORTHO-LOCAL-'+now().slice(0,10)+'.json',JSON.stringify(db,null,2),'application/json');
 const banner=()=>{
  const root=document.querySelector('main');if(!root)return;
  const info=el('aside',undefined,'local-offline-banner');
  info.style.cssText='margin:10px auto 20px;max-width:1140px;padding:12px 16px;border-radius:12px;border:1px solid #9bc6c4;background:#e9f8f6;color:#174d54;font:14px/1.5 system-ui,sans-serif';
  info.append(el('strong','PIGA ORTHO 3D · v1.2 · ohne Anmeldung'));
  info.append(el('div','Die vorhandenen Module speichern Testdaten ausschließlich in diesem Browser. Keine Supabase-Abfragen, kein gemeinsamer Praxisdatenbestand. Keine realen Patienten- oder Personaldaten eingeben.'));
  info.append(button('Lokale Sicherung (JSON)',backup));
  const hub=el('a','Geräte-Datenbank & Worker →');hub.href='./device-hub.html';hub.style.cssText='display:inline-block;margin:10px 12px;color:#087c90;font-weight:750';info.append(hub);
  root.prepend(info);
  for(const id of ['authShell','loginPanel','locked','waitingPanel','pending'])$(id)?.remove();
  $('logout')?.remove();$('signoutPending')?.remove();
 };
 return {db,$,value,number,text,visible,date,format,euro,now,uuid,el,button,showMsg,clear,save,row,download,csv,backup,banner};
})();
 return window.OrthoLocal;
})();
