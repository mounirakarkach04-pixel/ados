'use strict';
/* Install hosted HTML PWA when the browser supports the install prompt; otherwise explain manual steps. */
(()=>{
 let pending=null;
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();pending=e;update()});
 const make=()=>{
  const target=document.querySelector('.ortho-v3-mast-actions')||document.querySelector('.hero-actions');
  if(!target)return;
  const button=document.createElement('button');button.className='ortho-v3-install';button.type='button';button.textContent='App auf Gerät installieren';
  const help=document.createElement('div');help.className='ortho-v3-install-hint';help.hidden=true;help.setAttribute('role','status');
  button.addEventListener('click',async()=>{
   if(pending){const p=pending;pending=null;try{await p.prompt();await p.userChoice}catch{}update();return}
   const ua=navigator.userAgent||'';
   help.textContent=/iPhone|iPad|iPod/i.test(ua)?'Safari: Teilen → Zum Home-Bildschirm hinzufügen.':
    /Android/i.test(ua)?'Browser-Menü (⋮) → App installieren oder Zum Startbildschirm hinzufügen.':
    'Browser-Menü oder Installationssymbol in der Adressleiste → App installieren. Falls nicht vorhanden, ist die Installation auf diesem Browser nicht verfügbar.';
   help.hidden=false;
  });
  target.append(button);target.parentElement?.append(help);
  window.addEventListener('appinstalled',()=>{button.textContent='App installiert';button.disabled=true;help.hidden=true});
  return button;
 };
 let button;
 function update(){if(button)button.textContent=pending?'App jetzt installieren':'App auf Gerät installieren'}
 const activate=()=>{
   if(button)return;
   button=make();
   if(button)update();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',activate,{once:true});
 else activate();
 if(!button&&typeof MutationObserver!=='undefined'){
   const observer=new MutationObserver(()=>{if(button){observer.disconnect();return}activate();if(button)observer.disconnect()});
   observer.observe(document.body,{childList:true,subtree:true});
   window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
 }
})();
