'use strict';
(()=>{
 const $=id=>document.getElementById(id),get=id=>$(id).value;
 const $$=o=>JSON.stringify(o,null,2);
 const examples={
 balanced:{upper:[8.5,6.5,7,7,6.5,8.5],lower:[5.5,6.1,5.4,5.4,6.1,5.5]},
 lower:{upper:[8.5,6.5,7,7,6.5,8.5],lower:[6.2,6.6,5.7,5.7,6.6,6.2]},
 upper:{upper:[9,7.4,7.3,7.3,7.4,9],lower:[5.5,6.1,5.4,5.4,6.1,5.5]}
 };
 let active=null,worker=null,current=null,currentPayload=null;
 function feedback(message,error=false){$('feedback').textContent=message;$('feedback').style.color=error?'#a73327':'#1e635d'}
 function array(s){const a=s.split(',').map(v=>Number(v.trim()));if(a.length!==6||!a.every(Number.isFinite))throw Error('Bitte genau sechs Zahlen pro Kiefer eingeben.');return a}
 $('fixture').onchange=()=>{const f=examples[get('fixture')];if(f){$('upper').value=f.upper.join(',');$('lower').value=f.lower.join(',');}};
 function payload(){const kind=get('fixture');const p={schema:'piga-ortho-offline.v1',units:'mm',calibrated:$('calibrated').checked,landmarks_verified:$('landmarks').checked,
 source:kind==='custom'?'clinician_measured':'synthetic',upper_anterior:array(get('upper')),lower_anterior:array(get('lower'))};
 const al=get('archLength'),rw=get('requiredWidth');if(al||rw){if(!al||!rw)throw Error('Bogenlänge und erforderliche Breite nur zusammen eingeben.');p.arch_length_mm=Number(al);p.required_tooth_width_mm=Number(rw)}
 return p;}
 function terminate(){if(worker){worker.terminate();worker=null;}active=null;}
 $('stop').onclick=()=>{terminate();feedback('Finite Worker gestoppt. Kein klinischer oder externer Effekt.');$('run').disabled=false;};
 $('run').onclick=()=>{
  terminate();current=null;$('export').disabled=true;$('save').disabled=true;
  let input;try{input=payload()}catch(e){return feedback(e.message,true)}
  $('run').disabled=true;feedback('Deterministische Berechnung lokal gestartet …');
  if(typeof Worker==='undefined'){feedback('BLOCK: Web-Worker nicht unterstützt. Keine Berechnung ausgeführt.',true);$('run').disabled=false;return}
  const id=crypto.randomUUID();active=id;worker=new Worker('./ortho-deterministic-worker.js');
  const timer=setTimeout(()=>{if(active===id){terminate();$('run').disabled=false;feedback('PIGA DELAY: Lokaler Worker überschritt 3 Sekunden und wurde gestoppt.',true)}},3000);
  worker.onmessage=event=>{
   if(active!==id||event.data?.id!==id)return;
   clearTimeout(timer);terminate();$('run').disabled=false;
   if(!event.data.ok){feedback('PIGA BLOCK: '+event.data.error,true);return}
   current=event.data.result;currentPayload=input;
   $('resultState').textContent='TECHNISCHE BEFUNDHYPOTHESE · NICHT KLINISCH VALIDIERT';
   $('ratio').textContent=current.ratio_percent.toLocaleString('de-DE')+' %';
   $('difference').textContent=current.lower_width_excess_against_reference_mm.toLocaleString('de-DE')+' mm';
   $('trace').textContent=$$({metrics:{upper_sum_mm:current.upper_sum_mm,lower_sum_mm:current.lower_sum_mm,
     formula:'100 × Unterkieferzahnbreiten-Summe / Oberkieferzahnbreiten-Summe',
     ratio:current.ratio_percent,reference:current.reference_percent},
     inference:current.possible_tooth_size_relationship,uncertainty:current.warnings,
     piga:current.piga,a7sem:current.a7sem,a7sem_reverse:current.a7sem_reverse});
   $('export').disabled=false;$('save').disabled=false;
   feedback('Rechenweg lokal nachgewiesen. Keine klinische Freigabe, keine automatische Therapie.');
  };
  worker.onerror=()=>{clearTimeout(timer);terminate();$('run').disabled=false;feedback('PIGA BLOCK: Worker-Datei konnte nicht ausgeführt werden.',true)};
 };
 function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 $('export').onclick=()=>{if(current)download(new Blob([$$({input:currentPayload,result:current})],{type:'application/json'}),'PIGA_ORTHO_OFFLINE_EVIDENCE.json')};
 function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('PIGA_ORTHO_LOCAL_V1',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('records'))r.result.createObjectStore('records',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('IndexedDB nicht verfügbar'))})}
 const tReq=(db,mode,callback)=>new Promise((resolve,reject)=>{const tx=db.transaction('records',mode),s=tx.objectStore('records');let r;try{r=callback(s)}catch(e){reject(e);return}tx.oncomplete=()=>resolve(r?.result);tx.onerror=()=>reject(Error('Lokale Datenbankoperation fehlgeschlagen'))});
 const u8=v=>new Uint8Array(v),bytes=n=>crypto.getRandomValues(new Uint8Array(n));
 async function key(pass,salt){if(pass.length<12)throw Error('Passphrase muss mindestens 12 Zeichen lang sein.');const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:210000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
 const encode=a=>Array.from(a),decode=a=>u8(a);
 $('save').onclick=async()=>{try{
  if(!current)throw Error('Keine Berechnung vorhanden');
  const pass=get('passphrase'),salt=bytes(16),iv=bytes(12),k=await key(pass,salt);
  const record={input:currentPayload,result:current};
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},k,new TextEncoder().encode($$(record)));
  const db=await openDB(),id=crypto.randomUUID();
  await tReq(db,'readwrite',s=>s.put({id,created:new Date().toISOString(),salt:encode(salt),iv:encode(iv),ciphertext:encode(u8(ciphertext))}));
  db.close();$('vaultFeedback').textContent='AES-GCM-verschlüsselter Beleg lokal gespeichert. Keine Cloud-Synchronisation.';
 }catch(e){$('vaultFeedback').textContent=e.message}};
 $('load').onclick=async()=>{const list=$('journal');list.replaceChildren();try{
  const pass=get('passphrase');if(pass.length<12)throw Error('Bitte gültige Passphrase eingeben.');
  const db=await openDB(),entries=await tReq(db,'readonly',s=>s.getAll());db.close();
  for(const e of entries||[]){
   const k=await key(pass,decode(e.salt));let plain;
   try{plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(e.iv)},k,decode(e.ciphertext))}
   catch{throw Error('Passphrase falsch oder Beleg beschädigt.');}
   const result=JSON.parse(new TextDecoder().decode(plain)).result;
   const div=document.createElement('article');div.textContent=e.created+' · Verhältnis '+result.ratio_percent+' % · '+result.status;list.append(div);
  }
  $('vaultFeedback').textContent=(entries?.length||0)+' verschlüsselte lokale Belege geprüft.';
 }catch(e){$('vaultFeedback').textContent=e.message}};
 $('wipe').onclick=async()=>{if(!confirm('Alle lokalen verschlüsselten Rechenbelege dieses Geräts unwiderruflich löschen?'))return;
 try{const db=await openDB();await tReq(db,'readwrite',s=>s.clear());db.close();$('journal').replaceChildren();$('vaultFeedback').textContent='Lokale Berechnungsbelege gelöscht.'}catch(e){$('vaultFeedback').textContent=e.message}};
})();
