'use strict';
(()=>{
 const paths=[
 {id:'dashboard',label:'Übersicht',desc:'Zentraler Start, Schnellsuche, STL-Check und Freigabe-Checklisten',href:'./dashboard.html',icon:'grid'},
 {id:'cases',label:'Fälle & Kalender',desc:'Lokale Testfälle, Aufgaben und Termine',href:'./direct.html#cases',icon:'calendar'},
 {id:'praxis',label:'Praxis',desc:'Mitarbeiter, Rollen, Zeiten, Auftragsverlauf und vertrauliche Kalkulation',href:'./praxis.html',icon:'users'},
 {id:'team',label:'Personal & Steuer',desc:'Unterweisung, Dienstplan, Urlaub, Krankmeldung und freigegebene Lohndaten',href:'./team.html',icon:'users'},
 {id:'inventory',label:'Inventur & Material',desc:'Bestände, Bedarfsplanung, Mindestmengen, Verfall und Bestellvorschläge',href:'./inventory.html',icon:'grid'},
 {id:'studio',label:'3D-Studio',desc:'STL ansehen, drehen, technische Geometrie prüfen',href:'./studio.html#studio',icon:'cube'},
 {id:'assistant',label:'Assistent',desc:'Geführte Schritte und KFO-Katalog',href:'./assist.html',icon:'flow'},
 {id:'workflow',label:'Prozesse',desc:'Zwölf Schritte, User Route und Ergebnisroute',href:'./workflow.html',icon:'flow'},
 {id:'devices',label:'Geräte',desc:'WLAN, Bluetooth, USB-Scanimport und technische Geräteprüfung',href:'./devices.html',icon:'printer'},
 {id:'printer',label:'Fertigung',desc:'OctoPrint mit Gate-2-Freigaben und Status-Readback',href:'./studio.html#printer',icon:'printer'},
 {id:'quality',label:'Glassbox',desc:'Audit, PIGA und A7SEM Reverse',href:'./studio.html#evidence',icon:'shield'},
 {id:'devicehub',label:'Geräte-Datenbank',desc:'IndexedDB, lokale Worker, verschlüsselte Sicherung und mobiler Speicher',href:'./device-hub.html',icon:'database'},
 {id:'report',label:'Prüfakte / PDF',desc:'Druckfertiger PIGA und A7SEM-Nachweis mit lokaler Hashprüfung',href:'./report.html',icon:'document'}
 ];
 const icons={
 database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v7c0 2 4 4 9 4s9-2 9-4V5M3 12v7c0 2 4 4 9 4s9-2 9-4v-7"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 15h3"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M17 15a5 5 0 0 1 4 5"/>',
 cube:'<path d="m12 2 9 5-9 5-9-5 9-5ZM3 7v10l9 5 9-5V7M12 12v10"/>',
 flow:'<rect x="2" y="4" width="7" height="6" rx="1"/><rect x="15" y="14" width="7" height="6" rx="1"/><path d="M9 7h5v10h1M4 14h8"/>',
 printer:'<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/><path d="M18 12h1"/>',
 shield:'<path d="m12 2 9 4v6c0 5-3.3 8-9 10-5.7-2-9-5-9-10V6z"/><path d="m8 12 3 3 5-6"/>',
 document:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 8h8M8 12h8M8 16h6"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>'
 };
 const svg=k=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[k]+'</svg>';
 const filename=location.pathname.split('/').pop()||'index.html';
 let selected=filename==='device-hub.html'?'devicehub':filename==='direct.html'?'cases':filename==='studio.html'?'studio':filename==='team.html'?'team':filename==='auth.html'?'team':filename==='praxis.html'?'praxis':filename==='workflow.html'?'workflow':filename==='dashboard.html'?'dashboard':filename==='report.html'?'report':filename==='inventory.html'?'inventory':filename==='devices.html'?'devices':filename==='assist.html'?'assistant':'studio';
 if(filename==='studio.html'||filename==='index.html'){if(location.hash==='#printer')selected='printer';if(location.hash==='#evidence'||location.hash==='#governance')selected='quality';}
 const a=(p,cls)=>{const link=document.createElement('a');link.href=p.href;link.className=cls;link.innerHTML=svg(p.icon)+'<span>'+p.label+'</span>';link.title=p.desc;if(p.id===selected)link.setAttribute('aria-current','page');return link;};
 const rail=document.createElement('nav');rail.className='piga-rail';rail.setAttribute('aria-label','PIGA ORTHO Hauptnavigation');
 const brand=document.createElement('a');brand.className='piga-mark';brand.href='./dashboard.html';brand.innerHTML='<span class="piga-mark-icon">⊓</span><span><b>PIGA</b><small>ORTHO 3D</small></span>';rail.append(brand);
 const cap=document.createElement('span');cap.className='piga-caption';cap.textContent='ARBEITSBEREICHE';rail.append(cap);
 const links=document.createElement('div');links.className='piga-links';paths.forEach(p=>links.append(a(p,'piga-link')));rail.append(links);
 const tools=document.createElement('div');tools.className='piga-rail-foot';
 const trigger=document.createElement('button');trigger.type='button';trigger.className='piga-search-btn';trigger.innerHTML=svg('search')+'<span>Schnellsuche · Ctrl K</span>';trigger.setAttribute('aria-label','Schnellsuche öffnen');tools.append(trigger);
 const toggle=document.createElement('button');toggle.type='button';toggle.className='piga-search-btn piga-space-toggle';
 toggle.setAttribute('aria-label','Arbeitsfläche verbreitern oder Navigation ausklappen');
 const NAV_KEY='piga-ortho-wide-nav';
 const compact=()=>{let pref='compact';try{pref=localStorage.getItem(NAV_KEY)||'compact'}catch{}return pref==='compact';};
 const setCompact=enabled=>{
  document.body.classList.toggle('piga-compact-nav',enabled);
  toggle.innerHTML=svg('grid')+'<span>'+(enabled?'Navigation ausklappen':'Mehr Arbeitsfläche')+'</span>';
  toggle.setAttribute('aria-pressed',String(enabled));
 };
 toggle.addEventListener('click',()=>{const enabled=!document.body.classList.contains('piga-compact-nav');try{localStorage.setItem(NAV_KEY,enabled?'compact':'wide')}catch{}setCompact(enabled);});
 tools.append(toggle);
 setCompact(compact());
 const info=document.createElement('span');info.className='piga-label';info.textContent='Technische Evaluation · keine klinische Freigabe';tools.append(info);
 const safe=document.createElement('span');safe.className='piga-safety';safe.innerHTML='<span class="piga-safety-dot"></span> PIGA GATE 1 / GATE 2';tools.append(safe);rail.append(tools);
 const bottom=document.createElement('nav');bottom.className='piga-bottom';bottom.setAttribute('aria-label','Mobile Hauptnavigation');
 [paths.find(x=>x.id==='dashboard'),paths.find(x=>x.id==='praxis'),paths.find(x=>x.id==='studio'),paths.find(x=>x.id==='devices')].forEach(p=>bottom.append(a(p,'piga-bottom-link')));
 const more=document.createElement('button');more.type='button';more.setAttribute('aria-label','Weitere Bereiche suchen');more.innerHTML=svg('search')+'<span>Mehr</span>';bottom.append(more);
 const overlay=document.createElement('div');overlay.className='piga-command';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Bereiche und Funktionen suchen');
 const panel=document.createElement('div');panel.className='piga-command-panel';
 const top=document.createElement('div');top.className='piga-command-head';top.insertAdjacentHTML('beforeend',svg('search'));const search=document.createElement('input');search.type='search';search.placeholder='Funktion suchen, z. B. Druck, Kosten, STL …';search.setAttribute('aria-label','Funktion suchen');top.append(search);const close=document.createElement('button');close.type='button';close.className='piga-command-close';close.textContent='Schließen';top.append(close);panel.append(top);
 const results=document.createElement('div');results.className='piga-results';panel.append(results);
 const foot=document.createElement('div');foot.className='piga-command-footer';foot.textContent='Nur freigegebene Module benutzen · keine echten Patientendaten';panel.append(foot);overlay.append(panel);
 const keywords={devicehub:'lokale gerätedatenbank worker backup verschlüsselt smartphone tablet desktop ohne supabase sync sicherung',cases:'fälle kalender termine aufgaben lokal',dashboard:'start dashboard tools checkliste modell datei hash navigation',praxis:'mitarbeiter personal arbeitsauftrag kalender zeiten kosten organisation',studio:'stl import modell volumen geometrie 3d',workflow:'user route ergebnis weg phasen',printer:'octoprint gerät slicer druck',team:'personal mitarbeiter steuerberater dienstplan hygiene handbuch abwesenheit arbeitszeit urlaub krankmeldung lohn',quality:'evidenz audit export hash gates qualität',report:'pdf druckfertig dokument pass prüfakte piga a7sem reverse audit',inventory:'material inventur bestand lager bestellen kalkulation nachbestellen',devices:'wlan wifi bluetooth usb scanner verbinden geraet drucker scan'};
 function render(){results.textContent='';const q=search.value.trim().toLocaleLowerCase('de-DE');const found=paths.filter(p=>(p.label+' '+p.desc+' '+keywords[p.id]).toLocaleLowerCase('de-DE').includes(q));
  if(!found.length){const empty=document.createElement('p');empty.textContent='Keine passende Funktion gefunden.';empty.style.padding='15px';results.append(empty);return;}
  found.forEach(p=>{const item=document.createElement('a');item.href=p.href;const b=document.createElement('b');b.textContent=p.label;const sm=document.createElement('small');sm.textContent=p.desc;item.append(b,sm);results.append(item);});}
 let lastFocus=null;
 function open(){lastFocus=document.activeElement;overlay.hidden=false;search.value='';render();search.focus();}
 function dismiss(){overlay.hidden=true;if(lastFocus?.focus)lastFocus.focus();}
 trigger.addEventListener('click',open);more.addEventListener('click',open);close.addEventListener('click',dismiss);search.addEventListener('input',render);
 overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss();});
 document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();overlay.hidden?open():dismiss();}
  if(e.key==='Escape'&&!overlay.hidden){e.preventDefault();dismiss();}
  if(e.key==='Enter'&&document.activeElement===search){const first=results.querySelector('a');if(first)location.href=first.href;}
  if(e.key==='Tab'&&!overlay.hidden){
    const focusable=[...overlay.querySelectorAll('input,button,a[href]')].filter(x=>x.getClientRects().length);
    if(focusable.length){const first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  }
 });
 document.body.classList.add('piga-has-nav');document.body.prepend(rail);document.body.append(bottom,overlay);
 const update=()=>{if(filename!=='studio.html'&&filename!=='index.html')return;let next='studio';if(location.hash==='#printer')next='printer';if(location.hash==='#evidence'||location.hash==='#governance')next='quality';[...rail.querySelectorAll('.piga-links a'),...bottom.querySelectorAll('a')].forEach(el=>{const dest=paths.find(p=>p.href===el.getAttribute('href'));if(dest?.id===next)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});};
 window.addEventListener('hashchange',update);update();
 if(filename==='studio.html'||filename==='index.html'){
   // Keep the global active nav synchronized with in-page studio tabs.
   document.querySelectorAll('.tabs button[data-tab]').forEach(button=>button.addEventListener('click',()=>{
     const tab=button.dataset.tab;
     const current=tab==='printer'?'printer':(['evidence','governance','loop'].includes(tab)?'quality':'studio');
     [...rail.querySelectorAll('.piga-links a'),...bottom.querySelectorAll('a')].forEach(link=>{
       const dest=paths.find(p=>p.href===link.getAttribute('href'));
       if(dest?.id===current)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
     });
   }));
 }

 // Offer local encrypted transfer without blocking app workflows or storing credentials.
 const offer=document.createElement('script');offer.src='./transfer-offer.js';offer.defer=true;document.head.append(offer);

 // All Ortho pages use the same worker; avoid the separate direct-worker taking over this scope.
 if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});}
})();
