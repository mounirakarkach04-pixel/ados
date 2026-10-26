'use strict';
/* PIGA ORTHO 3D: local-first workspace services. No account, identity or server permission is implied. */
window.PigaLocal=(()=>{
 const KEY='piga-ortho-suite-v1';
 const empty=()=>({version:1,staff:[],shifts:[],workclock:[],absences:[],schedule:[],manuals:[],acks:[],payroll:[],stock:[],movements:[],costs:{},notices:[]});
 const types=Object.keys(empty()).filter(x=>Array.isArray(empty()[x]));
 let data;
 try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');data=raw&&raw.version===1?raw:empty()}catch{data=empty()}
 for(const field of types)if(!Array.isArray(data[field]))data[field]=[];
 const $=id=>document.getElementById(id);
 const set=(id,s)=>{const el=$(id);if(el)el.textContent=String(s??'');return el};
 const show=(id,yes=true)=>{const e=$(id);if(e)e.hidden=!yes;return e};
 const iso=()=>new Date().toISOString();
 const id=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
 const val=id=>$(id)?.value??'';
 const num=id=>{const v=Number(val(id));return Number.isFinite(v)?v:0};
 const fmt=x=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(x);
 const money=x=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(x);
 const date=x=>x?new Date(x).toLocaleString('de-DE'):'—';
 const el=(tag,text,cls)=>{const o=document.createElement(tag);if(text!==undefined)o.textContent=String(text);if(cls)o.className=cls;return o};
 const button=(text,action)=>{const b=el('button',text);b.type='button';b.addEventListener('click',action);return b};
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));window.dispatchEvent(new Event('piga-local-update'));return true}catch{alert('Lokaler Speicher nicht verfügbar. Bitte Daten exportieren.');return false}};
 const row=(root,title,detail,buttons=[])=>{const wrap=el('div',undefined,'local-item');const h=el('strong',title);wrap.append(h);if(detail)wrap.append(el('p',detail));const tools=el('div',undefined,'local-actions');for(const [title,handler] of buttons)tools.append(button(title,handler));if(buttons.length)wrap.append(tools);root.append(wrap);return wrap};
 const download=(name,body,mime='text/plain;charset=utf-8')=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([body],{type:mime}));a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 const csv=(name,rows)=>download(name,'\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(';')).join('\r\n'),'text/csv;charset=utf-8');
 const notify=(msg)=>{data.notices.unshift({at:iso(),message:msg});data.notices=data.notices.slice(0,300);save()};
 const staff=()=>{let direct;try{direct=JSON.parse(localStorage.getItem('piga-ortho-direct-v1')||'null')}catch{}
 const imported=Array.isArray(direct?.team)?direct.team.map(s=>({id:s.id,label:String(s.label||'').slice(0,70),role:s.role})):[];return [...data.staff,...imported.filter(s=>!data.staff.some(x=>x.id===s.id))]};
 };
 const duration=(a,b)=>Math.max(0,(new Date(b).getTime()-new Date(a).getTime())/60000);
 return {data,$,set,show,val,num,fmt,money,date,id,iso,el,button,row,download,csv,notify,save,staff,duration};
})();