'use strict';
(() => {
const API='https://sanrkcovmkkhgdqydxfk.supabase.co';
const KEY='sb_publishable_GWNQHoz-ML6wphVEyXz0pA_TLuNDzDQ'; // public publishable key; no private role key embedded
const $=id=>document.getElementById(id);
let authMode='login',session=null,profile=null,shift=null,cost=null,workRecords=[];
const fmtEuro=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(n)||0);
const date=ts=>new Date(ts).toLocaleString('de-DE');
const isOwner=()=>profile?.role==='owner'&&profile?.status==='active';
const fail=(target,message)=>{$(target).textContent=message;$(target).classList.add('error');};
const notice=(target,message)=>{$(target).textContent=message;$(target).classList.remove('error');};
async function req(resource,method='GET',body=null,authorized=true,extraHeaders={}){
  const headers={'apikey':KEY,...extraHeaders};
  if(body!==null)headers['Content-Type']='application/json';
  if(authorized){if(!session?.access_token)throw Error('Bitte neu anmelden.');headers.Authorization='Bearer '+session.access_token;}
  const r=await fetch(API+resource,{method,headers,body:body===null?undefined:JSON.stringify(body),cache:'no-store',credentials:'omit'});
  const t=await r.text();let data=null;try{data=t?JSON.parse(t):null;}catch{}
  if(!r.ok){const description=data?.msg||data?.error_description||data?.message||'Anfrage nicht möglich';throw Error('Server '+r.status+': '+description);}
  return data;
}
function setMode(mode){
  authMode=mode;
  document.querySelectorAll('[data-auth]').forEach(b=>b.classList.toggle('current',b.dataset.auth===mode));
  $('nameWrap').hidden=mode!=='register';$('passwordWrap').hidden=mode==='recover';$('password').required=mode!=='recover';
  $('password').autocomplete=mode==='register'?'new-password':'current-password';
  $('fullName').required=mode==='register';
  $('authTitle').textContent=mode==='login'?'Willkommen zurück':mode==='register'?'Praxiszugang anfordern':'Passwort zurücksetzen';
  $('authIntro').textContent=mode==='login'?'Melde dich mit deinem persönlichen Praxiskonto an.':mode==='register'?'Mitarbeiter registrieren sich selbst, arbeiten aber erst nach Freigabe.':'Wir senden eine E-Mail mit dem Wiederherstellungsweg, falls das Konto besteht.';
  $('submitAuth').textContent=mode==='login'?'Anmelden':mode==='register'?'Registrieren':'Reset-E-Mail anfordern';
  notice('authMessage','');
}
document.querySelectorAll('[data-auth]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.auth)));
$('authForm').addEventListener('submit',async e=>{
 e.preventDefault();const email=$('email').value.trim().toLowerCase(),pass=$('password').value;
 $('submitAuth').disabled=true;notice('authMessage','Anfrage wird geprüft ...');
 try{
  if(authMode==='register'){
    const name=$('fullName').value.trim();
    if(name.length<2||pass.length<12)throw Error('Name und mindestens 12 Zeichen Passwort erforderlich.');
    await req('/auth/v1/signup','POST',{email,password:pass,data:{full_name:name}},false);
    notice('authMessage','Registrierung übermittelt. Bitte dein Postfach auf die Bestätigungs-E-Mail prüfen und dich danach anmelden. Der Zugang bleibt bis zur Inhaberfreigabe gesperrt.');
  }else if(authMode==='recover'){
    await req('/auth/v1/recover','POST',{email},false);
    notice('authMessage','Wenn das Konto existiert, wurde eine Wiederherstellungs-E-Mail angefordert. Die Weiterleitung muss beim Auth-Anbieter korrekt konfiguriert sein.');
  }else{
    const data=await req('/auth/v1/token?grant_type=password','POST',{email,password:pass},false);
    if(!data?.access_token||!data?.user?.id)throw Error('Anmeldung nicht bestätigt.');
    session={access_token:data.access_token,user:data.user};
    await launch();
  }
 }catch(err){fail('authMessage',authMode==='login'?'Anmeldung nicht möglich. Bitte E-Mail, Passwort und Verifizierung prüfen.':String(err.message).slice(0,200));}
 finally{$('submitAuth').disabled=false;}
});
async function launch(){
 const user=session.user;
 const existing=await req('/rest/v1/ortho_staff?select=user_id,email,full_name,role,status,approved_at&user_id=eq.'+encodeURIComponent(user.id));
 if(!Array.isArray(existing))throw Error('Unerwartete Datenantwort.');
 if(existing.length)profile=existing[0];
 else{
   const fullName=String(user.user_metadata?.full_name||'Neue Mitarbeiterin / Neuer Mitarbeiter').slice(0,100);
   const name=fullName.length>2?fullName:'Neuer Mitarbeiter';
   await req('/rest/v1/ortho_staff','POST',{user_id:user.id,email:user.email,full_name:name,role:'pending',status:'pending'},true,{'Prefer':'return=minimal'});
   profile=(await req('/rest/v1/ortho_staff?select=user_id,email,full_name,role,status,approved_at&user_id=eq.'+encodeURIComponent(user.id)))[0];
 }
 $('authShell').hidden=true;$('dashboard').hidden=false;
 $('accountLabel').textContent=profile.full_name+' · '+profile.email;
 $('roleBadge').textContent=isOwner()?'INHABER / ADMIN':profile.status==='active'?'MITARBEITER · AKTIV':'WARTET AUF FREIGABE';
 $('pending').hidden=profile.status==='active';$('activeTools').hidden=profile.status!=='active';$('ownerArea').hidden=!isOwner();
 if(profile.status==='active')await loadWork();
 if(isOwner())await loadOwner();
 if(profile.status!=='active'&&profile.email.toLowerCase()==='dr.akarkach@gmx.de')showOwnerClaim();
}
function showOwnerClaim(){
 if($('claimBox'))return;
 const box=document.createElement('div');box.className='tile';box.id='claimBox';
 const h=document.createElement('h3');h.textContent='Praxisinhaber-Aktivierung';
 const p=document.createElement('p');p.textContent='Zur einmaligen Freigabe bitte den separat übermittelten persönlichen Einladungscode eingeben. Ohne Code bleibt der Inhaberzugang gesperrt.';
 const form=document.createElement('form');const label=document.createElement('label');label.textContent='Einmalcode';
 const inp=document.createElement('input');inp.type='password';inp.placeholder='64-stelliger Einladungscode';inp.required=true;inp.minLength=64;inp.maxLength=64;inp.autocomplete='off';
 const btn=document.createElement('button');btn.className='btn primary';btn.type='submit';btn.textContent='Inhaberrolle aktivieren';
 const msg=document.createElement('p');msg.className='message';form.append(label,inp,btn,msg);box.append(h,p,form);$('pending').after(box);
 form.addEventListener('submit',async e=>{e.preventDefault();btn.disabled=true;try{await req('/rest/v1/rpc/ortho_claim_owner','POST',{invite_code:inp.value});inp.value='';notice(msg.id||'authMessage','');box.remove();await launch();}catch(err){msg.textContent='Aktivierung fehlgeschlagen. Bitte Code, E-Mail-Bestätigung und Ablauf prüfen.';}finally{btn.disabled=false;}});
}
$('logout').addEventListener('click',async()=>{try{if(session)await req('/auth/v1/logout','POST',{},true);}catch{}session=null;profile=null;shift=null;cost=null;workRecords=[];$('dashboard').hidden=true;$('authShell').hidden=false;$('ownerArea').hidden=true;$('activeTools').hidden=true;$('password').value='';notice('authMessage','Abgemeldet.');});
function minBetween(start,end){return Math.max(0,(new Date(end).getTime()-new Date(start).getTime())/60000);}
function runClock(){
 if(!shift){$('elapsed').textContent='00:00:00';return;}
 const s=Math.max(0,Math.round((Date.now()-new Date(shift.started_at).getTime())/1000));
 const pad=x=>String(x).padStart(2,'0');$('elapsed').textContent=[Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(pad).join(':');
}
setInterval(runClock,1000);
function drawShifts(){
 $('myShifts').textContent='';
 if(workRecords.length===0){$('myShifts').textContent='Noch keine dokumentierte Tätigkeit.';return;}
 workRecords.slice(0,12).forEach(item=>{
  const row=document.createElement('div');row.className='entry';
  const div=document.createElement('div');const b=document.createElement('b');b.textContent=item.case_ref+' · '+item.task_type;
  const small=document.createElement('small');small.textContent=date(item.started_at)+' · '+(item.ended_at?Math.round(minBetween(item.started_at,item.ended_at))+' Minuten':'LÄUFT');
  div.append(b,small);row.append(div);$('myShifts').append(row);
 });
}
async function loadWork(){
 const filter='?select=id,user_id,task_type,case_ref,started_at,ended_at&user_id=eq.'+encodeURIComponent(session.user.id)+'&order=started_at.desc&limit=30';
 workRecords=await req('/rest/v1/ortho_shifts'+filter);
 shift=workRecords.find(x=>!x.ended_at)||null;$('startShift').disabled=!!shift;$('stopShift').disabled=!shift;
 $('shiftStatus').textContent=shift?'Aktiver Auftrag '+shift.case_ref:'Keine laufende Tätigkeit';
 drawShifts();runClock();
}
$('startShift').addEventListener('click',async()=>{
 const ref=$('workCase').value.trim(),kind=$('workType').value;
 if(!/^[A-Za-z0-9_-]{3,48}$/.test(ref))return fail('shiftMsg','Nur pseudonyme Kennungen 3–48 Zeichen (A–Z, 0–9, _ und -).');
 $('startShift').disabled=true;notice('shiftMsg','Start wird registriert ...');
 try{await req('/rest/v1/ortho_shifts','POST',{user_id:session.user.id,task_type:kind,case_ref:ref},true,{'Prefer':'return=minimal'});await loadWork();notice('shiftMsg','Arbeitsbeginn serverseitig gespeichert.');}
 catch(err){$('startShift').disabled=false;fail('shiftMsg',String(err.message));}
});
$('stopShift').addEventListener('click',async()=>{
 if(!shift)return;
 $('stopShift').disabled=true;
 try{await req('/rest/v1/ortho_shifts?id=eq.'+encodeURIComponent(shift.id),'PATCH',{ended_at:new Date().toISOString()},true,{'Prefer':'return=minimal'});await loadWork();notice('shiftMsg','Endzeit registriert.');if(isOwner())await loadCosts();}
 catch(err){$('stopShift').disabled=false;fail('shiftMsg',String(err.message));}
});
async function loadOwner(){await Promise.all([loadStaff(),loadCosts()]);}
async function loadStaff(){
 const users=await req('/rest/v1/ortho_staff?select=user_id,full_name,email,role,status,created_at&order=created_at.desc&limit=100');
 const root=$('staffList');root.textContent='';
 users.forEach(user=>{const row=document.createElement('div');row.className='entry';const d=document.createElement('div');
 const b=document.createElement('b');b.textContent=user.full_name;
 const small=document.createElement('small');small.textContent=user.email+' · '+user.status+' · '+user.role;
 d.append(b,small);row.append(d);
 if(user.role!=='owner'){
  const btn=document.createElement('button');btn.textContent=user.status==='active'?'Deaktivieren':'Freigeben';btn.type='button';
  btn.onclick=async()=>{btn.disabled=true;try{await req('/rest/v1/ortho_staff?user_id=eq.'+encodeURIComponent(user.user_id),'PATCH',{role:'employee',status:user.status==='active'?'disabled':'active',approved_at:new Date().toISOString()});await loadStaff();}catch(err){alert('Freigabe konnte nicht geändert werden.');btn.disabled=false;}};
  row.append(btn);
 }root.append(row);});
 if(!users.length)root.textContent='Keine Mitarbeiterkonten.';
}
const cols=[['hourly','hourly_staff_eur'],['resinLiter','resin_liter_eur'],['resinMl','resin_ml_per_job'],['machineHour','machine_hour_eur'],['machineHours','machine_hours_per_job'],['overhead','overhead_eur_per_job'],['targetPrice','target_price_eur']];
async function loadCosts(){
 const rows=await req('/rest/v1/ortho_cost_settings?select=*&owner_id=eq.'+encodeURIComponent(session.user.id));
 if(rows.length===0){
  await req('/rest/v1/ortho_cost_settings','POST',{owner_id:session.user.id},true,{'Prefer':'return=minimal'});
  return loadCosts();
 }
 cost=rows[0];cols.forEach(([id,key])=>$(id).value=Number(cost[key]));
 await computeCosts();
}
async function computeCosts(){
 if(!cost)return;
 const ref=$('costCase').value.trim();
 if(!/^[A-Za-z0-9_-]{3,48}$/.test(ref)){$('calc').textContent='Ungültige Auftragskennung.';return;}
 const records=await req('/rest/v1/ortho_shifts?select=id,started_at,ended_at,task_type,case_ref&case_ref=eq.'+encodeURIComponent(ref)+'&limit=1000');
 const closed=records.filter(r=>r.ended_at);
 const mins=closed.reduce((n,r)=>n+minBetween(r.started_at,r.ended_at),0);
 const labor=mins/60*Number(cost.hourly_staff_eur);
 const resin=Number(cost.resin_liter_eur)*Number(cost.resin_ml_per_job)/1000;
 const machine=Number(cost.machine_hour_eur)*Number(cost.machine_hours_per_job);
 const other=Number(cost.overhead_eur_per_job),sum=labor+resin+machine+other;
 const price=Number(cost.target_price_eur),diff=price-sum;
 const lines=[
 ['Referenz / Auftrag',ref],
 ['Erfasste Arbeitszeit',closed.length+' Zeiteinträge · '+mins.toFixed(1).replace('.',',')+' Minuten'],
 ['Personalkosten (Ansatz)',fmtEuro(labor)],['Materialkosten (Ansatz)',fmtEuro(resin)],['Maschinenkosten (Ansatz)',fmtEuro(machine)],
 ['Weitere Kosten (Ansatz)',fmtEuro(other)],['Gesamtkosten (Kalkulation)',fmtEuro(sum)],['Zielverkaufspreis',fmtEuro(price)],
 ['Differenz / Deckungsbeitrag',price>0?fmtEuro(diff):'Kein Verkaufspreis erfasst']
 ];
 const root=$('calc');root.textContent='';
 lines.forEach(([label,value],i)=>{const div=document.createElement('div');div.className='line'+(i===6?' total':'');
 const a=document.createElement('span');a.textContent=label;const b=document.createElement('b');b.textContent=value;div.append(a,b);root.append(div);});
}
$('costForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!isOwner()||!cost)return;
 const update={updated_at:new Date().toISOString()};
 for(const [id,key] of cols){const num=Number($(id).value);if(!Number.isFinite(num)||num<0)return alert('Bitte nichtnegative Zahlen eingeben.');update[key]=num;}
 try{await req('/rest/v1/ortho_cost_settings?owner_id=eq.'+encodeURIComponent(session.user.id),'PATCH',update);cost={...cost,...update};await computeCosts();}catch(err){alert('Speichern fehlgeschlagen.');}
});
$('reloadCost').addEventListener('click',()=>{if(isOwner())loadCosts().catch(()=>alert('Aktualisierung fehlgeschlagen.'));});
$('costCase').addEventListener('change',()=>{if(isOwner())computeCosts().catch(()=>{});});
window.addEventListener('pagehide',()=>{$('password').value='';});
setMode('login');
})();