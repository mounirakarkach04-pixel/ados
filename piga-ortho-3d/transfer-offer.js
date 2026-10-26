'use strict';
/* Non-blocking local backup/import offer. Never automatically exports plaintext,
   stores a passphrase, or transfers data without explicit user gesture. */
(()=>{
 if(location.pathname.endsWith('/device-hub.html'))return;
 const META='piga-ortho-transfer-metadata-v1',PROMPT='piga-ortho-last-transfer-prompt-v1';
 const DAY=86400000;
 const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
 const m=read(META)||{};
 const local=(read('piga-ortho-v12-local')||{}),direct=(read('piga-ortho-direct-v1')||{});
 const hasData=[...Object.values(local),...Object.values(direct)].some(v=>Array.isArray(v)&&v.length>0);
 const changed=Date.parse(m.lastChange||'')||0;
 const saved=Math.max(Date.parse(m.lastExport||'')||0,Date.parse(m.lastImport||'')||0);
 const now=Date.now();
 const fresh=changed>saved+1000;
 let kind=!hasData?'receive':fresh?'changed':saved===0?'backup':now-saved>7*DAY?'backup':null;
 if(!kind)return;
 let was=0;try{was=Number(localStorage.getItem(PROMPT)||0)}catch{}
 if(was&&now-was<DAY)return;
 try{if(sessionStorage.getItem('piga-ortho-transfer-shown'))return}catch{}
 const host=document.createElement('aside');
 host.className='piga-transfer-invite';host.setAttribute('role','status');host.setAttribute('aria-label','Geräteübernahme und Datensicherung');
 const close=document.createElement('button');close.type='button';close.className='piga-transfer-close';close.setAttribute('aria-label','Hinweis schließen');close.textContent='×';
 const kicker=document.createElement('small');kicker.textContent='PIGA ORTHO · DEVICE FIRST';
 const heading=document.createElement('strong');heading.textContent=kind==='receive'?'Daten von einem anderen Gerät übernehmen?':
 kind==='changed'?'Deine neuen Daten verschlüsselt sichern?':'Verschlüsselte Gerätesicherung einrichten?';
 const body=document.createElement('p');body.textContent=kind==='receive'?
 'Du kannst deine bestehende verschlüsselte Sicherung vom Smartphone, Tablet oder PC importieren.':
 'Übertrage den aktuellen Testdatenstand sicher auf ein weiteres Gerät – ohne Supabase.';
 const open=document.createElement('a');open.href='./device-hub.html#transfer';open.textContent=kind==='receive'?'Import & Übernahme öffnen':'Sicherung & Übertragung öffnen';
 const later=document.createElement('button');later.type='button';later.className='piga-transfer-later';later.textContent='Später';
 const note=document.createElement('small');note.textContent='Transfer nur nach deiner Bestätigung · kein automatischer Cloud-Upload';
 const buttons=document.createElement('div');buttons.className='piga-transfer-buttons';buttons.append(open,later);
 host.append(close,kicker,heading,body,buttons,note);
 const hide=()=>{host.remove();try{localStorage.setItem(PROMPT,String(Date.now()));sessionStorage.setItem('piga-ortho-transfer-shown','1')}catch{}};
 close.addEventListener('click',hide);later.addEventListener('click',hide);
 open.addEventListener('click',()=>{try{localStorage.setItem(PROMPT,String(Date.now()));sessionStorage.setItem('piga-ortho-transfer-shown','1')}catch{}});
 document.body.append(host);
})();
