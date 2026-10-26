'use strict';
(()=>{
const API='https://sanrkcovmkkhgdqydxfk.supabase.co',KEY='sb_publishable_GWNQHoz-ML6wphVEyXz0pA_TLuNDzDQ';
const $=id=>document.getElementById(id),safeDate=s=>{try{return new Date(s).toLocaleString('de-DE');}catch{return String(s||'—');}};
let session=null,staff=null,mode='login',manuals=[],manualChoice=null,allStaff=[],allEvents=[],allAbsences=[],packages=[];
const active=()=>staff&&staff.status==='active',owner=()=>active()&&staff.role==='owner',accountant=()=>active()&&staff.role==='accountant';
const msg=(id,s,error=false)=>{const el=$(id);el.textContent=s;el.classList.toggle('error',error)};
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el};
function row(root,title,sub,actions=[]){const wrap=node('div',undefined,'record'),left=node('div');left.append(node('b',title),node('small',sub));wrap.append(left);if(actions.length){const btns=node('div',undefined,'record-actions');actions.forEach(([label,cb])=>{const b=node('button',label);b.type='button';b.addEventListener('click',cb);btns.append(b)});wrap.append(btns)}root.append(wrap);return wrap}
function clear(id){$(id).replaceChildren()}
async function request(path,method='GET',payload=null,authorized=true,options={}){
 const headers={apikey:KEY,...options.headers};if(authorized){if(!session?.access_token)throw Error('Bitte erneut anmelden.');headers.Authorization='Bearer '+session.access_token;}
 if(payload!==null)headers['Content-Type']='application/json';
 const res=await fetch(API+path,{method,headers,body:payload===null?undefined:JSON.stringify(payload),credentials:'omit',cache:'no-store'});
 let result=null;const raw=await res.text();try{result=raw?JSON.parse(raw):null}catch{}
 if(!res.ok)throw Error('Server '+res.status+': '+String(result?.msg||result?.error_description||result?.message||result?.error||'Anfrage nicht erfolgreich').slice(0,160));
 return result;
}
const rest=(table,query='')=>request('/rest/v1/'+table+(query?'?'+query:''));
async function insert(table,data){return request('/rest/v1/'+table,'POST',data,true,{headers:{Prefer:'return=minimal'}})}
async function patch(table,filter,data){return request('/rest/v1/'+table+'?'+filter,'PATCH',data,true,{headers:{Prefer:'return=minimal'}})}
function authMode(next){mode=next;document.querySelectorAll('[data-auth-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.authMode===next));
 $('registerName').hidden=next!=='register';$('name').required=next==='register';
 $('passwordArea').hidden=next==='forgot';$('password').required=next!=='forgot';
 $('password').autocomplete=next==='register'?'new-password':'current-password';
 $('loginTitle').textContent=next==='login'?'Willkommen zurück':next==='register'?'Persönliches Konto anlegen':'Zugang wiederherstellen';
 $('modeDetail').textContent=next==='login'?'Bitte mit Ihrem eigenen Konto anmelden.':next==='register'?'Nach der E-Mail-Bestätigung entscheidet der Praxisinhaber über Ihre Rolle.':'Bei bestehendem Konto wird ein Link zur Wiederherstellung angefordert.';
 $('loginSubmit').textContent=next==='login'?'Anmelden':next==='register'?'Registrieren':'Reset-Link anfordern';msg('authFeedback','');$('emailHelp').hidden=next==='login';}
document.querySelectorAll('[data-auth-mode]').forEach(b=>b.addEventListener('click',()=>authMode(b.dataset.authMode)));
const callbackUrl=()=>new URL('./auth.html',location.href).href;
async function submitAuth(e){
 e.preventDefault();const email=$('email').value.trim().toLowerCase(),password=$('password').value,name=$('name').value.trim();const button=$('loginSubmit');button.disabled=true;msg('authFeedback','Ihre Anfrage wird verarbeitet …');
 try{
  if(mode==='register'){
   if(name.length<2||password.length<12)throw Error('Name und Passwort von mindestens zwölf Zeichen sind erforderlich.');
   await request('/auth/v1/signup?redirect_to='+encodeURIComponent(callbackUrl()),'POST',{email,password,data:{full_name:name}},false);
   $('password').value='';location.assign('./auth.html?state=check-email');return;
  }
  if(mode==='forgot'){
   await request('/auth/v1/recover?redirect_to='+encodeURIComponent(callbackUrl()),'POST',{email},false);
   $('password').value='';location.assign('./auth.html?state=check-email');return;
  }
  const result=await request('/auth/v1/token?grant_type=password','POST',{email,password},false);
  if(!result?.access_token||!result?.user?.id)throw Error('Keine bestätigte Anmeldung.');$('password').value='';
  session={access_token:result.access_token,refresh_token:result.refresh_token,expires_in:result.expires_in,user:result.user};
  sessionStorage.setItem('piga-ortho-auth-ephemeral',JSON.stringify({token:session.access_token,expiresAt:Date.now()+Math.min(Number(result.expires_in)||3600,3600)*1000}));
  await enter();
 }catch(err){msg('authFeedback',String(err.message).slice(0,220)+' – falls E-Mail-Bestätigung fehlgeschlagen ist, prüfen Sie SMTP und Redirect-Konfiguration.',true);$('emailHelp').hidden=false;}
 finally{button.disabled=false;}
}
$('loginForm').addEventListener('submit',submitAuth);
$('resend').addEventListener('click',async()=>{const email=$('email').value.trim().toLowerCase();if(!email){msg('authFeedback','Bitte zuerst eine E-Mail-Adresse eingeben.',true);return;}
 $('resend').disabled=true;try{await request('/auth/v1/resend?redirect_to='+encodeURIComponent(callbackUrl()),'POST',{email,type:'signup'},false);msg('authFeedback','Bestätigung erneut angefordert. Bitte E-Mail, Spamfilter und Wartefrist prüfen.');}
 catch(err){msg('authFeedback',String(err.message).slice(0,180),true);}finally{$('resend').disabled=false;}});
async function resume(){
 let stored;try{stored=JSON.parse(sessionStorage.getItem('piga-ortho-auth-ephemeral')||'null')}catch{}
 if(!stored?.token||Date.now()>=Number(stored.expiresAt)){sessionStorage.removeItem('piga-ortho-auth-ephemeral');return;}
 session={access_token:stored.token};
 try{const user=await request('/auth/v1/user','GET',null,true);if(!user?.id||!user.email_confirmed_at)throw Error('Unbestätigt');session.user=user;await enter();}
 catch{session=null;sessionStorage.removeItem('piga-ortho-auth-ephemeral');}
}
async function enter(){
 const user=session.user,uid=encodeURIComponent(user.id);
 const data=await rest('ortho_staff','select=user_id,email,full_name,staff_code,role,status&user_id=eq.'+uid);
 if(!Array.isArray(data))throw Error('Profil nicht verfügbar.');
 if(!data.length){
  const name=String(user.user_metadata?.full_name||'Neuer Mitarbeiter').trim().slice(0,100);
  await insert('ortho_staff',{user_id:user.id,email:user.email,full_name:name.length>2?name:'Neuer Mitarbeiter',role:'pending',status:'pending'});
  staff=(await rest('ortho_staff','select=user_id,email,full_name,staff_code,role,status&user_id=eq.'+uid))[0];
 }else staff=data[0];
 $('loginPanel').hidden=true;
 if(!active()){$('waitingPanel').hidden=false;$('workspace').hidden=true;return;}
 $('waitingPanel').hidden=true;$('workspace').hidden=false;
 $('roleGreeting').textContent=owner()?'Guten Tag, Dr. Akarkach':'Guten Tag, '+staff.full_name+'.';
 $('identity').textContent=staff.staff_code+' · '+staff.email;$('roleBadge').textContent=owner()?'PRAXISINHABER':accountant()?'STEUERBERATUNG':'MITARBEITER';
 $('employeeTools').hidden=accountant();$('ownerArea').hidden=!owner();$('accountantArea').hidden=!accountant();$('ownerNav').hidden=!owner();$('accountantNav').hidden=!accountant();
 if(!accountant())await Promise.all([loadTime(),loadAbsences(),loadManuals(),loadSchedule()]);
 if(owner())await Promise.all([loadOwnerStaff(),loadOwnerAbsences(),loadOwnerManuals(),loadOwnerAlerts(),loadPayroll(),loadOwnerSchedule()]);
 if(accountant())await loadAccountant();
}
function signout(){sessionStorage.removeItem('piga-ortho-auth-ephemeral');session=null;staff=null;$('workspace').hidden=true;$('waitingPanel').hidden=true;$('loginPanel').hidden=false;$('password').value='';msg('authFeedback','Sie sind abgemeldet.');}
$('logout').addEventListener('click',()=>{if(session?.access_token)request('/auth/v1/logout','POST',{},true).catch(()=>{});signout();});
$('signoutPending').addEventListener('click',signout);
function todayKey(iso){return new Date(iso).toLocaleDateString('sv-SE');}
function clockCalc(events){let begin=null,pause=null,minutes=0,paused=0,status='Nicht erfasst';for(const e of events){
 if(e.event_type==='CLOCK_IN'&&begin===null){begin=e.occurred_at;status='Im Dienst';}
 if(e.event_type==='BREAK_START'&&begin!==null&&pause===null){pause=e.occurred_at;status='Pause';}
 if(e.event_type==='BREAK_END'&&pause){paused+=Math.max(0,(new Date(e.occurred_at)-new Date(pause))/60000);pause=null;status='Im Dienst';}
 if(e.event_type==='CLOCK_OUT'&&begin){const total=(new Date(e.occurred_at)-new Date(begin))/60000;minutes+=Math.max(0,total-paused);begin=null;paused=0;pause=null;status='Beendet';}
}return {minutes,status,open:begin!==null,breakOpen:pause!==null,complete:begin===null};}
let myTime=[];
async function loadTime(){
 myTime=await rest('ortho_hr_time_events','select=id,user_id,event_type,occurred_at&user_id=eq.'+encodeURIComponent(session.user.id)+'&order=occurred_at.asc&limit=500');
 const latest=myTime.filter(e=>todayKey(e.occurred_at)===todayKey(new Date())).sort((a,b)=>Date.parse(a.occurred_at)-Date.parse(b.occurred_at));
 const st=clockCalc(latest);$('worked').textContent=(st.minutes/60).toFixed(2).replace('.',',')+' h';$('clockState').textContent=st.status;$('staffId').textContent=staff.staff_code;
 $('clockIn').disabled=st.open;$('breakStart').disabled=!st.open||st.breakOpen;$('breakEnd').disabled=!st.breakOpen;$('clockOut').disabled=!st.open;
 clear('timeList');latest.slice(-20).reverse().forEach(e=>row($('timeList'),e.event_type,safeDate(e.occurred_at)+' · Serverzeit'));
 if(!latest.length)row($('timeList'),'Noch kein Zeiteintrag','Bitte eine Tätigkeit vor Arbeitsbeginn starten.');
}
for(const [id,event] of [['clockIn','CLOCK_IN'],['breakStart','BREAK_START'],['breakEnd','BREAK_END'],['clockOut','CLOCK_OUT']]){
 $(id).addEventListener('click',async()=>{ $(id).disabled=true;try{await insert('ortho_hr_time_events',{user_id:session.user.id,event_type:event});await loadTime();msg('timeFeedback','Ereignis serverseitig erfasst: '+event);}catch(err){msg('timeFeedback',String(err.message),true);$(id).disabled=false;}});
}
const kinds={vacation:'Urlaub',sick:'Arbeitsunfähigkeit',training:'Fortbildung',other:'Sonstige Abwesenheit'};
function period(x){return x.starts_on+' bis '+x.ends_on}
async function loadAbsences(){
 const rows=await rest('ortho_hr_absences','select=id,kind,starts_on,ends_on,status,submitted_at&user_id=eq.'+encodeURIComponent(session.user.id)+'&order=starts_on.desc&limit=100');
 clear('absenceList');rows.forEach(x=>row($('absenceList'),kinds[x.kind]||'Abwesenheit',period(x)+' · '+x.status));if(!rows.length)row($('absenceList'),'Keine Anträge','');
}
$('absenceForm').addEventListener('submit',async e=>{
 e.preventDefault();const a=$('absenceStart').value,b=$('absenceEnd').value,kind=$('absenceKind').value;
 if(!a||!b||b<a){msg('absenceFeedback','Bitte einen gültigen Zeitraum auswählen.',true);return;}
 try{await insert('ortho_hr_absences',{user_id:session.user.id,kind,starts_on:a,ends_on:b});
 msg('absenceFeedback','Meldung an die Praxis übermittelt. Bitte die Entscheidung prüfen.');await loadAbsences();if(owner())await loadOwnerAbsences();}
 catch(err){msg('absenceFeedback',String(err.message),true);}
});
async function loadManuals(){
 manuals=await rest('ortho_hr_manuals','select=id,kind,revision,title,body,published,owner_approved_at&published=eq.true&order=created_at.desc&limit=30');
 const acks=await rest('ortho_hr_acknowledgements','select=manual_id,acknowledged_year,attested_at,signed_file_path&user_id=eq.'+encodeURIComponent(session.user.id));
 const year=new Date().getFullYear(),count=manuals.filter(m=>acks.some(a=>a.manual_id===m.id&&a.acknowledged_year===year)).length;
 $('manualStatus').textContent=count+' / '+manuals.length;
 const list=$('manualList');list.textContent='';
 if(!manuals.length){row(list,'Noch keine freigegebene Handbuchfassung','Dr. Akarkach muss die lokalen Praxis- und Hygienepläne zuerst prüfen und freigeben.');return;}
 manuals.forEach(m=>{
  const confirmed=acks.find(a=>a.manual_id===m.id&&a.acknowledged_year===year);
  const tile=node('div',undefined,'manual-tile');tile.append(node('small',m.revision),node('h4',m.title),node('p',confirmed?'Dieses Jahr bestätigt am '+safeDate(confirmed.attested_at):'Jährliche Bestätigung noch offen.'));
  const button=node('button',confirmed?'Erneut lesen':'Lesen & unterschreiben');button.type='button';button.onclick=()=>openManual(m,Boolean(confirmed));tile.append(button);list.append(tile);
 });
}
function openManual(m,confirmed){
 manualChoice=m;$('manualReader').hidden=false;$('manualVersion').textContent=m.revision;$('manualTitle').textContent=m.title;
 $('manualBody').textContent=m.body;$('ackForm').hidden=confirmed;$('readConfirmed').checked=false;$('signedPdf').value='';msg('manualFeedback',confirmed?'Für diese Version liegt eine Bestätigung vor.':'Lesen Sie die gesamte Fassung, bevor Sie bestätigen.');
 $('manualReader').scrollIntoView({behavior:'smooth',block:'start'});
}
$('closeManual').onclick=()=>{$('manualReader').hidden=true;manualChoice=null;};
async function uploadPDF(file){
 if(file.size>5*1024*1024||file.size<100||file.type!=='application/pdf')throw Error('Nur PDF bis 5 MB zulässig.');
 const first=new Uint8Array(await file.slice(0,5).arrayBuffer());if(String.fromCharCode(...first)!=='%PDF-')throw Error('Ungültiges PDF-Format');
 const path=session.user.id+'/'+new Date().getFullYear()+'/'+crypto.randomUUID()+'.pdf';
 const r=await fetch(API+'/storage/v1/object/ortho-training-archive/'+path,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/pdf','x-upsert':'false'},body:file,credentials:'omit'});
 if(!r.ok)throw Error('Geschützter PDF-Upload abgelehnt ('+r.status+').');return path;
}
$('ackForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!manualChoice||!$('readConfirmed').checked){msg('manualFeedback','Bitte Lesen und Verstehen ausdrücklich bestätigen.',true);return;}
 const file=$('signedPdf').files?.[0];if(!file)return msg('manualFeedback','Bitte unterschriebene PDF auswählen.',true);
 const button=$('ackForm').querySelector('button[type=submit]');button.disabled=true;
 try{const path=await uploadPDF(file);await insert('ortho_hr_acknowledgements',{user_id:session.user.id,manual_id:manualChoice.id,read_confirmed:true,signed_file_path:path,acknowledged_year:new Date().getFullYear()});msg('manualFeedback','Kenntnisnahme und PDF-Nachweis im geschützten Archiv registriert.');$('ackForm').hidden=true;await loadManuals();}
 catch(err){msg('manualFeedback','Nachweis noch nicht abgeschlossen: '+String(err.message),true);}
 finally{button.disabled=false;}
});
async function loadSchedule(){
 const rows=await rest('ortho_hr_schedule','select=starts_at,ends_at,published&user_id=eq.'+encodeURIComponent(session.user.id)+'&published=eq.true&order=starts_at.asc&limit=100');
 if(rows.length){$('globalNotice').textContent='Ihr Dienstplan enthält '+rows.length+' freigegebene Termine. Eine Planung ersetzt nicht Ihre eigene Zeiterfassung.';}
}
async function loadOwnerStaff(){
 allStaff=await rest('ortho_staff','select=user_id,staff_code,full_name,email,role,status&order=created_at.desc&limit=120');
 clear('teamList');const select=$('schedulePerson');select.textContent='';
 for(const u of allStaff){
  const actions=[];
  if(u.role!=='owner'){
   actions.push([u.status==='active'?'Sperren':'Als Mitarbeiter freigeben',async()=>{await patch('ortho_staff','user_id=eq.'+encodeURIComponent(u.user_id),{role:'employee',status:u.status==='active'?'disabled':'active',approved_at:new Date().toISOString()});await loadOwnerStaff();}]);
   if(u.status!=='active')actions.push(['Als Steuerberater freigeben',async()=>{if(!confirm('Steuerberater-Zugang nur für verifizierte, persönlich überprüfte Kanzleiperson freigeben?'))return;await patch('ortho_staff','user_id=eq.'+encodeURIComponent(u.user_id),{role:'accountant',status:'active',approved_at:new Date().toISOString()});await loadOwnerStaff();}]);
  }
  row($('teamList'),u.full_name+' · '+u.staff_code,u.role+' / '+u.status+' · '+u.email,actions);
  if(u.status==='active'&&['employee','owner'].includes(u.role)){const opt=node('option',u.full_name+' · '+u.staff_code);opt.value=u.user_id;select.append(opt);}
 }
}
async function loadOwnerAbsences(){
 allAbsences=await rest('ortho_hr_absences','select=id,user_id,kind,starts_on,ends_on,status&order=starts_on.desc&limit=250');
 clear('ownerAbsences');
 allAbsences.forEach(x=>{
  const u=allStaff.find(s=>s.user_id===x.user_id);
  const actions=x.status==='pending'?[['Genehmigen',()=>changeAbsence(x,'approved')],['Ablehnen',()=>changeAbsence(x,'rejected')]]:[];
  row($('ownerAbsences'),(u?.staff_code||'Mitarbeiter')+' · '+kinds[x.kind],period(x)+' · '+x.status,actions);
 });
 if(!allAbsences.length)row($('ownerAbsences'),'Keine gemeldeten Abwesenheiten','');
}
async function changeAbsence(x,status){try{await patch('ortho_hr_absences','id=eq.'+x.id,{status,reviewed_at:new Date().toISOString()});await loadOwnerAbsences();}catch(err){alert('Änderung nicht möglich: '+err.message)}}
async function loadOwnerManuals(){
 const all=await rest('ortho_hr_manuals','select=id,kind,title,revision,published,owner_approved_at&order=created_at.desc&limit=40');
 clear('ownerManuals');for(const m of all)row($('ownerManuals'),m.title,m.revision+' · '+(m.published?'FREIGEGEBEN':'ENTWURF'),m.published?[]:[['Fachlich geprüft · Freigeben',async()=>{
  if(!confirm('Bestätigen Sie, dass Sie die Anleitung auf Ihre tatsächliche Praxis angepasst und fachlich geprüft haben? Diese Freigabe macht sie für Beschäftigte sichtbar.'))return;
  try{await patch('ortho_hr_manuals','id=eq.'+m.id,{published:true,owner_approved_at:new Date().toISOString()});await loadOwnerManuals();await loadManuals();}
  catch(err){alert(err.message);}
 }]]);
}
async function loadOwnerAlerts(){
 const data=await rest('ortho_hr_owner_alerts','select=id,event_type,staff_code,message,created_at,acknowledged_at&order=created_at.desc&limit=80');clear('alertList');
 data.forEach(x=>row($('alertList'),x.staff_code+' · '+x.event_type,safeDate(x.created_at)+' · '+x.message,x.acknowledged_at?[]:[['Gesehen',async()=>{await patch('ortho_hr_owner_alerts','id=eq.'+x.id,{acknowledged_at:new Date().toISOString()});await loadOwnerAlerts();}]]));
 if(!data.length)row($('alertList'),'Keine neuen Hinweise','');
}
$('scheduleForm').onsubmit=async e=>{e.preventDefault();const start=$('scheduleStart').value,end=$('scheduleEnd').value;
 if(!start||!end||Date.parse(start)>=Date.parse(end))return msg('scheduleFeedback','Bitte gültigen Zeitraum wählen.',true);
 try{await insert('ortho_hr_schedule',{user_id:$('schedulePerson').value,starts_at:new Date(start).toISOString(),ends_at:new Date(end).toISOString(),published:true});msg('scheduleFeedback','Dienstplan serverseitig gespeichert.');await loadOwnerSchedule();}
 catch(err){msg('scheduleFeedback',err.message,true);}};
async function loadOwnerSchedule(){const list=await rest('ortho_hr_schedule','select=user_id,starts_at,ends_at,published&order=starts_at.asc&limit=100');clear('scheduleList');list.forEach(x=>row($('scheduleList'),(allStaff.find(s=>s.user_id===x.user_id)?.staff_code||'Personal')+' · '+safeDate(x.starts_at),safeDate(x.ends_at)));if(!list.length)row($('scheduleList'),'Kein Dienstplan','');}
const periodMonth=()=>new Date().toISOString().slice(0,7);
$('payrollMonth').value=periodMonth();
function sumWork(events){
 let start=null,breakAt=null,breakM=0,sumM=0,incomplete=false;
 for(const e of events){if(e.event_type==='CLOCK_IN'){if(start)incomplete=true;start=e.occurred_at;breakAt=null;breakM=0;}
 else if(e.event_type==='BREAK_START'&&start){breakAt=e.occurred_at;}
 else if(e.event_type==='BREAK_END'&&breakAt){breakM+=(new Date(e.occurred_at)-new Date(breakAt))/60000;breakAt=null;}
 else if(e.event_type==='CLOCK_OUT'&&start){const length=(new Date(e.occurred_at)-new Date(start))/60000;sumM+=Math.max(0,length-breakM);start=null;breakAt=null;breakM=0;}
 }
 return {minutes:Number(sumM.toFixed(2)),incomplete:incomplete||!!start||!!breakAt};
}
async function loadPayroll(){packages=await rest('ortho_hr_payroll_packages','select=id,period_month,payload,status,created_at&order=created_at.desc&limit=40');drawPackages('ownerPayroll',packages,true);}
async function loadAccountant(){const shared=await rest('ortho_hr_payroll_packages','select=id,period_month,payload,status,created_at&status=eq.shared&order=created_at.desc&limit=50');drawPackages('accountantPayroll',shared,false);}
function csvPackage(p){const lines=[['Mitarbeiterkennung','Name','Arbeitsstunden','Unvollständig','Abwesenheiten']];for(const x of p.payload||[])lines.push([x.staff_code,x.name,x.hours,x.incomplete,x.absences.map(a=>a.kind+':'+a.from+'-'+a.to).join('|')]);return '\uFEFF'+lines.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(';')).join('\r\n')}
function csvDownload(p){const blob=new Blob([csvPackage(p)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='PIGA_ORTHO_LOHN_'+p.period_month+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function drawPackages(id,items,isOwner){clear(id);items.forEach(p=>{
 const actions=[['CSV herunterladen',()=>csvDownload(p)]];
 if(isOwner&&p.status==='draft')actions.push(['Nach Prüfung teilen',async()=>{
  if(!confirm('Diese minimierten Lohndaten ausdrücklich für die Steuerberatung freigeben?'))return;
  try{await patch('ortho_hr_payroll_packages','id=eq.'+p.id,{status:'shared'});await loadPayroll();}catch(err){msg('payrollFeedback',err.message,true);}
 }]);
 row($(id),'Monat '+p.period_month+' · '+p.status,(Array.isArray(p.payload)?p.payload.length:0)+' Mitarbeiter · erstellt '+safeDate(p.created_at),actions);
 });if(!items.length)row($(id),'Keine freigegebenen Monatsdaten','');}
$('createPayroll').onclick=async()=>{
 const month=$('payrollMonth').value;if(!/^\d{4}-\d{2}$/.test(month))return msg('payrollFeedback','Bitte Monat auswählen.',true);
 $('createPayroll').disabled=true;msg('payrollFeedback','Monatsdaten werden nach Rollenprüfung ausgewertet …');
 try{
  const [events,absences]=await Promise.all([rest('ortho_hr_time_events','select=user_id,event_type,occurred_at&order=occurred_at.asc&limit=5000'),rest('ortho_hr_absences','select=user_id,kind,starts_on,ends_on,status&limit=3000')]);
  const payload=allStaff.filter(s=>s.role==='employee'&&s.status==='active').map(person=>{
   const ownEvents=events.filter(e=>e.user_id===person.user_id&&e.occurred_at.startsWith(month));
   const time=sumWork(ownEvents);
   const ownAbsences=absences.filter(a=>a.user_id===person.user_id&&a.status!=='rejected'&&a.starts_on.slice(0,7)<=month&&a.ends_on.slice(0,7)>=month).map(a=>({kind:a.kind,from:a.starts_on,to:a.ends_on,status:a.status}));
   return {staff_code:person.staff_code,name:person.full_name,hours:Number(time.minutes/60).toFixed(2),incomplete:time.incomplete,absences:ownAbsences};
  });
  await insert('ortho_hr_payroll_packages',{period_month:month+'-01',created_by:session.user.id,payload,includes_diagnosis:false,status:'draft'});
  msg('payrollFeedback','Entwurf erstellt. Bitte auf Pausen, unvollständige Zeitpaare und arbeitsrechtliche Zuschläge prüfen, bevor er geteilt wird.');await loadPayroll();
 }catch(err){msg('payrollFeedback',err.message,true);}finally{$('createPayroll').disabled=false;}
};
$('refreshPayroll').onclick=()=>loadPayroll().catch(err=>msg('payrollFeedback',err.message,true));
resume();authMode('login');
})();