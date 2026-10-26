'use strict';
/* PIGA ORTHO 3D: a single adaptive workspace manager across existing pages.
   Pure presentation: DOM is not reparented and no business / Gate-2 action is changed. */
(()=>{
 const STORE='piga-ortho-workspace-v1', PANELS=[
  '.pc-card','.handoff-card','.hub-panel','.diag-section','.ops-panel','.ops-card',
  '.transport','.stepper','.workbench','.workspace','.inspector',
  '.tool-card','.module-card','.panel','.tile','.paper'
 ];
 const page=(location.pathname.split('/').pop()||'dashboard.html').replace('.html','');
 if(['sales','index','auth','privacy'].includes(page))return;
 const main=document.querySelector('main');
 if(!main||document.querySelector('#piga-workspace-bar'))return;
 let saved={density:'comfort',font:'normal'};
 try{const x=JSON.parse(localStorage.getItem(STORE)||'{}');if(x&&typeof x==='object')saved={...saved,...x};}catch{}
 if(!['comfort','compact'].includes(saved.density))saved.density='comfort';
 if(!['normal','large'].includes(saved.font))saved.font='normal';
 const bar=document.createElement('section');bar.id='piga-workspace-bar';bar.className='piga-workspace-bar';bar.setAttribute('aria-label','Arbeitsfläche und Darstellung');
 const text=document.createElement('div');text.className='piga-workspace-name';
 const eyebrow=document.createElement('small');eyebrow.textContent='DEIN ARBEITSPLATZ';
 const title=document.createElement('strong');title.textContent='Mehr Raum für jedes Werkzeug.';
 text.append(eyebrow,title);bar.append(text);
 const controls=document.createElement('div');controls.className='piga-workspace-controls';
 const density=document.createElement('button');density.type='button';density.className='piga-workspace-control';
 const font=document.createElement('button');font.type='button';font.className='piga-workspace-control';
 const expand=document.createElement('button');expand.type='button';expand.className='piga-workspace-control primary';
 expand.textContent='Werkzeug maximieren';expand.setAttribute('title','Klick auf eine Werkzeugkarte, dann maximieren');
 const reset=document.createElement('button');reset.type='button';reset.className='piga-workspace-control';
 reset.textContent='Übersicht';reset.setAttribute('title','Maximiertes Werkzeug schließen und normale Anordnung anzeigen');
 controls.append(density,font,expand,reset);bar.append(controls);
 const status=document.createElement('span');status.className='piga-workspace-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 status.textContent='Großzügige Arbeitsflächen · lokal auf diesem Gerät';bar.append(status);
 // Place after a module heading, never inside a form or the 3D rendering canvas.
 const heading=main.querySelector('.ortho-v3-masthead,.pc-hero,.shell-top,.hub-top,.handoff-intro,.diag-hero,.ops-note');
 if(heading)heading.insertAdjacentElement('afterend',bar);else main.prepend(bar);
 let chosen=null,maximized=null,returnFocus=null,shade=null,close=null,oldRole=null,oldLabel=null;
 const candidates=()=>[...main.querySelectorAll(PANELS.join(','))].filter(p=>{
  if(p.closest('#piga-workspace-bar')||p.closest('.piga-workspace-controls'))return false;
  // Avoid selecting parent/child duplicates and non-visible content or summary tiles.
  if(p.closest('.piga-maximized-panel'))return false;
  if(p.getClientRects().length===0||p.offsetHeight<125)return false;
  return true;
 });
 function persist(){try{localStorage.setItem(STORE,JSON.stringify(saved))}catch{}}
 function settings(){
  document.body.classList.toggle('piga-density-compact',saved.density==='compact');
  document.body.classList.toggle('piga-font-large',saved.font==='large');
  density.textContent=saved.density==='comfort'?'Ansicht: großzügig':'Ansicht: kompakt';
  density.setAttribute('aria-pressed',String(saved.density==='compact'));
  font.textContent=saved.font==='normal'?'Schrift: normal':'Schrift: größer';
  font.setAttribute('aria-pressed',String(saved.font==='large'));
 }
 const isSelectable=el=>el&&!(el instanceof HTMLInputElement)&&!el.closest('button,a,input,select,textarea,label,summary,[contenteditable="true"]');
 function select(panel){
  if(!panel||maximized)return;
  if(chosen)chosen.classList.remove('piga-workspace-selected');
  chosen=panel;chosen.classList.add('piga-workspace-selected');
  expand.disabled=false;
  const label=panel.querySelector('h2,h3,.tilehead,.eyebrow')?.textContent?.trim().slice(0,58)||'Arbeitsbereich';
  status.textContent='Ausgewählt: '+label;
 }
 function teardown(){
  if(!maximized)return;
  maximized.classList.remove('piga-maximized-panel','piga-workspace-selected');
  if(oldRole===null)maximized.removeAttribute('role');else maximized.setAttribute('role',oldRole);
  if(oldLabel===null)maximized.removeAttribute('aria-label');else maximized.setAttribute('aria-label',oldLabel);
  maximized.removeAttribute('aria-modal');oldRole=null;oldLabel=null;
  document.body.classList.remove('piga-panel-open');
  shade?.remove();close?.remove();shade=null;close=null;maximized=null;chosen=null;
  expand.disabled=false;status.textContent='Werkzeug geschlossen · alle Bereiche sichtbar';
  if(returnFocus?.isConnected)returnFocus.focus();else expand.focus();
 }
 function open(panel){
  if(!panel||maximized)return;
  returnFocus=document.activeElement;
  chosen=panel;maximized=panel;
  oldRole=panel.getAttribute('role');oldLabel=panel.getAttribute('aria-label');
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-label','Vergrößertes Werkzeug');
  shade=document.createElement('div');shade.className='piga-panel-backdrop';
  shade.setAttribute('aria-hidden','true');shade.addEventListener('click',teardown);
  close=document.createElement('button');close.type='button';close.className='piga-panel-close';
  close.textContent='← Zurück zur Gesamtansicht';close.setAttribute('aria-label','Werkzeugansicht schließen');
  close.addEventListener('click',teardown);
  document.body.append(shade,close);
  document.body.classList.add('piga-panel-open');
  panel.classList.remove('piga-workspace-selected');panel.classList.add('piga-maximized-panel');
  status.textContent='Maximierter Arbeitsbereich · Escape zum Schließen';
  close.focus();
 }
 // One-click expansion via a real button attached to functional, sufficiently large cards.
 function attach(){
  for(const p of candidates()){
   if(p.dataset.pigaWorkspaceAttached)return;
   const h=p.querySelector('h2,h3,.tilehead');
   if(!h)continue;
   if(p.closest('.ops-panel,.ops-card')&&p.querySelector('.ops-panel'))continue;
   const action=document.createElement('button');action.type='button';action.className='piga-panel-action';
   action.textContent='↗';action.setAttribute('aria-label','Dieses Werkzeug groß anzeigen');
   action.title='Werkzeug maximieren';
   action.addEventListener('click',e=>{e.stopPropagation();select(p);open(p)});
   p.insertAdjacentElement('afterbegin',action);
   p.dataset.pigaWorkspaceAttached='1';
   p.addEventListener('pointerdown',e=>{if(isSelectable(e.target))select(p)},{passive:true});
  }
 }
 density.addEventListener('click',()=>{saved.density=saved.density==='comfort'?'compact':'comfort';persist();settings();status.textContent='Anordnung: '+(saved.density==='compact'?'kompakt':'großzügig')});
 font.addEventListener('click',()=>{saved.font=saved.font==='normal'?'large':'normal';persist();settings();status.textContent='Schriftgröße angepasst.'});
 expand.addEventListener('click',()=>{attach();const first=chosen||candidates().find(p=>p.querySelector('h2,h3,.tilehead'));if(first)open(first);else status.textContent='Auf dieser Seite gibt es keine vergrößerbare Werkzeugkarte.'});
 reset.addEventListener('click',()=>{if(maximized)teardown();if(chosen)chosen.classList.remove('piga-workspace-selected');chosen=null;
 saved={density:'comfort',font:'normal'};persist();settings();status.textContent='Übersicht und großzügige Standarddarstellung aktiv'});
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&maximized){e.preventDefault();teardown();}
  if(e.key==='Tab'&&maximized){
   const items=[close,...maximized.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')]
    .filter(el=>el?.getClientRects().length>0&&!el.hidden);
   if(items.length){const first=items[0],last=items[items.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   }
  }
  if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==='m'){e.preventDefault();if(maximized)teardown();else expand.click();}
 });
 // Delay initial attachment until modules have rendered; no polling and no infinite observers.
 document.addEventListener('DOMContentLoaded',attach,{once:true});
 if(document.readyState!=='loading')attach();
 window.addEventListener('pageshow',attach);
 // New local tasks/cards appear without reload. Attach a toolbar only to added functional cards.
 if(typeof MutationObserver!=='undefined'){
  let queued=false;
  const observer=new MutationObserver(records=>{
   if(queued||!records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&!n.classList?.contains('piga-panel-action'))))return;
   queued=true;queueMicrotask(()=>{queued=false;attach()});
  });observer.observe(main,{childList:true,subtree:true});
 }
 window.addEventListener('piga-worker-resume',attach);
 expand.disabled=false;settings();
})();
