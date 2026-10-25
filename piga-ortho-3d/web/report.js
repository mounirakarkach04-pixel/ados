'use strict';(()=>{
 const $=id=>document.getElementById(id);
 let sourceData=null;
 const asText=x=>x===null||x===undefined?'—':String(x);
 const str=(x,max=200)=>asText(x).slice(0,max);
 const date=s=>{try{return new Date(s).toLocaleString('de-DE');}catch{return str(s,45);}};
 const cells=(id,rows)=>{const root=$(id);root.textContent='';rows.forEach(([k,v])=>{const row=document.createElement('tr');const th=document.createElement('th');th.textContent=k;const td=document.createElement('td');td.textContent=str(v,600);row.append(th,td);root.append(row);});};
 const text=(id,v)=>$(id).textContent=str(v,1300);
 const alert=(msg,type='')=>{const box=$('alert');box.className='alert screen-only '+type;box.textContent=msg;};
 async function digest(value){if(!crypto?.subtle)return null;const arr=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(arr)].map(x=>x.toString(16).padStart(2,'0')).join('');}
 async function verify(list,terminal){
   if(!list.length)return {valid:false,why:'Keine Ereignisse'};
   if(!crypto?.subtle)return {valid:false,why:'SHA-256 nicht verfügbar'};
   let previous='GENESIS';
   for(let i=0;i<list.length;i++){
     const e=list[i];if(!e||e.sequence!==i+1||e.previousSha256!==previous||typeof e.sha256!=='string')return {valid:false,why:'Fehlende oder inkonsistente Sequenz bei #'+(i+1)};
     const payload={...e};delete payload.sha256;
     const hash=await digest(JSON.stringify(payload));
     if(hash!==e.sha256)return {valid:false,why:'Hash-Abweichung bei #'+(i+1)};
     previous=hash;
   }
   if(terminal&&terminal!==previous)return {valid:false,why:'Terminalwert weicht ab'};
   return {valid:true,why:'Lokal verkettete Ereignisse konsistent'};
 }
 const val=(obj,key)=>Object.prototype.hasOwnProperty.call(obj||{},key)?obj[key]:null;
 const recognized=x=>['piga-ortho-glassbox-export.v1','piga-ortho-report-input.v1'].includes(x?.schema);
 function pickLatest(events,type){return [...events].reverse().find(e=>e.type===type);}
 function own(obj){return obj&&typeof obj==='object'&&!Array.isArray(obj);}
 async function load(file){
   if(!recognized(file))throw Error('Schema unbekannt. Akzeptiert werden nur PIGA Glassbox v1 oder PIGA Report Input v1.');
   const events=Array.isArray(file.events)?file.events:[];if(events.length>2500)throw Error('Maximal 2500 Ereignisse zulässig.');
   if(JSON.stringify(file).length>1_500_000)throw Error('Datei ist zu groß.');
   const integrity=await verify(events,file.terminalSha256);
   sourceData=file;
   const loaded=events.length>0;
   const caseId=file.caseId||events.find(e=>e.caseId)?.caseId||null;
   const gate1=String(file.gate1||'UNKNOWN'),gate2=String(file.gate2||'BLOCK'),reverse=String(file.readback||'UNKNOWN');
   const importedModel=file.model||{},modelEvent=pickLatest(events,'STL_IMPORT');
   const modelDetails=own(modelEvent?.details)?modelEvent.details:{};
   const model={...modelDetails,...importedModel};
   const knownBounds=Array.isArray(model.bounds)&&model.bounds.length===3&&model.bounds.every(Number.isFinite);
   const status=integrity.valid?'KETTE KONSISTENT':'KETTE NICHT BESTÄTIGT';
   text('docStatus',status);text('source',file.schema);text('case',caseId||'Pseudonym nicht angegeben');text('when',file.exportedAt?date(file.exportedAt):date(new Date().toISOString()));
   text('gate1',gate1);text('gate2',gate2);text('reverse',reverse);text('integrity',integrity.valid?'PASS (LOKAL)':'UNKNOWN / FAIL');
   text('verdict',integrity.valid?'Die importierte SHA-256-Kette ist lokal konsistent. Dies bestätigt weder die Identität des Ausführenden noch klinische Richtigkeit, tatsächlichen Druckerfolg oder externe Manipulationssicherheit.':'Evidenzprüfung unvollständig: '+integrity.why+'. Keine technische oder klinische Freigabe ableitbar.');
   const unitStatus=file.unitVerified===true?'mm (separat verifiziert)':'UNBEKANNT – STL hat keine festgelegte Einheit';
   cells('modelTable',[
    ['Modellname',model.name||'Nicht dokumentiert'],
    ['SHA-256 der STL',model.sha256||model.sha||modelEvent?.modelSha256||'UNKNOWN'],
    ['Dreiecke',model.triangles??'UNKNOWN'],
    ['Dateigröße',Number.isFinite(model.fileBytes)?model.fileBytes+' Byte':'UNKNOWN'],
    ['Einheitenstatus',unitStatus],
    ['X / Y / Z in STL-Einheiten',knownBounds?model.bounds.map(n=>Number(n).toFixed(3)).join(' / '):'UNKNOWN'],
    ['Technische Geometrie',model.invalid===0?'Keine nicht-endlichen Koordinaten in geprüfter Probe':'Nicht vollständig nachgewiesen'],
    ['Biss-/Overjet-/Overbite-Wert','NICHT BERECHENBAR ohne Landmarken, validierte Ausrichtung und Einheit']
   ]);
   cells('gatesTable',[
    ['Gate 1 – Inference',gate1],
    ['Grundlage','Technische Ereignisse und Modellmetrik, keine klinische Validierung'],
    ['Gate 2 – Action',gate2],
    ['Vollzogene physische Aktion',events.some(e=>['ACTION_REQUEST','A7SEM_REVERSE'].includes(e.type))?'Befehlereignisse vorhanden – Readback separat bewerten':'Keine physische Wirkung aus den Daten bestätigt'],
    ['Autonomer Druckerstart','NEIN – ohne frische Freigabe BLOCK']
   ]);
   const has=x=>events.some(e=>e.type===x);
   const levels=[
    ['1 · Eingang',has('STL_IMPORT')?'BEOBACHTET':'UNKNOWN'],
    ['2 · Muster / Geometrie',loaded&&knownBounds?'TECHNISCH BEOBACHTET':'UNKNOWN'],
    ['3 · Kontext / Gate 1',gate1],
    ['4 · Zustandsübergang',events.some(e=>e.type.includes('GATE'))?'PROTOKOLLIERT':'UNKNOWN'],
    ['5 · Prüfung / Kontrolle',loaded?'Ereignisse vorhanden':'UNKNOWN'],
    ['6 · Wirksame Handlung',gate2==='ALLOW'?'GESONDERT ZU PRÜFEN':'BLOCK'],
    ['7 · Reverse / Ergebnis',reverse]
   ];
   const seven=$('seven');seven.textContent='';levels.forEach(([k,v])=>{const item=document.createElement('span');item.textContent=k+': '+v;seven.append(item);});
   const effect=pickLatest(events,'A7SEM_REVERSE');
   cells('reverseTable',[
    ['Absicht',effect?.details?.op||'Nicht nachgewiesen'],
    ['Gerät zuvor',effect?.details?.before||'UNKNOWN'],
    ['Gerät danach',effect?.details?.after||'UNKNOWN'],
    ['Dateiidentität',effect?.details?.fileMatches===true?'Im protokollierten Readback gleich':'UNKNOWN'],
    ['Verifizierter Effekt',reverse],
    ['Beweisgrenze', 'Druckauftrag/Status ≠ fertiges medizinisches Werkstück']
   ]);
   const cycles=events.filter(e=>e.type==='FINITE_WORKER_CYCLE');
   const ended=pickLatest(events,'FINITE_INFINITE_RESULT');
   text('loopStatement',cycles.length?'Die dokumentierten '+cycles.length+' Zyklen sind endliche technische Kontrollschritte. Es gibt keine nachgewiesene autonome Druckerwirkung. Fortsetzung nur als neuer begrenzter Prüfauftrag.':'Kein durchlaufener endlicher Zyklus dokumentiert. Kein unbegrenzter Hintergrundprozess nachgewiesen.');
   cells('loopTable',[['Ereignisse',cycles.length],['Start',pickLatest(events,'FINITE_INFINITE_START')?.time?date(pickLatest(events,'FINITE_INFINITE_START').time):'UNKNOWN'],['Abschluss',ended?.details?.status||'UNKNOWN'],['Externe Wirkung',ended?.details?.externalEffects===0?'0 protokolliert':'Nicht ausgeschlossen / UNKNOWN'],['Rücksprung','Nach neuer Freigabe und frischem Evidenzkontext']]);
   text('terminal',integrity.valid?file.terminalSha256||events.at(-1)?.sha256||'—':'NICHT VERIFIZIERT');
   const body=$('events');body.textContent='';
   if(!events.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=4;td.textContent='Keine Ereignisse vorhanden';tr.append(td);body.append(tr);}
   events.slice(0,300).forEach(e=>{const row=document.createElement('tr');[e.sequence,date(e.time),e.type,e.decision].forEach(val=>{const td=document.createElement('td');td.textContent=str(val,90);row.append(td);});body.append(row);});
   if(events.length>300){const row=document.createElement('tr'),td=document.createElement('td');td.colSpan=4;td.textContent='Weitere '+(events.length-300)+' Ereignisse im JSON; Druckakte auf 300 Zeilen begrenzt.';row.append(td);body.append(row);}
   text('openIssues','Offen: validierte STL-Einheit / Maße, KFO-Landmarken und Paarung der Kiefer, ärztliche Freigabe, echte Geräte- und Materialprüfung, PVS-/eGK-/KIM-Integration, Datensicherheit, vollständige klinische und regulatorische Bewertung. Ergebnis nur aus vorhandenen technischen Ereignissen ableitbar.');
   alert('Daten geladen: '+events.length+' Ereignisse. Integritätsstatus: '+integrity.why+'. Bitte als PDF speichern und unabhängig prüfen.',integrity.valid?'good':'error');
 }
 async function synthetic(){
  const ev=[];let last='GENESIS';
  for(const [type,decision,details] of [
    ['SESSION_INITIALIZED','OBSERVED',{version:'0.8',mode:'synthetic-only'}],
    ['STL_IMPORT','OBSERVED',{triangles:12,fileBytes:684,invalid:0,synthetic:true}],
    ['GATE1_EVALUATION','ALLOW',{technicalOnly:true}],
    ['FINITE_INFINITE_START','OBSERVED',{maxCycles:2,automaticActions:false}],
    ['FINITE_WORKER_CYCLE','OBSERVED',{cycle:1,externalEffects:0}],
    ['FINITE_WORKER_CYCLE','OBSERVED',{cycle:2,externalEffects:0}],
    ['FINITE_INFINITE_RESULT','OBSERVED',{status:'COMPLETED',externalEffects:0}]
  ]){const event={schema:'piga-ortho-event.v1',time:new Date().toISOString(),sequence:ev.length+1,type,decision,caseId:'CASE-DEMO-001',modelSha256:'synthetic-model-only',details,previousSha256:last};event.sha256=await digest(JSON.stringify(event));last=event.sha256;ev.push(event);}
  await load({schema:'piga-ortho-report-input.v1',exportedAt:new Date().toISOString(),caseId:'CASE-DEMO-001',gate1:'ALLOW',gate2:'BLOCK',readback:'UNKNOWN',model:{name:'SYNTHETISCHER TESTWÜRFEL',sha256:'synthetic-model-only',bounds:[2,2,2],triangles:12,invalid:0},events:ev,terminalSha256:last,unitVerified:false});
 }
 $('importAudit').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>1_500_000)throw Error('Maximal 1,5 MB');await load(JSON.parse(await f.text()));}catch(err){sourceData=null;alert('Import abgelehnt: '+err.message,'error');}e.target.value='';});
 $('example').addEventListener('click',()=>synthetic().catch(e=>alert(e.message,'error')));
 $('print').addEventListener('click',()=>{if(!sourceData){alert('Zuerst Daten übernehmen. Leere Akten nicht als vollständig ausgeben.','error');return;}if(window.PigaNative&&typeof window.PigaNative.printReport==='function')window.PigaNative.printReport();else window.print();});
 $('export').addEventListener('click',()=>{if(!sourceData)return alert('Keine Daten für JSON-Export','error');const file=new Blob([JSON.stringify(sourceData,null,2)],{type:'application/json'}),url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download='PIGA_ORTHO_GLASSBOX_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);});
 $('clear').addEventListener('click',()=>{sessionStorage.removeItem('piga-ortho-report-once');sourceData=null;location.replace('./report.html');});
 try{const raw=sessionStorage.getItem('piga-ortho-report-once');if(raw){sessionStorage.removeItem('piga-ortho-report-once');load(JSON.parse(raw)).catch(e=>alert('Sitzungsübernahme fehlgeschlagen: '+e.message,'error'));}}catch(e){alert('Sitzungsdaten konnten nicht gelesen werden.','error');}
})();