'use strict';
/* PIGA ORTHO 3D — authenticated practice portal.
 * Credentials never saved. All authorization comes from Supabase Auth + server RLS/RPC.
 * Does not grant clinical/device authority and does not upload model files.
 */
(()=>{
 const API='https://sanrkcovmkkhgdqydxfk.supabase.co';
 const KEY='sb_publishable_GWNQHoz-ML6wphVEyXz0pA_TLuNDzDQ'; // publishable, never service role
 const C=window.PigaOrthoAccessCore,S=window.PigaPortalStability,$=id=>document.getElementById(id);
 if(!C||!S){document.body.textContent='BLOCK: Rollen- oder Stabilitätskernel fehlt.';return;}
 let session=null,identity=null,role=null,clinic=null,clinics=[],admin=false,taskCache=[],currentTask=null,profileMap=new Map(),chosenPrintFile=null,printSha=null,busy=false,mode='login',recoveryMode=false;
 const taskGate=S.latestOnly(),fileGate=S.latestOnly(),popupSeen=S.alertTracker();
 let taskRespondBusy=false,printBusy=false,refreshPromise=null;
 const safe=s=>String(s??'').slice(0,160);
 // Only user-facing error families are mapped. Server-side access rules remain authoritative.
 const friendlyAuthError=error=>{
   const message=String(error?.message??error??'');
   if(/invalid login credentials/i.test(message))return 'Anmeldung nicht möglich. Bitte E-Mail und Passwort prüfen. Falls noch nicht bestätigt, den E-Mail-Link öffnen.';
   if(/invalid access token|invalid jwt|jwt expired|server 401|session expired/i.test(message))return 'Die Anmeldung konnte nicht sicher bestätigt werden. Bitte erneut anmelden.';
   if(/email not confirmed/i.test(message))return 'Bitte zuerst die Bestätigungs-E-Mail öffnen. Ohne Bestätigung ist keine Anmeldung möglich.';
   if(/email rate limit|too many requests|429|over_email_send_rate_limit/i.test(message))return 'Zu viele Versuche. Bitte später erneut versuchen; es wird kein weiterer Antrag gesendet.';
   if(/signup is disabled|signups not allowed|email signups are disabled/i.test(message))return 'Registrierung ist serverseitig deaktiviert. Bitte den Betreiber schriftlich kontaktieren.';
   if(/invalid email|email address is invalid/i.test(message))return 'Bitte eine gültige E-Mail-Adresse eingeben.';
   if(/failed to fetch|networkerror|network error/i.test(message))return 'Verbindung zum Anmeldeserver fehlgeschlagen. Bitte Netzwerk prüfen; keine Anmeldung bestätigt.';
   if(/redirect|uri.*allow|not allowed.*url/i.test(message))return 'E-Mail-Rücksprungadresse nicht freigegeben. Betreiber muss die genaue Auth-Redirect-URL prüfen.';
   return safe(message);
 };
 const feedback=(msg,failed=false)=>{
   const el=$('liveMessage');el.textContent=msg;el.classList.add('shown');el.classList.toggle('error',failed);
   clearTimeout(feedback.timer);feedback.timer=setTimeout(()=>el.classList.remove('shown'),7500);
 };
 const state=(msg,failed=false)=>{$('loginState').textContent=msg;$('loginState').classList.toggle('error',failed)};
 const clearInvite=()=>{$('issuedInvite').hidden=true;$('issuedInviteCode').textContent=''};
 async function request(path,method='GET',body=null,auth=true,headersExtra={}){
   const headers={apikey:KEY,...headersExtra};
   if(body!==null)headers['Content-Type']='application/json';
   if(auth){if(!session?.access_token)throw Error('Keine aktive Sitzung. Bitte erneut anmelden.');
      if(session.expires_at && Date.now()>session.expires_at*1000-30000){await refreshSession();}
      headers.Authorization='Bearer '+session.access_token;}
   const response=await fetch(API+path,{method,headers,body:body===null?undefined:JSON.stringify(body),credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
   const payload=await response.text();let data;
   try{data=payload?JSON.parse(payload):null}catch{data=payload;}
   if(!response.ok)throw Error('Server '+response.status+': '+safe(data?.msg||data?.message||data?.error_description||data?.hint||'Zugriff verweigert'));
   return data;
 }
 async function refreshSession(){
   if(refreshPromise)return refreshPromise;
   const previous=session;
   if(!previous?.refresh_token)throw Error('Sitzung abgelaufen, bitte neu anmelden.');
   refreshPromise=(async()=>{
     const next=await request('/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:previous.refresh_token},false);
     if(session!==previous)throw Error('Sitzung wurde während der Erneuerung geändert.');
     if(!next?.access_token||!next?.refresh_token)throw Error('Authentifizierung abgelaufen.');
     session=next;
   })();
   try{await refreshPromise;}finally{refreshPromise=null;}
 }
 function setMode(next){
   if(!['login','register','recover'].includes(next))return;
   mode=next;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===next));
   $('passwordBox').hidden=next==='recover';$('password').required=next!=='recover';
   if(next==='register')$('password').setAttribute('minlength','12');
   else $('password').removeAttribute('minlength'); // Existing users may have older, shorter passwords.
   const guidance={
    login:'Mit bestätigter E-Mail und bestehendem Passwort anmelden. Eine Praxisrolle wird nicht automatisch vergeben.',
    register:'Neues Konto anlegen: mindestens 12 Passwortzeichen. Anschließend E-Mail bestätigen; Praxiszugriff benötigt zusätzlich eine Einladung.',
    recover:'Passwort vergessen? Gib deine E-Mail-Adresse ein. Ein Wiederherstellungslink wird nur an bestehende Konten gesendet.'
   };
   $('authHelp').textContent=guidance[next];
   state('');
   $('password').autocomplete=next==='register'?'new-password':'current-password';
   $('submitLogin').textContent=next==='recover'?'Reset-E-Mail anfordern':next==='register'?'Registrieren':'Anmelden';
 }
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
 async function login(form){
   if(busy)return;busy=true;$('submitLogin').disabled=true;
   try{
     const email=$('email').value.trim(),password=$('password').value;
     if(mode==='register'){
       if(password.length<12)throw Error('Mindestens zwölf Passwortzeichen erforderlich.');
       const redirectTo=new URL('./portal-auth.html',location.href).href;
       const result=await request('/auth/v1/signup?redirect_to='+encodeURIComponent(redirectTo),'POST',{email,password},false);
       state(result?.user?'Registrierung angefragt. E-Mail-Bestätigung und Praxisfreigabe sind erforderlich.':'Registrierung angefragt. Bitte Postfach prüfen.');
       $('password').value='';return;
     }
     if(mode==='recover'){
       const redirectTo=new URL('./portal-auth.html',location.href).href;
       await request('/auth/v1/recover?redirect_to='+encodeURIComponent(redirectTo),'POST',{email},false);
       state('Wenn das Konto besteht, wird ein Wiederherstellungslink versendet.');return;
     }
     const s=await request('/auth/v1/token?grant_type=password','POST',{email,password},false);
     if(!s?.access_token||!s?.user?.id)throw Error('Anmeldung nicht bestätigt.');
     session=s;$('password').value='';
     await loadAccess();
   }catch(e){if(!$('loginPanel').hidden){session=null;identity=null;role=null;clinic=null;clinics=[];admin=false;$('clinicWorkspace').hidden=true;$('signedIn').hidden=true;}state(friendlyAuthError(e),true);$('password').value='';}
   finally{busy=false;$('submitLogin').disabled=false;}
 }
 $('loginForm').addEventListener('invalid',e=>{
   const el=e.target;
   const message=el?.id==='password'?
     (mode==='register'?'Passwort für die Registrierung: mindestens 12 Zeichen.':'Bitte das Passwort eingeben.') :
     'Bitte eine gültige E-Mail-Adresse eingeben.';
   state(message,true);
 },true);
 $('loginForm').addEventListener('submit',e=>{e.preventDefault();void login()});
 async function verifyRecoveryOrConfirmation(){
   const q=new URLSearchParams(location.search),hash=new URLSearchParams(location.hash.replace(/^#/,''));
   const error=q.get('error_description')||hash.get('error_description');
   if(error){state('Bestätigungslink abgelehnt. Bitte neuen Link anfordern.',true);history.replaceState(null,'','./portal.html');return;}
   const token=q.get('token_hash'),type=q.get('type')||hash.get('type')||'';
   if(token){
     history.replaceState(null,'','./portal.html');
     try{
       if(!['signup','email','recovery'].includes(type))throw Error('Ungültiger Linktyp.');
       const data=await request('/auth/v1/verify','POST',{token_hash:token,type},false);
       if(type==='recovery'&&data?.access_token){session=data;recoveryMode=true;await loadAccess();state('Wiederherstellung bestätigt. Legen Sie jetzt Ihr neues Passwort fest.');}
       else state('E-Mail bestätigt. Bitte mit E-Mail und Passwort anmelden.');
     }catch{state('Bestätigungslink abgelaufen oder ungültig.',true);}
   }else if(hash.has('access_token')){
     // Implicit flow: do not persist or log URL tokens.
     const a=hash.get('access_token'),r=hash.get('refresh_token');
     history.replaceState(null,'','./portal.html');
     if(a&&r){recoveryMode=type==='recovery';session={access_token:a,refresh_token:r,expires_at:Math.floor(Date.now()/1000)+(Number(hash.get('expires_in'))||3600)};
       try{await loadAccess()}catch{state('Bestätigt; bitte erneut mit Passwort anmelden.',true);}}
   }else if(location.hash||location.search){history.replaceState(null,'','./portal.html');}
 }
 async function loadAccess(){
   if(!session)throw Error('Nicht angemeldet.');
   const user=await request('/auth/v1/user');
   if(!user?.id||!user.email_confirmed_at)throw Error('Bestätigter E-Mail-Zugang erforderlich.');
   identity={id:user.id,email:user.email||''};$('loginPanel').hidden=true;$('signedIn').hidden=false;$('passwordResetPanel').hidden=!recoveryMode;
   $('userBadge').textContent='Verifiziertes Konto · '+safe(identity.email);
   // A7SEM Reverse: identity confirmation is distinct from clinical/practice authorization.
   role=null;clinic=null;clinics=[];admin=false;
   $('clinicWorkspace').hidden=true;$('admin').hidden=true;$('adminEnrollment').hidden=true;
   const [membershipResult,adminResult]=await Promise.allSettled([
     request('/rest/v1/rpc/ortho_clinic_my_access','POST',{}),
     request('/rest/v1/ortho_platform_admins?select=user_id&user_id=eq.'+encodeURIComponent(identity.id)+'&status=eq.active&limit=1')
   ]);
   const membershipUnavailable=membershipResult.status==='rejected',adminUnavailable=adminResult.status==='rejected';
   const membership=membershipUnavailable?[]:membershipResult.value,adminRows=adminUnavailable?[]:adminResult.value;
   clinics=Array.isArray(membership)?membership.filter(a=>['owner','employee','accountant'].includes(a.role)):[];
   admin=Array.isArray(adminRows)&&adminRows.length===1;
   $('admin').hidden=!admin;$('adminEnrollment').hidden=admin||adminUnavailable;
   if(admin)feedback('Plattform-Admin über serverseitiges Profil erkannt. Keine automatische Arztvollmacht.');
   $('pending').hidden=clinics.length>0&&!membershipUnavailable;
   if(membershipUnavailable){
     $('accessMessage').textContent='E-Mail-Konto bestätigt. Praxisberechtigung derzeit nicht überprüfbar (DELAY). Der klinische Arbeitsbereich bleibt gesperrt. Bitte später aktualisieren.';
     feedback('Identität bestätigt, Praxisprüfung nicht erreichbar. Keine klinische Freigabe.',true);
     return;
   }
   if(!clinics.length){
     $('accessMessage').textContent=admin?'Administrationskonto aktiv. Ärztliche Praxiszugehörigkeit ist separat freizuschalten.':adminUnavailable?'E-Mail-Konto bestätigt. Keine Praxisfreigabe nachgewiesen; Adminstatus vorübergehend nicht prüfbar (DELAY).':'Noch keine aktive, bezahlte oder ausdrücklich freigegebene Praxiszugehörigkeit. Einladung durch Praxisleitung erforderlich.';
     return;
   }
   const select=$('clinicSelect');select.replaceChildren();
   for(const a of clinics){const opt=document.createElement('option');opt.value=a.clinic_id;opt.textContent=a.clinic_kind+' · '+a.role+' · '+a.clinic_id.slice(0,8);select.append(opt);}
   clinic=clinics[0].clinic_id;select.value=clinic;
   $('clinicWorkspace').hidden=false;await loadClinic();state('Angemeldet. Serverseitige Praxisberechtigung bestätigt.');
 }
 function getCurrentRole(){return clinics.find(x=>x.clinic_id===clinic)?.role||null;}
 async function loadClinic(){
   role=getCurrentRole();if(!C.role(role)){clinic=null;$('clinicWorkspace').hidden=true;return;}
   $('clinicTag').textContent=clinic.slice(0,8)+'…';
   $('roleTag').textContent=role==='owner'?'Praxisleitung / Arzt':role==='employee'?'Mitarbeiter':'Buchhaltung';
   $('doctorPanel').hidden=!C.permitted(role,'inviteStaff');
   $('printPanel').hidden=!C.permitted(role,'downloadResearchPrint');
   $('roleInfo').textContent=role==='owner'?'Praxisinhaber: Einladungen, Prüffälle und Freigaben. Klinische Druckaktionen weiterhin BLOCK.':role==='employee'?'Mitarbeiter: zugewiesene Prüfschritte bestätigen, keine Therapiefreigabe.':'Buchhaltung: keine klinischen Prüfaufgaben oder Modelle.';
   await Promise.all([loadDirectory(),loadTasks()]);
 }
 $('clinicSelect').addEventListener('change',async e=>{
   taskGate.invalidate();fileGate.invalidate();popupSeen.reset();
   if($('taskDialog').open)$('taskDialog').close();
   currentTask=null;taskCache=[];chosenPrintFile=null;printSha=null;
   resetPrintAttestations();
   clinic=e.target.value;clearInvite();await loadClinic();
 });
 $('refresh').addEventListener('click',()=>{if(session)void loadAccess().catch(e=>feedback(safe(e.message),true));});
 $('logout').addEventListener('click',async()=>{
   taskGate.invalidate();fileGate.invalidate();popupSeen.reset();
   if($('taskDialog').open)$('taskDialog').close();
   currentTask=null;const token=session?.access_token;session=null;identity=null;role=null;clinic=null;clinics=[];admin=false;taskCache=[];
   $('loginPanel').hidden=false;$('signedIn').hidden=true;recoveryMode=false;clearInvite();chosenPrintFile=null;printSha=null;
   resetPrintAttestations();
   try{if(token)await fetch(API+'/auth/v1/logout',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token},credentials:'omit'});}catch{}
   state('Abgemeldet. Sitzung und Dateiauswahl verworfen.');
 });
 $('passwordResetForm').addEventListener('submit',async e=>{
   e.preventDefault();
   const password=$('newPassword').value,confirm=$('newPasswordConfirm').value;
   if(password.length<12||password!==confirm)return feedback('Passwort zu kurz oder Wiederholung stimmt nicht überein.',true);
   try{
     await request('/auth/v1/user','PUT',{password});
     $('newPassword').value='';$('newPasswordConfirm').value='';
     recoveryMode=false;$('passwordResetPanel').hidden=true;
     feedback('Passwort aktualisiert. Bitte bewahren Sie es sicher auf.');
   }catch(err){feedback('Passwortänderung: '+safe(err.message),true);}
 });
 let claimingAdmin=false;
 $('adminClaimForm').addEventListener('submit',async e=>{
   e.preventDefault();
   if(claimingAdmin||admin||!session?.access_token||!identity?.id)return;
   const code=$('adminClaimCode').value.trim();
   if(!/^PIGA-ADMIN-[A-F0-9]{48}$/.test(code)){
     $('adminClaimState').textContent='Ungültiges Aktivierungscodeformat.';return;
   }
   claimingAdmin=true;$('adminClaimSubmit').disabled=true;
   try{
     const result=await request('/rest/v1/rpc/ortho_platform_claim_admin','POST',{p_code:code});
     if(result!==true)throw Error('Serverseitige Adminbestätigung fehlt.');
     $('adminClaimCode').value='';
     await loadAccess();
     if(!admin)throw Error('Adminrolle konnte nach Aktivierung nicht zurückgelesen werden.');
     $('adminClaimState').textContent='Adminzugang serverseitig bestätigt.';
     feedback('Plattformadministration aktiviert. Keine ärztlichen Rechte hinzugefügt.');
   }catch(err){
     $('adminClaimState').textContent='Aktivierung nicht bestätigt. Anmeldung und Einladung prüfen.';
     feedback('Adminaktivierung BLOCK: '+safe(err.message),true);
   }finally{claimingAdmin=false;$('adminClaimSubmit').disabled=false;}
 });
 $('acceptInviteForm').addEventListener('submit',async e=>{
   e.preventDefault();
   const code=$('inviteCode').value.trim();
   if(!C.validInvite(code)){feedback('Einladungscodeformat ungültig.',true);return;}
   try{await request('/rest/v1/rpc/ortho_clinic_accept_invite','POST',{p_code:code});$('inviteCode').value='';await loadAccess();feedback('Einladung serverseitig angenommen.');}
   catch(err){feedback(safe(err.message),true);}
 });
 async function loadDirectory(){
   profileMap=new Map();
   try{
     const res=await request('/rest/v1/ortho_clinic_professional_profiles?select=user_id,profession,display_label&clinic_id=eq.'+encodeURIComponent(clinic));
     if(Array.isArray(res))for(const p of res)profileMap.set(p.user_id,p);
   }catch{}
   const current=profileMap.get(identity?.id);
   $('professionTag').textContent=current?.profession||((role==='owner')?'Praxisleitung / Arzt':'Noch nicht vergeben');
   if(!C.permitted(role,'viewDirectory')){$('members').replaceChildren();return;}
   try{
     const members=await request('/rest/v1/ortho_clinic_memberships?select=user_id,role,status&clinic_id=eq.'+encodeURIComponent(clinic)+'&status=eq.active');
     renderMembers(Array.isArray(members)?members:[]);
   }catch(err){feedback('Teamverzeichnis: '+safe(err.message),true);}
 }
 function renderMembers(rows){
   const host=$('members');host.replaceChildren();
   for(const m of rows){
     const row=document.createElement('div');row.className='member';
     const info=document.createElement('div'),name=document.createElement('b'),caption=document.createElement('small');
     name.textContent=profileMap.get(m.user_id)?.display_label||'Profil '+m.user_id.slice(0,8);
     caption.textContent=m.role==='owner'?'Praxisleitung':m.role==='employee'?'Mitarbeiter':'Buchhaltung';
     info.append(name,caption);row.append(info);
     const select=document.createElement('select');
     const options=[['','Berufsprofil wählen'],['doctor','Arzt / Ärztin'],['assistant','Zahnmedizinische Assistenz'],['technician','Zahntechnik / Labor'],['reception','Empfang / Verwaltung'],['accounting','Buchhaltung']];
     for(const [value,title] of options){const opt=document.createElement('option');opt.value=value;opt.textContent=title;select.append(opt);}
     select.value=profileMap.get(m.user_id)?.profession||'';
     if(m.role!=='owner')select.querySelector('option[value="doctor"]').disabled=true;
     const button=document.createElement('button');button.type='button';button.textContent='Profil speichern';
     button.addEventListener('click',async()=>{
       if(!select.value)return feedback('Berufsprofil auswählen.',true);
       if(select.value==='doctor'&&m.role!=='owner')return feedback('Arztprofil nur für verifizierte Praxisleitung.',true);
       try{
         await request('/rest/v1/ortho_clinic_professional_profiles','POST',{clinic_id:clinic,user_id:m.user_id,profession:select.value,display_label:name.textContent.slice(0,75)},
           true,{'Prefer':'resolution=merge-duplicates,return=minimal'});
         await loadDirectory();feedback('Berufsprofil serverseitig gespeichert.');
       }catch(err){feedback('Berufsprofil: '+safe(err.message),true);}
     });
     row.append(select,button);host.append(row);
   }
   if(!rows.length)host.textContent='Noch keine aktiven Teammitglieder.';
 }
 $('inviteForm').addEventListener('submit',async e=>{
   e.preventDefault();if(!C.permitted(role,'inviteStaff'))return;
   clearInvite();
   try{
     const code=await request('/rest/v1/rpc/ortho_clinic_invite_member','POST',{
       p_clinic:clinic,p_email:$('staffEmail').value.trim(),p_role:$('staffRole').value});
     if(!C.validInvite(code))throw Error('Keine gültige Einladung zurückgegeben.');
     $('issuedInviteCode').textContent=code;$('issuedInvite').hidden=false;feedback('Einmalige Einladung erzeugt – separat und vertraulich weitergeben.');
   }catch(err){feedback('Einladung: '+safe(err.message),true);}
 });
 $('copyInvite').addEventListener('click',async()=>{
   const code=$('issuedInviteCode').textContent;if(!C.validInvite(code))return;
   try{await navigator.clipboard.writeText(code);feedback('Einladungscode kopiert.')}catch{feedback('Kopieren nicht verfügbar: Code manuell sichern.',true);}
 });
 $('createCaseForm').addEventListener('submit',async e=>{
   e.preventDefault();if(!C.permitted(role,'createCases')||!identity)return;
   const ref=$('caseRef').value.trim().toUpperCase();if(!C.safeRef(ref)){feedback('Fallkennung: 3–48 Zeichen, nur Buchstaben, Zahlen, _ und -.',true);return;}
   try{
     const id=await request('/rest/v1/rpc/ortho_clinic_open_checklist_case','POST',{p_clinic:clinic,p_case_ref:ref});
     if(!/^[0-9a-f-]{36}$/i.test(String(id)))throw Error('Fallstatus nicht bestätigt.');
     $('caseRef').value='';await loadTasks();feedback('Prüffall mit zehn Kontrollaufgaben serverseitig angelegt.');
   }catch(err){feedback('Prüffall: '+safe(err.message),true);}
 });
 async function loadTasks(){
   const ticket=taskGate.begin(),scope=clinic,account=identity?.id,scopeRole=role;
   if(!scope||!C.permitted(scopeRole,'viewTasks')){
     taskCache=[];$('taskList').textContent='Keine klinischen Aufgaben für diese Rolle.';$('taskCount').textContent='0';return;
   }
   try{
     const rows=await request('/rest/v1/ortho_clinic_tasks?select=id,clinic_id,case_id,title,state,note,assigned_to,responded_by,responded_at&clinic_id=eq.'+encodeURIComponent(scope)+'&order=created_at.desc&limit=150');
     if(!taskGate.valid(ticket)||scope!==clinic||scopeRole!==role||account!==identity?.id)return;
     taskCache=Array.isArray(rows)?rows.filter(t=>t.clinic_id===scope):[];
     for(const t of taskCache)if(t.state==='done')popupSeen.forget(scope,t.id);
     renderTasks();maybePopup();
   }catch(err){
     if(taskGate.valid(ticket)&&scope===clinic){
       $('taskList').textContent='Aufgaben nicht verfügbar.';feedback('Aufgaben: '+safe(err.message),true);
     }
   }
 }
 function renderTasks(){
   const host=$('taskList');host.replaceChildren();
   const visible=taskCache.filter(t=>t.assigned_to===null||t.assigned_to===identity?.id||role==='owner');
   const summary=C.taskSummary(visible);
   $('taskCount').textContent=String(summary.pending);
   for(const t of visible){
     const row=document.createElement('div');row.className='task'+(t.state==='done'?' done':'');
     const info=document.createElement('div'),heading=document.createElement('b'),sub=document.createElement('small');
     heading.textContent=t.title;sub.textContent=(t.state==='done'?'Bestätigt':'Kontrolle ausstehend')+' · Fall '+t.case_id.slice(0,8);
     info.append(heading,sub);row.append(info);
     const button=document.createElement('button');button.type='button';button.textContent=C.canRespond(role,t)?(t.state==='done'?'Erneut kontrollieren':'Kontrollieren'):'Nur ärztliche Kontrolle';button.disabled=!C.canRespond(role,t);
     button.addEventListener('click',()=>openTask(t));row.append(button);host.append(row);
   }
   if(!visible.length)host.textContent='Keine Aufgaben für dieses Konto.';
 }
 function openTask(t){
   if(!C.canRespond(role,t))return;
   currentTask=t;$('dialogTitle').textContent=t.title;
   $('dialogDescription').textContent='Nur nach eigenständiger Prüfung bestätigen. Frühere Prüfung: '+(t.responded_at||'keine')+'.';
   $('confirmed').checked=false;$('taskNote').value='';$('taskDialog').showModal();
 }
 function maybePopup(){
   if(!$('notify').checked||!C.permitted(role,'acknowledge')||$('taskDialog').open)return;
   const next=taskCache.find(t=>t.state!=='done'&&(t.assigned_to===null||t.assigned_to===identity?.id||role==='owner')&&C.canRespond(role,t)&&popupSeen.shouldNotify(clinic,t.id));
   if(next)openTask(next);
 }
 $('loadTasks').addEventListener('click',()=>{void loadTasks()});
 $('notify').addEventListener('change',()=>{
   if($('notify').checked)popupSeen.reset();
   maybePopup();
 });
 $('cancelTask').addEventListener('click',()=>{$('taskDialog').close();currentTask=null});
 async function answerTask(state){
   if(taskRespondBusy||!currentTask||!clinic||!C.canRespond(role,currentTask))return;
   const note=$('taskNote').value.trim(),task=currentTask,scope=clinic;
   if(state==='done'&&(!$('confirmed').checked||note.length<8)){feedback('Kontrolle abhaken und Beobachtung mit mindestens acht Zeichen dokumentieren.',true);return;}
   if(state==='not_done'&&note.length<3){feedback('Für nicht erledigt bitte eine konkrete Begründung eingeben.',true);return;}
   taskRespondBusy=true;
   for(const b of $('taskResponse').querySelectorAll('button'))b.disabled=true;
   try{
     await request('/rest/v1/rpc/ortho_clinic_task_respond','POST',{p_clinic:scope,p_task:task.id,p_state:state,p_note:note});
     if(scope!==clinic||currentTask!==task)return;
     $('taskDialog').close();currentTask=null;await loadTasks();
     feedback(state==='done'?'Kontrolle serverseitig protokolliert.':'Offene Kontrolle serverseitig protokolliert.');
   }catch(err){feedback('Kontrolle: '+safe(err.message),true);}
   finally{
     taskRespondBusy=false;
     for(const b of $('taskResponse').querySelectorAll('button'))b.disabled=false;
   }
 }
 $('taskResponse').addEventListener('submit',e=>{e.preventDefault();void answerTask('done')});
 $('blockedTask').addEventListener('click',()=>{void answerTask('not_done')});
 function resetPrintAttestations(){
   for(const c of document.querySelectorAll('#printChecklist [data-proof]'))c.checked=false;
   $('printerModel').value='';
   $('downloadPrint').disabled=true;
 }
 $('machineFile').addEventListener('change',async e=>{
   const file=e.target.files?.[0]||null,ticket=fileGate.begin(),gate=C.assessMachineFile(file);
   chosenPrintFile=null;printSha=null;resetPrintAttestations();
   if(!gate.ok){$('printSummary').textContent=gate.reason;return;}
   $('printSummary').textContent='Datei wird lokal auf Integrität geprüft…';
   try{
     const bytes=await file.arrayBuffer(),h=await crypto.subtle.digest('SHA-256',bytes);
     if(!fileGate.valid(ticket))return;
     printSha=Array.from(new Uint8Array(h),x=>x.toString(16).padStart(2,'0')).join('');
     chosenPrintFile=file;
     $('printSummary').textContent=file.name+' · '+file.size.toLocaleString('de-DE')+' Byte · SHA-256 '+printSha.slice(0,18)+'… | Kein unabhängiger Slicer-/Gerätenachweis.';
     checkPrint();
   }catch(err){if(fileGate.valid(ticket))$('printSummary').textContent='Prüfung fehlgeschlagen: '+safe(err.message);}
 });
 function checkPrint(){
   const checks=[...document.querySelectorAll('#printChecklist [data-proof]')];
   $('downloadPrint').disabled=printBusy||!S.printEligible({
     verifiedOwner:C.permitted(role,'downloadResearchPrint'),filePresent:Boolean(chosenPrintFile),
     sha256:printSha,size:chosenPrintFile?.size,
     checked:checks.filter(c=>c.checked).length,model:$('printerModel').value
   });
 }
 $('printChecklist').addEventListener('change',checkPrint);
 $('printerModel').addEventListener('input',checkPrint);
 function save(data,name,type){
   const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');
   a.download=name;a.href=url;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 $('printChecklist').addEventListener('submit',async e=>{
   e.preventDefault();checkPrint();
   if(printBusy||$('downloadPrint').disabled)return feedback('Druckdatei-Prüfschritte fehlen.',true);
   const ticket=fileGate.begin(),scope=clinic,actor=identity?.id,file=chosenPrintFile,digest=printSha;
   printBusy=true;checkPrint();
   try{
     // Check at the moment of export: an earlier hash may not authorize a newer file.
     const active=await request('/rest/v1/rpc/ortho_clinic_my_access','POST',{});
     if(!Array.isArray(active)||!active.some(a=>a.clinic_id===scope&&a.role==='owner'))
       throw Error('Serverrolle nicht mehr aktiv. Export gesperrt.');
     const bytes=await file.arrayBuffer();
     const hash=await crypto.subtle.digest('SHA-256',bytes);
     const finalDigest=Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
     if(!fileGate.valid(ticket)||scope!==clinic||actor!==identity?.id||file!==chosenPrintFile||digest!==printSha)
       throw Error('Datei oder Praxis während der Prüfung geändert. Erneut kontrollieren.');
     if(finalDigest!==digest)throw Error('Dateiinhalt hat sich geändert. Integritätsprüfung BLOCK.');
     const manifest={
       schema:'piga-ortho-print-preflight-v1',timestamp:new Date().toISOString(),role:'owner',clinicId:scope,
       actorId:actor,file:{name:file.name,size:file.size,sha256:finalDigest},
       deviceModel:$('printerModel').value.trim(),attested:[...document.querySelectorAll('#printChecklist [data-proof]')].filter(x=>x.checked).map(x=>x.dataset.proof),
       clinicalApproval:'BLOCK',printerStart:'NOT_EXECUTED',mechanicalCompatibility:'NOT_VERIFIED',
       source:'operator-supplied slicer file',note:'Forschungsdatei unverändert ausgegeben. Kein zertifizierter Druckerauftrag.'
     };
     if(!S.printEligible({verifiedOwner:true,filePresent:true,sha256:finalDigest,size:file.size,
       checked:manifest.attested.length,model:manifest.deviceModel}))
       throw Error('Prüfung wurde zwischenzeitlich verändert.');
     save(JSON.stringify(manifest,null,2),'PIGA_Ortho_Druck_Preflight_'+new Date().toISOString().slice(0,10)+'.json','application/json');
     save(file,file.name.replace(/[\\/\x00-\x1f]/g,'_').slice(0,120),'application/octet-stream');
     feedback('Datei und Prüfpass zum Download bereitgestellt. Keine Druckaktion ausgelöst.');
   }catch(err){
     feedback('Druckdatei BLOCK: '+safe(err.message),true);
   }finally{printBusy=false;checkPrint();}
 });
 // Tab-visible notification poll only; never a 24/7 or background guarantee.
 setInterval(()=>{if(document.visibilityState==='visible'&&session&&clinic&&C.permitted(role,'viewTasks'))void loadTasks();},60000);
 document.addEventListener('visibilitychange',()=>{
   if(document.visibilityState==='visible'&&session&&clinic&&C.permitted(role,'viewTasks'))void loadTasks();
 });
 void verifyRecoveryOrConfirmation();
})();
