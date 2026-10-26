'use strict';
(async()=>{
 await window.OrthoLocalReady;
 const L=window.OrthoLocal,{db,$,value,text,visible,date,format,now,uuid,el,button,row,csv,save,showMsg}=L;
 L.banner();
 ['workspace','employeeTools','ownerArea','accountantArea','ownerNav','accountantNav'].forEach(id=>visible(id));
 text('roleGreeting','Guten Tag.');text('identity','Lokale Praxisansicht ohne Anmeldung');text('roleBadge','LOKAL · DIREKTZUGANG');text('staffId','LOCAL-001');
 $('payrollMonth').value=new Date().toISOString().slice(0,7);
 const me='LOCAL-001';
 const clock=db.clock;
 const clockState=()=>{let state='off';for(const event of clock){if(event.staff!==me)continue;if(event.type==='CLOCK_IN')state='working';if(event.type==='BREAK_START'&&state==='working')state='break';if(event.type==='BREAK_END'&&state==='break')state='working';if(event.type==='CLOCK_OUT')state='off';}return state;};
 function totals(events){let start=null,pausing=null,paused=0,minutes=0,incomplete=false;
  for(const event of events){const t=Date.parse(event.at);
   if(event.type==='CLOCK_IN'){if(start!==null)incomplete=true;start=t;pausing=null;paused=0}
   if(event.type==='BREAK_START'&&start!==null&&pausing===null)pausing=t;
   if(event.type==='BREAK_END'&&pausing!==null){paused+=Math.max(0,t-pausing);pausing=null}
   if(event.type==='CLOCK_OUT'&&start!==null){minutes+=Math.max(0,(t-start-paused)/60000);start=null;pausing=null;paused=0}
  }return {minutes,incomplete:incomplete||start!==null};
 }
 function renderClock(){
  const status=clockState(),labels={off:'Nicht erfasst',working:'Arbeitszeit läuft',break:'Pause läuft'};
  text('clockState',labels[status]);text('worked',format(totals(clock.filter(e=>e.staff===me&&e.at.slice(0,10)===now().slice(0,10))).minutes/60)+' h');
  const list=$('timeList');list.replaceChildren();
  for(const event of clock.slice().reverse().slice(0,40))row(list,event.type,date(event.at)+' · '+event.staff);
  if(!list.children.length)row(list,'Noch keine Zeitereignisse','Arbeitsbeginn drücken.');
  for(const [id,allow] of [['clockIn',status==='off'],['breakStart',status==='working'],['breakEnd',status==='break'],['clockOut',status==='working'||status==='break']])$(id).disabled=!allow;
 }
 for(const [id,type] of [['clockIn','CLOCK_IN'],['breakStart','BREAK_START'],['breakEnd','BREAK_END'],['clockOut','CLOCK_OUT']]){
  $(id).onclick=()=>{
   const allowed={CLOCK_IN:'off',BREAK_START:'working',BREAK_END:'break'};if(allowed[type]&&clockState()!==allowed[type])return showMsg('timeFeedback','Reihenfolge der Zeiterfassung prüfen.',true);
   if(type==='CLOCK_OUT'&&clockState()==='off')return showMsg('timeFeedback','Arbeitsbeginn fehlt.',true);
   if(type==='CLOCK_OUT'&&clockState()==='break')clock.push({id:uuid(),at:now(),staff:me,type:'BREAK_END'});
   clock.push({id:uuid(),at:now(),staff:me,type});save();renderClock();showMsg('timeFeedback','Zeitereignis lokal erfasst.');
  };
 }
 function renderAbsences(){
  const root=$('absenceList'),owner=$('ownerAbsences');root.replaceChildren();owner.replaceChildren();
  for(const x of db.absences.slice().reverse()){
   const description=x.from+' bis '+x.to+' · '+x.status;
   row(root,x.kind,description);
   row(owner,x.kind+' · '+x.staff,description,x.status==='pending'?[['Genehmigen',()=>setAbsence(x,'approved')],['Ablehnen',()=>setAbsence(x,'rejected')]]:[]);
  }
  if(!db.absences.length){row(root,'Keine lokalen Abwesenheiten','');row(owner,'Keine Meldungen','');}
 }
 function setAbsence(x,status){x.status=status;save();renderAbsences();}
 $('absenceForm').onsubmit=e=>{
  e.preventDefault();const from=value('absenceStart'),to=value('absenceEnd');
  if(!from||!to||from>to)return showMsg('absenceFeedback','Bitte gültige Datumsangaben prüfen.',true);
  db.absences.push({id:uuid(),staff:me,kind:value('absenceKind'),from,to,status:'pending',at:now()});save();$('absenceForm').reset();renderAbsences();
  showMsg('absenceFeedback','Abwesenheit lokal erfasst.');
 };
 function renderStaff(){
  const list=$('teamList');list.replaceChildren();const form=el('form');
  const name=el('input'),role=el('select');
  name.placeholder='Test-Mitarbeitername';name.required=true;name.minLength=2;name.maxLength=80;
  for(const [key,label] of [['employee','Mitarbeiter'],['doctor','Arzt'],['owner','Inhaber'],['accountant','Steuerberatung']])role.append(new Option(label,key));
  form.append(name,role,button('Lokales Teamprofil hinzufügen',()=>{}));
  form.querySelector('button').type='submit';
  form.onsubmit=e=>{e.preventDefault();const label=name.value.trim();if(label.length<2)return;
   db.staff.push({id:uuid(),name:label,code:'LOCAL-'+String(db.staff.length+2).padStart(3,'0'),role:role.value});save();renderStaff();renderSchedule();};
  list.append(form);
  for(const staff of db.staff)row(list,staff.name,staff.code+' · '+staff.role,[['Entfernen',()=>{if(!confirm('Lokales Testprofil entfernen?'))return;db.staff=db.staff.filter(s=>s.id!==staff.id);save();renderStaff();renderSchedule();}]]);
  const choices=$('schedulePerson'),selected=choices.value;choices.replaceChildren(new Option('Lokale Praxisleitung',me));
  for(const person of db.staff)choices.append(new Option(person.name+' ('+person.code+')',person.code));
  choices.value=[me,...db.staff.map(s=>s.code)].includes(selected)?selected:me;
 }
 function renderSchedule(){
  const root=$('scheduleList');root.replaceChildren();
  for(const x of db.schedule.slice().sort((a,b)=>a.from.localeCompare(b.from)))row(root,x.staff,date(x.from)+' – '+date(x.to),[['Löschen',()=>{db.schedule=db.schedule.filter(s=>s.id!==x.id);save();renderSchedule();}]]);
  if(!db.schedule.length)row(root,'Noch kein Dienstplan','');
 }
 $('scheduleForm').onsubmit=e=>{
  e.preventDefault();const from=value('scheduleStart'),to=value('scheduleEnd');
  if(!from||!to||Date.parse(from)>=Date.parse(to))return showMsg('scheduleFeedback','Schichtende muss nach Beginn liegen.',true);
  db.schedule.push({id:uuid(),staff:value('schedulePerson'),from:new Date(from).toISOString(),to:new Date(to).toISOString()});save();renderSchedule();
  showMsg('scheduleFeedback','Dienstplan lokal gespeichert.');
 };
 let choice=null;
 function renderManuals(){
  const owner=$('ownerManuals');owner.replaceChildren();const form=el('form'),title=el('input'),body=el('textarea');
  title.placeholder='Titel der Test-Unterweisung';title.required=true;title.minLength=3;title.maxLength=120;
  body.placeholder='Inhalt der Test-Unterweisung';body.required=true;body.minLength=10;body.maxLength=20000;body.rows=3;
  const add=button('Entwurf lokal anlegen',()=>{});add.type='submit';form.append(title,body,add);
  form.onsubmit=e=>{e.preventDefault();db.manuals.push({id:uuid(),title:title.value.trim(),body:body.value.trim(),revision:'LOCAL-1',published:false});save();renderManuals();};
  owner.append(form);
  for(const manual of db.manuals)row(owner,manual.title,manual.revision+' · '+(manual.published?'FREIGEGEBEN (LOKAL)':'ENTWURF'),manual.published?[]:[['Lokal freigeben',()=>{manual.published=true;save();renderManuals();}]]);
  const list=$('manualList');list.replaceChildren();
  for(const manual of db.manuals.filter(x=>x.published))row(list,manual.title,manual.revision,[['Lesen',()=>openManual(manual)]]);
  if(!list.children.length)row(list,'Noch keine lokalen Handbücher','Im Leitungsbereich einen eigenen Entwurf anlegen und freigeben.');
  text('manualStatus',db.acks.length+' / '+db.manuals.filter(m=>m.published).length);
 }
 function openManual(m){choice=m;visible('manualReader');text('manualTitle',m.title);text('manualVersion',m.revision);
  text('manualBody',m.body);$('readConfirmed').checked=false;
  const file=$('signedPdf');file.required=false;file.value='';
  showMsg('manualFeedback','Lokale Lesebestätigung: PDF-Dateien werden nicht hochgeladen oder archiviert.');
  $('ackForm').querySelector('button[type="submit"]').textContent='Lesen lokal bestätigen';
 }
 $('closeManual').onclick=()=>{visible('manualReader',false);choice=null};
 $('ackForm').onsubmit=e=>{
  e.preventDefault();if(!choice||!$('readConfirmed').checked)return showMsg('manualFeedback','Bitte Kenntnisnahme bestätigen.',true);
  db.acks.push({id:uuid(),manualId:choice.id,at:now(),staff:me});
  save();showMsg('manualFeedback','Lesebestätigung lokal gespeichert; dies ist kein rechtssicheres Personalarchiv.');renderManuals();
 };
 function renderNotices(){
  const root=$('alertList');root.replaceChildren();for(const a of db.notices.slice().reverse().slice(0,25))row(root,a.message,date(a.at));
  if(!db.notices.length)row(root,'Keine lokalen Benachrichtigungen','');
 }
 function buildPayroll(month){
  const groups=[{code:me,name:'Lokale Praxisleitung'},...db.staff.map(s=>({code:s.code,name:s.name}))];
  return groups.map(s=>{const ev=clock.filter(x=>x.staff===s.code&&x.at.startsWith(month)).sort((a,b)=>a.at.localeCompare(b.at));
   const sum=totals(ev);
   return {code:s.code,name:s.name,hours:Math.round(sum.minutes/60*100)/100,incomplete:sum.incomplete,absences:db.absences.filter(a=>a.staff===s.code&&a.from.startsWith(month)).length};
  });
 }
 function renderPayroll(){
  const owner=$('ownerPayroll'),accountant=$('accountantPayroll');owner.replaceChildren();accountant.replaceChildren();
  for(const p of db.payroll.slice().reverse()){
   const actions=[['CSV',()=>csv('ORTHO-LOHNENTWURF-'+p.month+'.csv',[['Kennung','Name','Stunden','Unvollständig','Abwesenheiten'],...p.payload.map(x=>[x.code,x.name,x.hours,x.incomplete,x.absences])])]];
   if(p.status==='draft')actions.push(['Lokal als geprüft markieren',()=>{p.status='shared-local';save();renderPayroll();}]);
   row(owner,p.month+' · '+p.status,date(p.at)+' · '+p.payload.length+' Positionen',actions);
   if(p.status!=='draft')row(accountant,p.month+' · LOKALE ANSICHT','Keine echte Freigabe an eine externe Steuerberatung',actions.slice(0,1));
  }
  if(!db.payroll.length)row(owner,'Noch keine Lohnentwürfe','');
  if(!accountant.children.length)row(accountant,'Keine lokal freigegebenen Entwürfe','');
 }
 $('createPayroll').onclick=()=>{
  const month=value('payrollMonth');if(!/^\d{4}-\d{2}$/.test(month))return showMsg('payrollFeedback','Monat auswählen.',true);
  db.payroll.push({id:uuid(),month,at:now(),status:'draft',payload:buildPayroll(month)});save();renderPayroll();
  showMsg('payrollFeedback','Lokaler Prüfund CSV-Entwurf erstellt; keine Lohnabrechnung.');
 };
 $('refreshPayroll').onclick=renderPayroll;
 function renderAll(){renderClock();renderAbsences();renderStaff();renderSchedule();renderManuals();renderNotices();renderPayroll();}
 window.addEventListener('ortho-local-change',renderAll);
 renderAll();
})();
