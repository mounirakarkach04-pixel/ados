'use strict';
/* Shared floating local PIGA help & honest foreground heartbeat on every application page. */
(()=>{
 if(document.getElementById('piga-pocket-widget')||location.pathname.endsWith('/piga-control.html')||
  location.pathname.endsWith('/sales.html'))return;
 const N=(tag,content,cls)=>{const el=document.createElement(tag);if(content!==undefined)el.textContent=content;if(cls)el.className=cls;return el};
 const holder=N('aside',undefined,'piga-pocket-widget');holder.id='piga-pocket-widget';
 const launch=N('button','PIGA · Lokal ●','piga-pocket-launch');launch.type='button';
 launch.setAttribute('aria-label','PIGA Schnellassistent öffnen');launch.setAttribute('aria-expanded','false');
 const panel=N('section',undefined,'piga-pocket-panel');panel.hidden=true;
 const head=N('div',undefined,'piga-pocket-top');
 const title=N('strong','PIGA · Schnellassistent');const close=N('button','×','piga-pocket-close');
 close.type='button';close.setAttribute('aria-label','Assistent schließen');
 head.append(title,close);
 const status=N('div','Bereit · dieses Gerät','piga-pocket-status');status.setAttribute('role','status');
 const answer=N('div','Frag mich nach STL, PIGA, Material, BEMA, Urlaub oder den Workern.','piga-pocket-answer');
 answer.setAttribute('aria-live','polite');
 const form=N('form',undefined,'piga-pocket-form'),input=N('input',undefined,'piga-pocket-input');
 input.id='pigaPocketInput';input.placeholder='PIGA fragen …';input.maxLength=250;
 input.setAttribute('aria-label','PIGA lokale Frage');
 const send=N('button','Fragen');send.type='submit';form.append(input,send);
 const action=N('a','Zur PIGA-Zentrale');action.href='./piga-control.html';action.className='piga-pocket-more';
 panel.append(head,status,answer,form,action);holder.append(launch,panel);document.body.append(holder);
 const closePanel=()=>{panel.hidden=true;launch.setAttribute('aria-expanded','false');launch.focus()};
 launch.onclick=()=>{panel.hidden=!panel.hidden;launch.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)input.focus()};
 close.onclick=closePanel;
 holder.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();closePanel()}});
 form.onsubmit=e=>{
  e.preventDefault();const q=input.value.trim();if(!q)return;
  const brain=window.PigaBrain;
  if(!brain){answer.textContent='Lokales PIGA-Wissen nicht geladen. Hauptzentrale öffnen.';return}
  const role=(()=>{try{return sessionStorage.getItem('piga-control-view')==='staff'?'staff':'owner'}catch{return 'owner'}})();
  const result=brain.answer(q,role);
  answer.replaceChildren(N('p',result.reply));
  const link=N('a','Zum Werkzeug: '+result.routeTitle);link.href=result.href;answer.append(link);
  status.textContent='LOKAL · regelbasiert · keine externe Aktion';input.value='';
 };
 const refresh=async()=>{
  if(!holder.isConnected||document.visibilityState!=='visible'){
   status.textContent='PAUSIERT · Browsertab im Hintergrund';launch.textContent='PIGA · Pausiert';return;
  }
  let queue=0;
  try{queue=(await window.PigaDeviceStore?.listJobs?.()||[]).filter(j=>j.state==='QUEUED'||j.state==='RUNNING').length}catch{}
  const time=new Date().toLocaleTimeString('de-DE');
  status.textContent='Seiten-Herzschlag '+time+' · '+queue+' lokale Jobs offen';
  launch.textContent='PIGA · '+(queue?queue+' Jobs':'Lokal ●');
 };
 void refresh();
 const timer=setInterval(()=>{void refresh()},15000);
 window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
 document.addEventListener('visibilitychange',()=>{void refresh()});
})();
