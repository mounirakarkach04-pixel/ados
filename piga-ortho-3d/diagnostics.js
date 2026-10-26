'use strict';
/* Independent, reproducible, no-network functional self-test. No clinical or hardware action. */
(()=>{
 const $=id=>document.getElementById(id);
 const tests=[],time=()=>new Date().toISOString();
 let results=[],running=false;
 function push(name,description,run){tests.push({name,description,run})}
 const status=(ok,detail)=>({status:ok?'PASS':'UNAVAILABLE',detail});
 const localDB=()=>new Promise((resolve,reject)=>{
  if(!window.indexedDB)return resolve(status(false,'IndexedDB wird vom Browser nicht bereitgestellt.'));
  const name='PIGA_ORTHO_DIAGNOSTICS_EPHEMERAL',open=indexedDB.open(name,1);
  open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains('probe'))open.result.createObjectStore('probe')};
  open.onerror=()=>reject(open.error||Error('Lokale DB konnte nicht geöffnet werden.'));
  open.onsuccess=()=>{
   const db=open.result,tx=db.transaction('probe','readwrite');
   tx.objectStore('probe').put('TEST_OK','device');let value;
   tx.oncomplete=()=>{
    const read=db.transaction('probe','readonly'),req=read.objectStore('probe').get('device');
    req.onsuccess=()=>value=req.result;
    read.oncomplete=()=>{db.close();resolve(status(value==='TEST_OK','Testeintrag geschrieben und gelesen; getrennte Diagnose-Datenbank.'))};
    read.onerror=()=>{db.close();reject(read.error||Error('Lokales Lesen fehlgeschlagen.'))};
   };
   tx.onerror=()=>{db.close();reject(tx.error||Error('Lokales Schreiben fehlgeschlagen.'))};
  };
 });
 const worker=()=>new Promise(resolve=>{
  if(typeof Worker==='undefined')return resolve(status(false,'Browser unterstützt hier keine Web Worker.'));
  let w,timer;try{
   w=new Worker('./diagnostic-worker.js');
   timer=setTimeout(()=>{w.terminate();resolve(status(false,'Der isolierte Worker hat nicht geantwortet.'))},6000);
   w.onmessage=e=>{clearTimeout(timer);w.terminate();resolve(status(e.data?.status==='PASS',
    e.data?.status==='PASS'?'Isolierter Geräte-Worker hat SHA-256 berechnet.':e.data?.error||'Worker antwortet nicht korrekt.'))};
   w.onerror=()=>{clearTimeout(timer);w.terminate();resolve(status(false,'Worker konnte nicht gestartet werden.'))};
   w.postMessage({kind:'SELF_TEST'});
  }catch(e){clearTimeout(timer);w?.terminate();resolve(status(false,String(e.message)))}
 });
 push('Sicherer Ausführungskontext','HTTPS-Voraussetzung für kryptografische Browserfunktionen.',async()=>status(isSecureContext,'HTTPS bzw. sicherer lokaler Ursprung: '+(isSecureContext?'erkannt':'nicht erkannt')));
 push('Lokale Gerätedatenbank','Eigenständiger IndexedDB-Schreib- und Lesetest.',localDB);
 push('SHA-256 und AES-GCM','Verschlüsselungsfunktionen unabhängig prüfen.',async()=>{
  if(!crypto?.subtle)return status(false,'WebCrypto nicht unterstützt.');
  const plain=new TextEncoder().encode('PIGA ORTHO LOCAL TEST'),key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  const iv=crypto.getRandomValues(new Uint8Array(12)),enc=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,plain);
  const dec=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,enc);
  const h=await crypto.subtle.digest('SHA-256',plain);
  return status(new TextDecoder().decode(dec)==='PIGA ORTHO LOCAL TEST'&&h.byteLength===32,'256-Bit-Verschlüsselung, Entschlüsselung und Datei-Hash erfolgreich.');
 });
 push('Lokale Worker-Ausführung','Separater Web Worker führt keine Netzwerkaktion aus.',worker);
 push('STL-Dateiverarbeitung','Datei- und Binärschnittstellen für STL-Import.',async()=>status(!!window.File&&!!window.FileReader&&!!window.DataView&&!!window.TextDecoder,'Browser-APIs für lokalen Dateizugriff und Koordinatenanalyse.'));
 push('Lokale Datei-Downloads','Blob und temporäre Download-URLs verfügbar.',async()=>status(typeof Blob==='function'&&typeof URL.createObjectURL==='function','JSON-, STL- und Prüfberichtsexporte können lokal erzeugt werden.'));
 push('Geräteübergreifende Sicherung','Dateien können verschlüsselt gesichert werden; OS Share Sheet ist optional.',async()=>{
  const share=!!navigator.share&&!!navigator.canShare;
  return status(!!crypto?.subtle&&typeof Blob==='function',share?'Verschlüsselung und Teilen-Systemfunktion verfügbar.':'Verschlüsselter Export verfügbar; Datei-Teilen über Betriebssystem hier nicht angeboten.');
 });
 push('Offline-Web-App','Service Worker für offline zuvor gespeicherte Programmdateien.',async()=>{
  if(!('serviceWorker' in navigator))return status(false,'Browser unterstützt keine Service Worker.');
  const registration=await navigator.serviceWorker.getRegistration('./');
  return status(!!registration,'Service Worker: '+(registration?'registriert':'nicht registriert – App erneut öffnen oder Online-Verbindung prüfen'));
 });
 push('Lokaler Mehrfenster-Abgleich','Übermittlungen zwischen zwei Browser-Tabs.',async()=>status(typeof BroadcastChannel==='function',typeof BroadcastChannel==='function'?'BroadcastChannel verfügbar; gleiche Geräte-Datenbank pro Browserprofil.':'Kein BroadcastChannel; andere Tabs gegebenenfalls neu laden.'));
 push('Geräte-Systembrücke','WLAN-/Bluetooth-Snapshot bei nativer Android-Brücke.',async()=>{
  const b=window.PigaNative;
  if(typeof b?.deviceSnapshot!=='function')return status(false,'Webversion: kein direkter WLAN-/Bluetooth-Systemzugriff; Geräte-Center bietet Browser-Alternativen.');
  try{const data=JSON.parse(b.deviceSnapshot());return status(!!data,'Native Android-Brücke meldet Geräte-Snapshot.')}catch{return status(false,'Native Systembrücke nicht lesbar.')}
 });
 push('Web Bluetooth','Berechtigungsgesteuerte Bluetooth-Geräteauswahl.',async()=>status(!!navigator.bluetooth?.requestDevice,navigator.bluetooth?.requestDevice?'Web Bluetooth wird angeboten; keine automatische Verbindung.':'Nicht unterstützt. Stattdessen native Android-Kopplung oder Systemeinstellungen nutzen.'));
 push('Physische Druckfreigabe','Geräteausführung bleibt durch PIGA Gate 2 gesondert autorisiert.',async()=>({status:'LIMITED',detail:'Kein automatischer Hardware- oder medizinischer Test. Gate 2 bleibt BLOCK bis zur unabhängigen Freigabe.'}));
 function render(){
  $('passed').textContent=results.filter(x=>x.status==='PASS').length;
  $('unavailable').textContent=results.filter(x=>x.status==='UNAVAILABLE').length;
  $('failed').textContent=results.filter(x=>x.status==='FAIL').length;
  const fail=results.some(x=>x.status==='FAIL'),unavailable=results.some(x=>x.status==='UNAVAILABLE');
  $('overall').textContent=fail?'Fehler erkannt':unavailable?'Teilweise verfügbar':'Lokale Tests bestanden';
  const root=$('technicalChecks');root.replaceChildren();
  for(const x of results){
   const item=document.createElement('div');item.className='diag-item';
   const content=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('small'),badge=document.createElement('span');
   title.textContent=x.name;detail.textContent=x.detail;content.append(title,detail);
   badge.className='diag-pill '+(x.status==='PASS'?'pass':x.status==='FAIL'?'fail':'unknown');
   badge.textContent=x.status==='PASS'?'OK':x.status==='FAIL'?'FEHLER':x.status==='LIMITED'?'GATE':'NICHT VERFÜGBAR';
   item.append(content,badge);root.append(item);
  }
 }
 async function run(){
  if(running)return;running=true;$('runDiagnostics').disabled=true;
  $('diagMessage').textContent='Prüfe die Geräteumgebung, ohne Praxisdaten zu verändern …';
  results=[];
  for(const t of tests){
   try{const r=await t.run();results.push({name:t.name,description:t.description,
    status:r.status||'FAIL',detail:String(r.detail||'Keine Rückmeldung').slice(0,240),at:time()})}
   catch(e){results.push({name:t.name,description:t.description,status:'FAIL',detail:String(e.message||e).slice(0,240),at:time()})}
   render();
  }
  running=false;$('runDiagnostics').disabled=false;
  $('diagMessage').textContent='Diagnose beendet: '+results.filter(x=>x.status==='PASS').length+' von '+tests.length+' Prüfpunkten OK. Verfügbarkeitsgrenzen sind keine automatisch behebbaren App-Fehler.';
 }
 $('runDiagnostics').onclick=()=>{void run()};
 $('exportDiagnostics').onclick=()=>{
  if(!results.length){$('diagMessage').textContent='Bitte zuerst die Tests ausführen.';return;}
  const bundle={schema:'piga-ortho-device-diagnostics-v1',generatedAt:time(),origin:location.origin,results,
   clinicalApproved:false,printerAutorun:false,note:'Gerätelokale Selbstauskunft, kein zertifizierter Hardware- oder Sicherheitstest'};
  const url=URL.createObjectURL(new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='PIGA-ORTHO-DEVICE-TEST-'+time().slice(0,10)+'.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
  $('diagMessage').textContent='Gerätetest als JSON heruntergeladen.';
 };
 void run();
})();
