'use strict';
/* Ortho PIGA: local cross-module workflow orchestration, no cloud or device authority. */
(async()=>{
 const S=window.PigaDeviceStore,C=window.OrthoHandoffCore,$=id=>document.getElementById(id);
 if(!S||!C){$('handoffNotice').textContent='Lokale Werkzeugmodule konnten nicht geladen werden.';return;}
 const NEW=()=>({version:1,cases:[],tasks:[],calendar:[],inventory:[],team:[],audit:[],switches:{cases:true,tasks:true,calendar:true,inventory:true,team:true,studio:true}});
 const fallback=key=>{try{return JSON.parse(localStorage.getItem(S.keys[key])||'null')}catch{return null}};
 const clone=o=>structuredClone(o);
 let direct=NEW(),suite=null,selected='',working=false;
 const notification=(s,problem=false)=>{const e=$('handoffNotice');e.textContent=s;e.dataset.state=problem?'warning':'good'};
 const span=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=String(value??'');if(cls)e.className=cls;return e};
 const label=(id,s,state)=>{const e=$(id);e.textContent=s;e.dataset.state=state||''};
 const date=s=>s?new Date(s).toLocaleString('de-DE'):'–';
 const name=id=>direct.cases.find(c=>c.id===id)?.ref||'Unbekannter Auftrag';
 async function latest(){
  let d=null,v=null;
  try{await S.flush();d=(await S.get('direct'))?.data;v=(await S.get('suite'))?.data;}catch{}
  if(!d)d=fallback('direct');
  if(!v)v=fallback('suite');
  if(d?.version===1&&Array.isArray(d.cases)&&Array.isArray(d.tasks)&&Array.isArray(d.audit)&&Array.isArray(d.calendar))direct=d;
  else direct=NEW();
  suite=v?.version===1?v:null;
 }
 async function write(action){
  if(working)return;
  working=true;
  for(const button of document.querySelectorAll('#content button'))button.disabled=true;
  try{
   await latest();
   const result=await action(direct,suite);
   if(result===false)return;
   const safe=clone(direct);
   try{await S.save('direct',safe);await S.flush()}catch(e){
    // Explicit fallback if IndexedDB is unavailable: the former local app remains usable.
    notification('IndexedDB nicht verfügbar – Eintrag im Browser-Ersatzspeicher. Bitte verschlüsselt sichern. '+e.message,true);
   }
   try{localStorage.setItem(S.keys.direct,JSON.stringify(safe))}catch(e){notification('Speicher voll. Neue Eingabe konnte nicht vollständig gespiegelt werden.',true)}
  }catch(e){notification('Aktion nicht abgeschlossen: '+String(e.message||e),true)}
  finally{working=false;for(const button of document.querySelectorAll('#content button'))button.disabled=false;await update();}
 }
 function chooseCase(){
  const list=$('caseSelect'),current=selected||list.value;
  list.replaceChildren();
  for(const c of direct.cases){
   const opt=new Option((c.state==='closed'?'✓ ':'')+c.ref+(c.label?' · '+c.label:''),c.id);
   list.append(opt);
  }
  if(!direct.cases.length){list.append(new Option('Ersten Testauftrag anlegen',''));selected=''}
  else{
   selected=direct.cases.some(c=>c.id===current)?current:direct.cases.find(c=>c.state==='open')?.id||direct.cases[0].id;
   list.value=selected;
  }
 }
 function availability(){
  const list=C.materialOptions(direct,suite),code=$('materialCode'),before=code.value;
  code.replaceChildren();
  if(!list.length)code.append(new Option('Noch keine Materialien · zur Inventur wechseln',''));
  for(const item of list)code.append(new Option(item.label+' · '+item.code+' · '+item.qty+' '+item.unit,item.code));
  const chosen=direct.cases.find(c=>c.id===selected)?.handoff?.material?.code;
  if(list.some(i=>i.code===chosen))code.value=chosen;
  else if(list.some(i=>i.code===before))code.value=before;
  const item=direct.cases.find(c=>c.id===selected)?.handoff?.material;
  if(item?.quantity)$('materialQuantity').value=item.quantity;
  $('materialForm').querySelector('button').disabled=!list.length||!selected;
 }
 function displaySteps(a){
  const root=$('steps');root.replaceChildren();
  if(!selected){root.append(span('p','Wähle oder erstelle zuerst einen technischen Testauftrag.'));return;}
  a.tasks.forEach((t,i)=>{
   const box=span('div','', 'handoff-step');
   box.append(span('span',String(i+1).padStart(2,'0'),'step-index'));
   const detail=span('div','');detail.append(span('strong',t.label));
   const task=t.task;
   detail.append(span('small',t.isHumanApproval?'Separate verantwortliche Freigabe notwendig · keine automatische Autorisierung':
    (task?.status==='done'?'Aufgabenstatus: erledigt':'Status: offen')+' · '+t.description));
   box.append(detail);
   if(t.isHumanApproval)box.append(span('span','EXTERN · '+(t.key==='gate2'?'BLOCK':'DELAY'),'protected'));
   else{
    const b=span('button',task?.status==='done'?'Erneut öffnen':'Erledigt markieren');
    b.type='button';b.disabled=!task||(!t.complete&&t.key==='geometry'&&!a.stl);
    b.addEventListener('click',()=>{void write(d=>{
      C.markTask(d,selected,t.key,task?.status!=='done','Lokale technische Arbeitsbestätigung (keine klinische Freigabe)');
      return true;
    });});box.append(b);
   }
   root.append(box);
  });
 }
 function render(){
  chooseCase();
  const open=direct.cases.filter(c=>c.state==='open');
  $('countCases').textContent=open.length;
  $('countTasks').textContent=direct.tasks.filter(t=>t.status!=='done').length;
  $('countReady').textContent=open.filter(c=>C.assess(direct,suite,c.id).technicalReady).length;
  $('countWarnings').textContent=C.materialOptions(direct,suite).filter(i=>i.qty<0.001).length;
  const c=direct.cases.find(c=>c.id===selected),a=selected?C.assess(direct,suite,selected):null;
  $('seedTasks').disabled=!c||c.state!=='open';$('handoffStl').disabled=!c||c.state!=='open';
  $('reviewForm').querySelector('button').disabled=!c||c.state!=='open';
  $('downloadReport').disabled=!c;$('printReport').disabled=!c;
  $('caseState').textContent=c?c.ref+' · '+(c.state==='closed'?'Abgeschlossen':'Offen')+' · '+(c.label||'Technischer Auftrag'):
   'Noch kein Auftrag – lege einen Testfall an oder starte das Beispiel.';
  availability();
  if(!a){label('stlState','Keine Datei ausgewählt. Nur die STL-Prüfung wird gespeichert.');
    label('materialState','Erfasste lokale Materialien werden angezeigt.');
    label('readiness','Bitte einen Auftrag auswählen.','warning');
    $('nextStep').textContent='Zuerst Auftragskennung anlegen.';displaySteps({tasks:[]});return;}
  label('stlState',a.stl?'TECHNISCH GEPRÜFT · '+a.stl.format.toUpperCase()+' · '+a.stl.triangles.toLocaleString('de-DE')+
   ' Dreiecke · SHA-256 '+a.stl.sha256.slice(0,19)+'…':'STL-Prüfung offen.',a.stl?'good':'warning');
  label('materialState',a.materialSelected?(a.materialAvailable?'Ausreichender TESTBESTAND: ':'MATERIALWARNUNG: ')+
   (a.material?.label||'Artikel')+' · '+(a.material?.qty??'unbekannt')+' vorhanden / '+a.requested+' benötigt':
   'Bitte lokalen Materialartikel und Sollmenge auswählen.',a.materialAvailable?'good':'warning');
  displaySteps(a);
  label('readiness',a.technicalReady?'TECHNISCH ZUR FACHLICHEN SICHTUNG VORBEREITET':'TECHNISCH NOCH OFFEN',a.technicalReady?'good':'warning');
  $('nextStep').textContent=a.technicalReady?'Nächster Schritt: externe fachliche Prüfung; Druckfreigabe bleibt BLOCK.':
   'Noch zu erledigen: '+(a.missing.join(' · ')||'Arbeitsplan prüfen')+'. Gate 2 weiterhin BLOCK.';
  const next=(direct.calendar||[]).filter(x=>x.refId===selected).sort((x,y)=>x.start.localeCompare(y.start)).slice(0,3);
  $('reviewState').textContent=next.length?'Bereits eingetragen: '+next.map(x=>date(x.start)).join(' · '):
   'Noch kein technischer Prüftermin für diesen Auftrag erfasst.';
 }
 async function update(){try{await latest();render()}catch(e){notification('Daten konnten nicht geladen werden: '+String(e.message),true)}}
 $('caseSelect').onchange=()=>{selected=$('caseSelect').value;render()};
 $('newCaseForm').onsubmit=e=>{e.preventDefault();void write(d=>{
  if(d.switches?.cases===false)throw Error('Fallanlage ist in der lokalen Inhabersteuerung pausiert.');
  const c=C.addCase(d,$('newRef').value,$('newLabel').value);selected=c.id;
  C.log(d,'handoff_case_created','Technischer Testauftrag '+c.ref);
  $('newCaseForm').reset();notification('Testauftrag '+c.ref+' angelegt.');return true;
 })};
 $('exampleCase').onclick=()=>{void write(d=>{
  if(d.switches?.cases===false||d.switches?.tasks===false)throw Error('Fall- oder Aufgabenanlage ist pausiert.');
  const suffix=String(Date.now()).slice(-6),c=C.addCase(d,'DEMO-'+suffix,'Synthetischer Praxis-Labor-Ablauf');
  selected=c.id;C.seed(d,c.id);C.log(d,'handoff_example_created','Synthetischer Ablauf '+c.ref);
  notification('Beispielauftrag und sechs Schritte erstellt. Als Nächstes eine synthetische STL-Datei prüfen.');return true;
 })};
 $('seedTasks').onclick=()=>{void write(d=>{
  const n=C.seed(d,selected);C.log(d,'handoff_plan_added',name(selected)+' · '+n+' neue Arbeitsschritte');
  notification(n+' fehlende Schritte ergänzt; bestehende bleiben erhalten.');return true;
 })};
 $('handoffStl').onchange=async e=>{
  const file=e.target.files?.[0];if(!file||!selected)return;
  try{notification('STL-Datei wird lokal überprüft …');
   const analysed=await C.analyzeFile(file),id=selected;
   await write(d=>{
    const caseEntry=d.cases.find(c=>c.id===id&&c.state==='open');if(!caseEntry)throw Error('Auftrag nicht mehr offen.');
    caseEntry.handoff??={};caseEntry.handoff.stl=analysed;
    C.log(d,'handoff_stl_checked',caseEntry.ref+' · '+analysed.format+' · SHA256 '+analysed.sha256.slice(0,28));
    notification('STL-Grundprüfung gespeichert; Dateiinhalt wurde nicht abgelegt.');return true;
   });
  }catch(err){notification('STL-Prüfung abgebrochen: '+String(err.message),true)}
  finally{e.target.value=''}
 };
 $('materialForm').onsubmit=e=>{e.preventDefault();void write((d,s)=>{
  const code=$('materialCode').value,quantity=$('materialQuantity').value;
  if(!C.materialOptions(d,s).some(x=>x.code===code))throw Error('Materialartikel wurde nicht im aktuellen Gerätebestand gefunden.');
  C.assignMaterial(d,selected,code,quantity);
  notification('Materialbedarf zugeordnet, keine Lagerbewegung ausgelöst.');return true;
 })};
 $('reviewForm').onsubmit=e=>{e.preventDefault();void write(d=>{
  const c=d.cases.find(c=>c.id===selected&&c.state==='open');if(!c)throw Error('Auftrag nicht offen.');
  if(d.switches?.calendar===false)throw Error('Lokaler Kalender wurde pausiert.');
  const start=$('reviewAt').value,minutes=Number($('reviewMins').value),t=Date.parse(start);
  if(!Number.isFinite(t)||t<Date.now()-60000||![15,30,45,60].includes(minutes))throw Error('Gültigen zukünftigen technischen Prüftermin auswählen.');
  if(d.calendar.some(a=>a.refId===c.id&&Date.parse(a.start)===t))throw Error('Dieser Prüftermin existiert bereits.');
  d.calendar.push({id:crypto.randomUUID(),title:'Technischer Prüfpunkt · '+c.ref,refId:c.id,start:new Date(t).toISOString(),minutes,created:new Date().toISOString()});
  C.log(d,'handoff_review_scheduled',c.ref+' · '+new Date(t).toISOString());
  $('reviewForm').reset();notification('Testtermin in den bestehenden lokalen Kalender übernommen.');return true;
 })};
 async function download(){
  if(!selected)return;
  try{
   await latest();const a=C.assess(direct,suite,selected);
   if(!a.case)throw Error('Auftrag nicht gefunden.');
   const payload={schema:'piga-ortho-technical-handoff.v1',exportedAt:new Date().toISOString(),
    case:{ref:a.case.ref,label:a.case.label,state:a.case.state},gate1:'DELAY',gate2:'BLOCK',
    clinicalAuthority:'NOT_ASSIGNED',deviceActions:0,model:a.stl||null,
    material:a.material?{sku:a.material.code,needed:a.requested,available:a.material.qty,source:a.material.source}:null,
    technicalReady:a.technicalReady,missing:a.missing,
    taskStates:a.tasks.map(t=>({key:t.key,label:t.label,status:t.task?.status||'unplanned',protected:t.isHumanApproval})),
    note:'TECHNISCHE EVALUATION. Keine klinische Freigabe, keine Druckberechtigung, keine digitale Signatur.'};
   const bytes=new TextEncoder().encode(JSON.stringify(payload));
   const hash=await crypto.subtle.digest('SHA-256',bytes);
   const digest=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
   const documentBody=JSON.stringify({payload,payloadSha256:digest,sha256Scope:'JSON.stringify(payload) UTF-8'},null,2);
   const url=URL.createObjectURL(new Blob([documentBody],{type:'application/json'}));
   const el=document.createElement('a');el.href=url;el.download='PIGA-ORTHO-HANDOFF-'+a.case.ref+'.json';
   document.body.append(el);el.click();el.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
   notification('Technische Übergabeakte exportiert. SHA-256: '+digest.slice(0,18)+'…');
  }catch(err){notification('Export fehlgeschlagen: '+String(err.message),true)}
 }
 $('downloadReport').onclick=()=>{void download()};
 $('printReport').onclick=()=>window.print();
 if(typeof BroadcastChannel!=='undefined'){
  const bc=new BroadcastChannel('piga-ortho-device-updates');
  bc.onmessage=e=>{if(e.data?.name==='direct'||e.data?.name==='suite')void update()};
 }
 window.addEventListener('pageshow',()=>{if(!working)void update()});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!working)void update()});
 const initialCase=new URLSearchParams(location.hash.slice(1)).get('case');
 if(initialCase&&/^[\w-]{1,90}$/.test(initialCase))selected=initialCase;
 try{await S.initialize('direct');await update()}catch(err){notification('Geräte-Datenbank: '+String(err.message),true)}
})();
