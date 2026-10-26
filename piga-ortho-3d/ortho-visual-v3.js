'use strict';
/* Presentation layer only. Every existing PIGA module and decision gate remains unchanged. */
(()=>{
 const page=(location.pathname.split('/').pop()||'dashboard.html').replace('.html','');
 if(['sales','index','auth'].includes(page))return;
 const pages={
 procurement:{title:'Materialbedarf · Einkaufsvorschläge',desc:'Erfassungsfreie Vorschläge aus der lokalen Inventur, mit CSV und PIGA Freigabeentwurf.',image:'ortho-inventory.svg',num:'05',label:'PROCUREMENT'},
 'kfo-atlas':{title:'Orthodontic Knowledge Atlas',desc:'KFO-Wissens- und Apparaturübersicht mit Leitlinienverweisen.',image:'ortho-hero.svg',num:'06',label:'FACHTHEMEN'},
 supply:{title:'Bestellvorbereitung KFOshop24',desc:'Prüfbare Mindestbestände und Warenkorbliste mit menschlicher Freigabe.',image:'ortho-inventory.svg',num:'05',label:'BESTELLUNG'},
 setup:{title:'Einrichtung Schritt für Schritt',desc:'Lokalen Speicher, WLAN, Worker und optionale Sprache in sechs Schritten prüfen.',image:'ortho-dashboard.svg',num:'00',label:'START'},
 diagnostics:{title:'Systemtest & Funktionsstatus',desc:'Echte Funktionstests für IndexedDB, Kryptografie, Worker, STL, Offline und Geräteverfügbarkeit.',image:'ortho-dashboard.svg',num:'00',label:'DIAGNOSTICS'},
 handoff:{title:'Praxis-Labor-Übergabe',desc:'Eine Auftragsreferenz für STL-Grundprüfung, Materialkontrolle, Aufgaben, Prüftermine und technische Evidenz.',image:'ortho-hero.svg',num:'02',label:'CASE TO LAB'},
 operations:{title:'Arbeitscockpit & Prioritäten',desc:'Alle lokalen Testfälle, Aufgaben, Termine und Materialwarnungen in einer gemeinsamen Arbeitsansicht.',image:'ortho-dashboard.svg',num:'01',label:'OPERATIONS'},
 dashboard:{title:'Dein digitaler KFO-Arbeitsplatz',desc:'Übersicht, Prüfschritte und alle technischen Werkzeuge auf einem Bildschirm.',image:'ortho-dashboard.svg',num:'01',label:'DASHBOARD'},
 imaging:{title:'DICOM / CBCT Imaging Research',desc:'Schnittbilder, technische Masken, Geometrieprobe und Freigabe-Zyklus mit Gate-Schutz.',image:'ortho-hero.svg',num:'03',label:'IMAGING'},
 studio:{title:'3D Studio & Model Viewer',desc:'Große Arbeitsfläche für STL-Geometrie, Ansichten und überprüfbare technische Prüfungen.',image:'ortho-hero.svg',num:'02',label:'3D / LAB'},
 praxis:{title:'Praxis & Operations',desc:'Auftragszeiten, technische Kosten und Arbeitsabläufe lokal organisieren.',image:'ortho-calendar.svg',num:'03',label:'PRAXIS'},
 team:{title:'Team & Payroll',desc:'Lokale Personal-Testprofile, Dienstplan und prüfbare Arbeitszeitentwürfe.',image:'ortho-team.svg',num:'04',label:'PERSONAL'},
 inventory:{title:'Inventory & Material Planning',desc:'Materialien, Bestandsbewegungen und Nachbestellbedarf zentral im Blick.',image:'ortho-inventory.svg',num:'05',label:'INVENTUR'},
 assist:{title:'AI Assist & Guidance',desc:'Geführte fachliche Prüfschritte mit klarer Grenze zwischen Hinweis und medizinischer Entscheidung.',image:'ortho-ai.svg',num:'06',label:'ASSISTENZ'},
 workflow:{title:'Workflow Navigator',desc:'Zwölf Prozessphasen. Zulassung, Nachweise und Ergebnisroute nachvollziehen.',image:'ortho-dashboard.svg',num:'07',label:'WORKFLOW'},
 devices:{title:'Devices & Connectivity',desc:'WLAN-/Bluetooth-Status, lokale Scanner-Tests und technische Geräteprüfung.',image:'ortho-hero.svg',num:'08',label:'GERÄTE'},
 report:{title:'Reports & Glassbox Evidence',desc:'Technische Prüfakte, lokale Hashwerte und dokumentierte Grenzen.',image:'ortho-dashboard.svg',num:'09',label:'NACHWEISE'},
 direct:{title:'Fälle, Termine & Aufgaben',desc:'Lokale Testfallverwaltung, Kalender, Aufgaben und Exporte – ohne Anmeldung.',image:'ortho-calendar.svg',num:'10',label:'ORGANISATION'},
 'device-hub':{title:'Local Device Database',desc:'Dein Endgerät als Datenspeicher: verschlüsselte Sicherung und begrenzte Worker.',image:'ortho-inventory.svg',num:'11',label:'DEVICE FIRST'}
 };
 function installFocus(target){
  const KEY='piga-ortho-focus-mode-v1';
  const toggle=document.createElement('button');toggle.type='button';toggle.className='ortho-focus-toggle';
  const exit=document.createElement('button');exit.type='button';exit.className='ortho-focus-exit';
  exit.textContent='Fokusmodus verlassen';exit.setAttribute('aria-label','Vollständige Navigation wieder einblenden');
  const set=on=>{
   document.body.classList.toggle('ortho-focus-mode',on);
   toggle.textContent=on?'Fokusmodus verlassen':'Arbeitsfläche maximieren';
   toggle.setAttribute('aria-pressed',String(on));exit.hidden=!on;
   try{localStorage.setItem(KEY,on?'1':'0')}catch{}
  };
  toggle.addEventListener('click',()=>set(!document.body.classList.contains('ortho-focus-mode')));
  exit.addEventListener('click',()=>set(false));
  const tools=target.querySelector('.ortho-v3-mast-actions')||target.querySelector('.hero-actions')||target;
  tools.append(toggle);document.body.append(exit);
  let on=false;try{on=localStorage.getItem(KEY)==='1'}catch{}
  set(on);
 }
 const config=pages[page],main=document.querySelector('main');
 if(!config||!main)return;
 if(['piga-control','setup','procurement'].includes(page)){
   // These pages already carry large premium hero layouts; avoid duplicate mastheads.
   document.body.classList.add('ortho-visual-v3','ortho-page-'+page);
   installFocus(main);return;
 }
  if(page==='dashboard'){
   // Dashboard already has the full brand and marketing-style main hero.
   document.body.classList.add('ortho-visual-v3');
   installFocus(main);
   return;
 }
 const head=document.createElement('div');head.className='ortho-v3-masthead';
 const lead=document.createElement('div');lead.className='ortho-v3-mast-copy';
 const kicker=document.createElement('div');kicker.className='ortho-v3-mast-kicker';
 const no=document.createElement('b');no.textContent=config.num;
 const label=document.createElement('span');label.textContent='PIGA ORTHO 3D  /  '+config.label;
 kicker.append(no,label);
 const title=document.createElement('h1');title.className='ortho-v3-mast-title';title.textContent=config.title;
 const subtitle=document.createElement('p');subtitle.textContent=config.desc;
 const actions=document.createElement('div');actions.className='ortho-v3-mast-actions';
 const routes=[['3D-Studio','./studio.html#studio'],['Kalender','./direct.html#calendar'],['Inventur','./inventory.html'],['Geräte','./devices.html'],['Prüfakte','./report.html']];
 for(const [label,url] of routes){
   if(url.split('#')[0]===page+'.html')continue;
   const a=document.createElement('a');a.href=url;a.textContent=label;actions.append(a);
 }
 lead.append(kicker,title,subtitle,actions);
 const art=document.createElement('div');art.className='ortho-v3-mast-art';
 const picture=document.createElement('img');picture.src='./visuals/'+config.image;
 picture.alt='Illustratives Motiv für '+config.title+' – keine echten Patientendaten';
 picture.width=650;picture.height=320;picture.loading='eager';picture.decoding='async';
 art.append(picture);
 head.append(lead,art);main.prepend(head);
 document.body.classList.add('ortho-visual-v3','ortho-page-'+page);
 installFocus(main);
})();
