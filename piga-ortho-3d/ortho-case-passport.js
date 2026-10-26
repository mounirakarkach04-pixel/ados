'use strict';
/* Case-scoped deterministic technical handoff. This is NOT clinical/patient clearance. */
(()=>{
 const anchor=document.getElementById('orthoCasePassport');
 if(!anchor)return;
 const $=id=>document.getElementById(id),store=window.PigaDeviceStore;
 const msg=(value,error=false)=>{const n=$('passportStatus');n.textContent=value;n.dataset.state=error?'error':'ok'};
 const recent=async()=>{try{return (await store.get('direct'))?.data||null}catch{return null}};
 const legacy=()=>{try{return JSON.parse(localStorage.getItem('piga-ortho-direct-v1')||'null')}catch{return null}};
 const safe=items=>Array.isArray(items)?items.filter(x=>x&&typeof x==='object'):[];
 const get=async()=>await recent()||legacy()||{cases:[],tasks:[],audit:[]};
 const e=(tag,text)=>{const n=document.createElement(tag);n.textContent=text||'';return n};
 const choices=async()=>{
  const data=await get(),select=$('passportCase'),previous=select.value;
  const arr=safe(data.cases);select.replaceChildren();
  if(!arr.length){const option=e('option','Noch kein lokaler Testfall');option.value='';select.append(option);select.disabled=true;$('passportExport').disabled=true;msg('Bitte zuerst einen pseudonymen Testfall anlegen.');return;}
  select.disabled=false;$('passportExport').disabled=false;
  for(const item of arr){const option=e('option',String(item.ref||'Testfall').slice(0,38));option.value=String(item.id||'');select.append(option)}
  select.value=arr.some(x=>x.id===previous)?previous:String(arr[0].id||'');
  if(!select.value)select.selectedIndex=0;
  msg(arr.length+' lokale Testfälle gefunden. Der technische Fallpass berücksichtigt nur ausgewählte Daten.');
 };
 const sha=async bytes=>{const b=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')};
 async function build(){
  const state=await get(),ref=$('passportCase').value,c=safe(state.cases).find(x=>String(x.id)===ref);
  if(!c)throw Error('Der Fall wurde inzwischen entfernt. Bitte die Liste aktualisieren.');
  const tasks=safe(state.tasks).filter(t=>t.caseId===c.id);
  const done=tasks.filter(t=>t.status==='done').length,pending=tasks.filter(t=>t.status!=='done');
  const checks=[
   {id:'CASE_REF',state:c.ref?'OBSERVED':'UNKNOWN',note:'Pseudonyme technische Referenz'},
   {id:'TASK_CREATED',state:tasks.length?'OBSERVED':'DELAY',note:tasks.length+' technische Aufgaben erfasst'},
   {id:'TASK_COMPLETED',state:tasks.length&&pending.length===0?'OBSERVED':'DELAY',note:done+' von '+tasks.length+' Aufgaben erledigt'},
   {id:'GEOMETRY_EVIDENCE',state:'UNKNOWN',note:'STL-Hash ist bisher nicht fallbezogen verknüpft'},
   {id:'CLINICAL_APPROVAL',state:'UNKNOWN',note:'Keine ärztliche Prüfung oder medizinische Freigabe durchgeführt'},
   {id:'DEVICE_EFFECT',state:'BLOCK',note:'Keine Druck-/Geräteaktion durch diesen Fallpass zugelassen'}
  ];
  const payload={schema:'piga-ortho-technical-case-passport-v1',scope:'LOCAL_TEST_ONLY',
   exportedAt:new Date().toISOString(),caseRef:String(c.ref||'').slice(0,32),
   caseState:c.state==='closed'?'CLOSED':'OPEN',caseCreatedAt:c.created||null,
   taskCount:tasks.length,taskDone:done,taskPending:pending.length,
   taskStatuses:tasks.map(t=>({id:String(t.id||'').slice(0,80),status:String(t.status||'UNKNOWN').slice(0,30)})),
   evidenceChecks:checks,pigaGate1:'UNKNOWN',pigaGate2:'BLOCK',
   medicalDecision:'NOT_MADE',printerAction:'NOT_AUTHORIZED',realPatientDataAllowed:false,
   note:'Technischer Evaluationsnachweis aus Gerätedaten. Kein manipulationssicheres, signiertes oder medizinisch freigegebenes Dokument.'};
  const body=JSON.stringify(payload,null,2),digest=await sha(new TextEncoder().encode(body));
  return {...payload,integrity:{algorithm:'SHA-256',payloadHash:digest,
    limitation:'Hash belegt nur die Prüfsumme des hier exportierten Textinhalts; keine digitale Signatur und keine externe Vertrauensverankerung.'}};
 }
 $('passportRefresh').onclick=()=>{void choices()};
 $('passportExport').onclick=async()=>{
  try{
   msg('Technischer Fallpass wird erstellt …');
   const item=await build();
   const content=JSON.stringify(item,null,2),url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
   const a=e('a');a.href=url;a.download='PIGA-ORTHO-FALLPASS-'+item.caseRef.replace(/[^A-Z0-9_-]/gi,'_')+'.json';
   document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
   msg('Fallpass exportiert · '+item.taskDone+'/'+item.taskCount+' Aufgaben erledigt. Gate 2 bleibt BLOCK.');
  }catch(err){msg('Fallpass nicht erstellt: '+String(err.message||err).slice(0,180),true)}
 };
 window.addEventListener('focus',()=>{void choices()});
 window.addEventListener('storage',e=>{if(e.key==='piga-ortho-direct-v1')void choices()});
 void choices();
})();
