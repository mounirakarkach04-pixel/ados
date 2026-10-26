'use strict';
(()=>{
 const L=window.OrthoLocal,{db,$,value,number,text,visible,date,format,euro,now,uuid,el,row,csv,save,showMsg}=L;
 L.banner();
 ['dashboard','activeTools','kpiStrip','ownerArea','handoffPanel'].forEach(id=>visible(id));
 text('praxisGreeting','Guten Tag.');text('accountLabel','Lokaler Arbeitsbereich · Browser-Speicher');
 text('roleBadge','DIREKTZUGANG');text('staffCodeBadge','LOCAL-001');text('workStaffCode','LOCAL-001');text('kpiStaff','LOCAL-001');
 const inputIds=['hourly','resinLiter','resinMl','machineHour','machineHours','overhead','targetPrice'];
 for(const id of inputIds){if($(id))$(id).value=db.costs[id]??0;}
 const minutes=(s,e)=>Math.max(0,(Date.parse(e)-Date.parse(s))/60000);
 const current=()=>db.shifts.findLast(s=>s.ended===null);
 const validateRef=ref=>/^[A-Za-z0-9_-]{3,48}$/.test(ref);
 function displayClock(){
  const s=current();const seconds=s?Math.max(0,Math.round((Date.now()-Date.parse(s.started))/1000)):0;
  const pad=n=>String(n).padStart(2,'0');
  text('elapsed',[Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(pad).join(':'));
  text('shiftStatus',s?'Aktive Tätigkeit: '+s.type+' · '+s.ref:'Keine laufende Tätigkeit');
  $('startShift').disabled=!!s;$('stopShift').disabled=!s;
  text('kpiState',s?'Arbeit läuft':'Bereit');
 }
 const events=ref=>db.shifts.filter(s=>s.ref===ref).flatMap(s=>[{at:s.started,type:'START',shift:s},{at:s.ended,type:'ENDE',shift:s}].filter(x=>x.at)).sort((a,b)=>a.at.localeCompare(b.at));
 function renderTrail(){
  const ref=value('traceCase');const ev=events(ref);
  const summary=$('traceSummary');if(summary)summary.textContent=ev.length+' lokal protokollierte Ereignisse · Auftrag '+ref;
  const board=$('traceIntervals'),list=$('traceList');board.replaceChildren();list.replaceChildren();
  const matching=db.shifts.filter(s=>s.ref===ref);
  for(const item of matching){
   row(board,item.type+' · LOCAL-001',date(item.started)+' – '+(item.ended?date(item.ended):'noch aktiv')+' · '+(item.ended?format(minutes(item.started,item.ended))+' min':'läuft'));
  }
  for(const item of ev)row(list,(item.type==='START'?'▶ ':'■ ')+item.type+' · '+item.shift.type,date(item.at)+' · '+item.shift.ref);
  if(!ev.length)row(list,'Keine Ereignisse','Starten und beenden Sie eine Tätigkeit für diesen Auftragscode.');
  $('traceCsv').disabled=!ev.length;
 }
 function renderCosts(){
  const cfg=db.costs;
  const ref=value('costCase');
  const mins=db.shifts.filter(s=>s.ref===ref&&s.ended).reduce((a,s)=>a+minutes(s.started,s.ended),0);
  const labor=mins/60*Number(cfg.hourly||0),resin=Number(cfg.resinLiter||0)*Number(cfg.resinMl||0)/1000;
  const machine=Number(cfg.machineHour||0)*Number(cfg.machineHours||0),overhead=Number(cfg.overhead||0);
  const sum=labor+resin+machine+overhead,target=Number(cfg.targetPrice||0);
  const box=$('calc');box.replaceChildren();
  for(const [name,v] of [['Arbeitszeit',format(mins)+' min'],['Personalansatz',euro(labor)],['Materialansatz',euro(resin)],['Maschinenansatz',euro(machine)],['Weitere Kosten',euro(overhead)],['Gesamtkosten',euro(sum)],['Zielverkaufspreis',euro(target)],['Differenz zum Ziel',euro(target-sum)]])
   row(box,name,v);
 }
 function refresh(){
  displayClock();
  const today=new Date().toLocaleDateString('de-DE');
  const closed=db.shifts.filter(s=>s.ended),todayClosed=closed.filter(s=>new Date(s.started).toLocaleDateString('de-DE')===today);
  text('kpiToday',format(todayClosed.reduce((a,s)=>a+minutes(s.started,s.ended),0))+' min');
  text('kpiTotal',String(db.shifts.length));
  const root=$('myShifts');root.replaceChildren();
  for(const s of db.shifts.slice().reverse().slice(0,35))row(root,s.ref+' · '+s.type,date(s.started)+' → '+(s.ended?date(s.ended)+' · '+format(minutes(s.started,s.ended))+' min':'läuft'));
  if(!db.shifts.length)row(root,'Noch keine Tätigkeiten','Starten Sie die Zeiterfassung.');
  const st=$('staffList');st.replaceChildren();
  for(const person of db.staff)row(st,person.name,person.code+' · '+person.role);
  if(!db.staff.length)row(st,'Keine lokalen Teamprofile','Neue Profile können im Bereich Personal angelegt werden.');
  renderCosts();renderTrail();
 }
 $('startShift').onclick=()=>{
  const ref=value('workCase'),type=value('workType');
  if(!validateRef(ref))return showMsg('shiftMsg','Bitte eine pseudonyme Auftragskennung mit 3–48 Zeichen eingeben.',true);
  if(current())return showMsg('shiftMsg','Eine Tätigkeit läuft bereits.',true);
  db.shifts.push({id:uuid(),ref,type,staff:'LOCAL-001',started:now(),ended:null});save();showMsg('shiftMsg','Tätigkeit lokal gestartet.');refresh();
 };
 $('stopShift').onclick=()=>{
  const s=current();if(!s)return showMsg('shiftMsg','Keine Tätigkeit aktiv.',true);
  s.ended=now();save();showMsg('shiftMsg','Tätigkeit lokal abgeschlossen.');refresh();
 };
 $('traceLoad').onclick=renderTrail;
 $('traceCase').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();renderTrail();}});
 $('traceCsv').onclick=()=>{const ref=value('traceCase');csv('ORTHO-AUFTRAGSVERLAUF-'+ref+'.csv',[['Ereignis','Zeit','Auftrag','Tätigkeit','Kennung'],...events(ref).map(e=>[e.type,e.at,e.shift.ref,e.shift.type,e.shift.staff])]);};
 $('costForm').onsubmit=e=>{
  e.preventDefault();const cfg={};for(const id of inputIds){const v=number(id);if(v<0)return showMsg('shiftMsg','Kosten dürfen nicht negativ sein.',true);cfg[id]=v;}
  db.costs=cfg;save();renderCosts();showMsg('shiftMsg','Kalkulationsdaten lokal gespeichert.');
 };
 $('reloadCost').onclick=renderCosts;
 $('costCase').addEventListener('change',renderCosts);
 window.addEventListener('ortho-local-change',refresh);
 setInterval(displayClock,1000);
 refresh();
})();
