'use strict';
/* Gentle, dismissible first-install guidance: never blocks access to any module. */
(()=>{
 const PAGE=(location.pathname.split('/').pop()||'dashboard.html');
 if(['setup.html','sales.html','privacy.html','index.html'].includes(PAGE))return;
 const KEY='piga-ortho-setup-v1',OFFER='piga-ortho-setup-offer-v1';
 let done=false;try{done=JSON.parse(localStorage.getItem(KEY)||'null')?.completed===true}catch{}
 let ignored=false;try{ignored=sessionStorage.getItem(OFFER)==='dismissed'}catch{}
 if(done||ignored||document.getElementById('piga-setup-offer'))return;
 const box=document.createElement('aside');box.id='piga-setup-offer';box.className='piga-setup-offer';
 box.setAttribute('aria-label','PIGA Einrichtungsassistent');
 const head=document.createElement('strong');head.textContent='Neu bei PIGA? Gemeinsam in sechs Schritten starten.';
 const para=document.createElement('p');para.textContent='Geräte, Offline-Speicher, Worker und Sprache prüfen. Du kannst die App jederzeit normal benutzen.';
 const actions=document.createElement('div');
 const open=document.createElement('a');open.href='./setup.html';open.textContent='Einrichtung starten';
 const later=document.createElement('button');later.type='button';later.textContent='Später';
 later.addEventListener('click',()=>{try{sessionStorage.setItem(OFFER,'dismissed')}catch{}box.remove()});
 actions.append(open,later);box.append(head,para,actions);document.body.append(box);
})();
