'use strict';
/* Presentation layer only. Every existing PIGA module and decision gate remains unchanged. */
(()=>{
 const page=(location.pathname.split('/').pop()||'dashboard.html').replace('.html','');
 if(['sales','index','auth'].includes(page))return;
 const pages={
 dashboard:{title:'Dein digitaler KFO-Arbeitsplatz',desc:'Übersicht, Prüfschritte und alle technischen Werkzeuge auf einem Bildschirm.',image:'ortho-dashboard.svg',num:'01',label:'DASHBOARD'},
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
 const config=pages[page],main=document.querySelector('main');
 if(!config||!main)return;
 if(page==='dashboard'){
   // Dashboard already has the full brand and marketing-style main hero.
   document.body.classList.add('ortho-visual-v3');
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
})();
