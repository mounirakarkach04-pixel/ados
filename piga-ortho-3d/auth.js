'use strict';
(async()=>{
 const API='https://sanrkcovmkkhgdqydxfk.supabase.co',KEY='sb_publishable_GWNQHoz-ML6wphVEyXz0pA_TLuNDzDQ';
 const $=id=>document.getElementById(id),msg=s=>$('stateText').textContent=s;
 let recoveryToken=null;
 const search=new URLSearchParams(location.search);
 const hash=new URLSearchParams(location.hash.replace(/^#/,'')); // kept in current tab only
 const status=search.get('state')||'';
 const error=hash.get('error_description')||search.get('error_description');
 if(error){msg('Link nicht akzeptiert: '+error+'. Bitte eine neue Bestätigung anfordern.');$('mailWaiting').hidden=false;return;}
 if(status==='check-email'){msg('Bitte bestätigen Sie Ihre E-Mail-Adresse.');$('mailWaiting').hidden=false;return;}
 const tokenHash=search.get('token_hash'),type=search.get('type')||hash.get('type')||'';
 if(tokenHash){
  try{
   if(!['signup','email','recovery'].includes(type))throw Error('Unbekannter Bestätigungstyp.');
   const r=await fetch(API+'/auth/v1/verify',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({token_hash:tokenHash,type}),credentials:'omit'});
   const data=await r.json();if(!r.ok)throw Error(data.msg||data.message||'Bestätigungslink abgelaufen');
   if(type==='recovery'){recoveryToken=data.access_token;if(!recoveryToken)throw Error('Kein Wiederherstellungstoken');$('resetForm').hidden=false;msg('Legen Sie jetzt Ihr neues Passwort fest.');}
   else{msg('E-Mail-Adresse bestätigt. Melden Sie sich nun an; die Praxisleitung muss Ihr Profil anschließend freigeben.');}
  }catch(e){msg('Verifizierung fehlgeschlagen: '+e.message+'. Fordern Sie einen neuen Link an.');$('mailWaiting').hidden=false;}
 }else if(hash.get('access_token')){
  recoveryToken=hash.get('access_token');
  if(type==='recovery'){$('resetForm').hidden=false;msg('Passwortwiederherstellung bestätigt. Bitte neues Passwort eingeben.');}
  else{msg('E-Mail-Adresse bestätigt. Bitte melden Sie sich mit Ihrem persönlichen Konto an.');}
 }else if(search.get('code')){msg('Die Anmeldung hat einen PKCE-Code geliefert, aber keine zugehörige Prüfsitzung. Bitte mit einem neuen Link anmelden.');$('mailWaiting').hidden=false;}
 else{msg('Kein Bestätigungslink erkannt.');$('mailWaiting').hidden=false;}
 // Secrets must not remain visible in copied browser URLs
 if(location.search||location.hash)history.replaceState(null,'','./auth.html');
 $('resetForm').addEventListener('submit',async e=>{
  e.preventDefault();const a=$('newPassword').value,b=$('newPasswordRepeat').value;
  if(a.length<12||a!==b){$('verificationFeedback').textContent='Bitte identische Passwörter mit mindestens zwölf Zeichen eingeben.';return;}
  if(!recoveryToken){$('verificationFeedback').textContent='Wiederherstellungslink abgelaufen oder ungültig.';return;}
  const button=$('resetForm').querySelector('button');button.disabled=true;
  try{
   const res=await fetch(API+'/auth/v1/user',{method:'PUT',headers:{apikey:KEY,Authorization:'Bearer '+recoveryToken,'Content-Type':'application/json'},body:JSON.stringify({password:a}),credentials:'omit'});
   const data=await res.json();if(!res.ok)throw Error(data.msg||data.message||'Passwort konnte nicht aktualisiert werden.');
   $('resetForm').hidden=true;recoveryToken=null;$('newPassword').value='';$('newPasswordRepeat').value='';
   $('verificationFeedback').textContent='Passwort aktualisiert. Bitte mit dem neuen Passwort anmelden.';
  }catch(err){$('verificationFeedback').textContent=err.message;}finally{button.disabled=false;}
 });
})();