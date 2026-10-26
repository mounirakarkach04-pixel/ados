'use strict';
/* Explicitly local technical FAQ. Not generative AI, no patient information, no network traffic. */
(()=>{
 const form=document.getElementById('technicalHelpForm'),input=document.getElementById('technicalQuestion'),
 feed=document.getElementById('technicalHelpFeed'),clear=document.getElementById('clearTechnicalHelp');
 if(!form||!input||!feed)return;
 const themes=[
  {words:['stl','3d','model','geometrie','scan','datei'],title:'3D-Datei und Geometrie',
   answer:'Öffne „3D-Studio“ oder „Geräte“. Lade eine lokale STL-Testdatei. Prüfe Format, Einheiten, geometrische Grenzen und SHA-256 im Viewer. Erst nach technischer Prüfung darf ein separater PIGA-Gate-2-Prozess eine reale Geräteaktion zulassen.',href:'./studio.html#studio'},
  {words:['wlan','wifi','wi-fi','netz','bluetooth','drucker','usb','verbindung'],title:'Geräte verbinden',
   answer:'Unter „Geräte“ kannst du den Online-Status neu prüfen und eine technische Test-STL erzeugen. System-WLAN und Bluetooth-Kopplung werden über die Geräteeinstellungen vorgenommen. Web Bluetooth ist nur in unterstützten Browsern mit ausdrücklicher Geräteauswahl möglich; damit wird kein Druck ausgeführt.',href:'./devices.html'},
  {words:['material','bestand','lager','resin','inventur','bestellung','nachbestellen'],title:'Material und Inventur',
   answer:'Unter „Inventur & Material“ lassen sich lokale Testmaterialien anlegen, Bestände buchen, Mindestmengen einstellen, der Verbrauch simulieren und CSV-Nachbestellvorschläge exportieren. Die App bestellt nicht selbstständig.',href:'./inventory.html'},
  {words:['team','mitarbeiter','personal','dienstplan','lohn','zeit','urlaub'],title:'Team und Zeiterfassung',
   answer:'Unter „Personal & Steuer“ funktionieren lokale Testprofile, Zeiterfassung, Dienstplan, Abwesenheiten und Lohnprüfentwürfe. Es ist keine rechtsverbindliche Lohnabrechnung und kein gesicherter Personalaktenbereich.',href:'./team.html'},
  {words:['kalender','termin','fälle','fall','aufgabe','patient'],title:'Fälle, Aufgaben und Kalender',
   answer:'Nutze die lokale Organisationsansicht für synthetische Testfallkennungen, Aufgaben und Termine. Die Daten sind browser-/gerätegebunden und dürfen keine echten Patientenangaben enthalten.',href:'./direct.html#calendar'},
  {words:['worker','backup','sicherung','übertragen','sync','datenbank','smartphone','tablet'],title:'Endgerät als Datenbank',
   answer:'Der Bereich „Geräte-Datenbank“ zeigt lokale IndexedDB-Daten, begrenzte technische Worker und AES-GCM-verschlüsselte Export-/Importdateien. Zwischen Geräten erfolgt derzeit kein automatischer Echtzeitabgleich.',href:'./device-hub.html'},
  {words:['piga','gate','audit','evidenz','nachweis','glas','glassbox','freigabe'],title:'PIGA-Gates und Evidenz',
   answer:'Gate 1 regelt, ob eine Inferenz zulässig ist. Gate 2 regelt gesondert, ob eine reale externe Aktion zugelassen ist. Im Glassbox-Studio werden technische Prüfungen protokolliert; ein grüner UI-Status ist keine klinische Freigabe.',href:'./studio.html#evidence'},
  {words:['report','pdf','bericht','dokument','export','hash'],title:'Prüfakte und Exporte',
   answer:'Unter „Prüfakte/PDF“ kannst du einen synthetischen Nachweis erzeugen, lokale Audit-JSON-Dateien prüfen, SHA-256-Vergleiche ausführen und ein druckbares Dokument erstellen.',href:'./report.html'}
 ];
 const sensitive=/diagnos|therap|behandl|medikament|dosier|patientendat|kig|rezept|krankheit/i;
 const add=(who,message,href)=>{
   const div=document.createElement('div');div.className='ortho-help-message '+(who==='Du'?'user':'agent');
   const label=document.createElement('b');label.textContent=who;
   const paragraph=document.createElement('p');paragraph.textContent=message;div.append(label,paragraph);
   if(href){const a=document.createElement('a');a.href=href;a.textContent='Passenden Arbeitsbereich öffnen →';div.append(a)}
   feed.append(div);feed.scrollTop=feed.scrollHeight;
 };
 const ask=text=>{
   const q=String(text||'').trim().slice(0,240);if(!q)return;
   add('Du',q);
   if(sensitive.test(q)){
     add('PIGA GUIDE','Hier kann ich keine Diagnose, Behandlungsempfehlung, KIG-Einstufung oder Medikation erstellen. Die verantwortliche Ärztin bzw. der verantwortliche Arzt muss die Untersuchung und Entscheidung persönlich vornehmen. Du kannst aber einen technisch-organisatorischen Prüfentwurf erstellen.','./workflow.html');return;
   }
   const low=q.toLocaleLowerCase('de-DE'),match=themes.map(t=>({...t,score:t.words.reduce((v,w)=>v+(low.includes(w)?1:0),0)})).sort((a,b)=>b.score-a.score)[0];
   if(match.score>0)add('PIGA GUIDE',match.answer,match.href);
   else add('PIGA GUIDE','Ich biete hier eine lokale Stichwort-Hilfe, kein generatives Sprachmodell. Frage z. B. nach STL, WLAN, Inventur, Kalender, Team, Worker oder Glassbox. Für einen vollständigen Prüfdurchlauf kannst du direkt den 5-Schritte-Assistenten darunter benutzen.','./workflow.html');
 };
 form.addEventListener('submit',e=>{e.preventDefault();ask(input.value);input.value='';input.focus()});
 document.querySelectorAll('[data-help-prompt]').forEach(b=>b.addEventListener('click',()=>ask(b.dataset.helpPrompt)));
 clear.addEventListener('click',()=>{feed.replaceChildren();add('PIGA GUIDE','Lokale technische Hilfe bereit. Keine Übertragung an ein KI-Modell oder eine Cloud.')});
 add('PIGA GUIDE','Willkommen! Suche technische Anleitungen zu STL, WLAN, Kalender, Material, Personal, Worker und PIGA. Medizinische Entscheidungen bleiben gesperrt.');
})();
