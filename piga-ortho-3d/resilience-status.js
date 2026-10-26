'use strict';
(()=>{
 const el=document.getElementById('resilienceStatus'),button=document.getElementById('resilienceRun');
 if(!el||!button)return;
 const display=()=>{
  const worker=window.PigaOrthoResilience;
  if(!worker){el.textContent='Lokale PIGA-Worker werden vorbereitet. Öffne die App erneut, falls der Status nicht erscheint.';return;}
  const s=worker.status();
  el.textContent='Primärer Speicher: '+(s.storage==='indexeddb'?'lokale IndexedDB bereit':s.storage)+
   ' · Supabase erforderlich: NEIN · Hintergrundmodus: Browser kann pausieren · Letzte lokale Prüfung: '+
   (s.lastRun?new Date(s.lastRun).toLocaleString('de-DE'):'noch nicht bestätigt')+
   ' · Optimierung: prüfbare Vorschläge statt unkontrollierter Änderungen'+
   (s.lastError?' · Hinweis: '+s.lastError:'');
  button.disabled=s.busy;
 };
 document.addEventListener('piga-ortho-resilience-state',display);
 button.addEventListener('click',async()=>{
  const worker=window.PigaOrthoResilience;
  if(!worker){el.textContent='Worker-Initialisierung noch nicht abgeschlossen.';return;}
  el.textContent='Prüfung ist im vorhandenen lokalen Worker eingereiht; kein Cloudaufruf.';
  await worker.runNow();display();
 });
 display();
})();
