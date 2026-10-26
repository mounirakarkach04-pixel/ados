'use strict';
/* Enables existing Ortho v1.2 screens without the broken sign-in UI.
   Does not fake a server identity, bypass Supabase RLS or claim connected printer authority. */
(()=>{
 const $=id=>document.getElementById(id);
 const page=location.pathname.split('/').pop();
 const reveal=id=>{if($(id))$(id).hidden=false};
 const conceal=id=>{if($(id))$(id).hidden=true};
 const replace=(id,value)=>{if($(id))$(id).textContent=value};
 const note=document.createElement('aside');
 note.className='piga-access-note';
 note.style.cssText='margin:14px auto;max-width:1120px;padding:13px 17px;border:1px solid #8cb6b6;border-radius:13px;background:#effaf9;color:#244f57;font:14px/1.5 system-ui,sans-serif';
 const lead=document.createElement('strong');lead.textContent='Direkter Zugang zur vollständigen Ortho-Oberfläche · v1.2';
 const detail=document.createElement('div');detail.textContent='Keine Anmeldung nötig, um die Module anzusehen. Funktionen mit Supabase-Datenbank, Personalrechten oder externer Geräteausführung sind weiterhin server-/geräteabhängig; ein fehlender Login ist keine Backend-Berechtigung.';
 note.append(lead,detail);
 const main=document.querySelector('main');
 if(main)main.prepend(note);
 if(page==='praxis.html'){
  conceal('authShell');conceal('pending');
  ['dashboard','activeTools','kpiStrip','ownerArea','handoffPanel'].forEach(reveal);
  replace('accountLabel','Direkte Ansicht · für serverseitige Vorgänge ist eine Backend-Anbindung erforderlich.');
  replace('roleBadge','OFFENE OBERFLÄCHE');
  replace('staffCodeBadge','KEIN SERVERKONTO');
  $('logout')?.remove();
 }else if(page==='team.html'){
  conceal('loginPanel');conceal('waitingPanel');
  ['workspace','employeeTools','ownerArea','accountantArea','ownerNav','accountantNav'].forEach(reveal);
  replace('identity','Direkte Ansicht · keine Anmeldung erforderlich.');
  replace('roleBadge','Oberfläche zugänglich');
  $('logout')?.remove();
 }else if(page==='inventory.html'){
  conceal('locked');
  ['workspace','staffNav','staffPermissions','addNewItem','configuration'].forEach(reveal);
  replace('identity','Lokale Ansicht ohne Anmeldung · kein Zugriff auf Serverbestände');
  replace('permissionBadge','OFFENE OBERFLÄCHE');
  $('logout')?.remove();
 }
})();