'use strict';(()=>{
 const $=id=>document.getElementById(id);
 const input=$('quickStl'),result=$('stlResult');
 async function personalize(){
  const el=$('personalGreeting');el.textContent='Guten Tag.';
  let info=null;try{info=JSON.parse(sessionStorage.getItem('piga-ortho-auth-ephemeral')||'null');}catch{}
  if(!info?.token||Date.now()>=Number(info.expiresAt)){sessionStorage.removeItem('piga-ortho-auth-ephemeral');return;}
  const header={apikey:'sb_publishable_GWNQHoz-ML6wphVEyXz0pA_TLuNDzDQ',Authorization:'Bearer '+info.token};
  try{
    const auth=await fetch('https://sanrkcovmkkhgdqydxfk.supabase.co/auth/v1/user',{headers:header,cache:'no-store',credentials:'omit'});
    if(!auth.ok)throw Error('Invalid authenticated session');
    const identity=await auth.json();
    if(!identity?.id||!identity.email_confirmed_at)throw Error('Email not verified');
    const row=await fetch('https://sanrkcovmkkhgdqydxfk.supabase.co/rest/v1/ortho_staff?select=email,full_name&user_id=eq.'+encodeURIComponent(identity.id),{headers:header,cache:'no-store',credentials:'omit'});
    if(!row.ok)throw Error('No staff account');
    const items=await row.json();if(!Array.isArray(items)||items.length!==1)throw Error('Invalid staff context');
    const email=String(identity.email||'').toLowerCase(),staff=items[0];
    if(email==='dr.akarkach@gmx.de'&&String(staff.email||'').toLowerCase()===email){
      el.textContent='Guten Tag, Dr. Akarkach';
    }else{
      const display=String(staff.full_name||'').trim().slice(0,80);
      el.textContent='Guten Tag'+(display?', '+display:'')+'.';
    }
  }catch{sessionStorage.removeItem('piga-ortho-auth-ephemeral');el.textContent='Guten Tag.';}
 }
 personalize();
 const size=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(n/(1024*1024))+' MiB';
 async function hash(bytes){if(!crypto?.subtle)return 'In diesem Sicherheitskontext nicht verfügbar';const data=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(data)].map(b=>b.toString(16).padStart(2,'0')).join('');}
 function inspect(bytes){const n=bytes.byteLength,view=new DataView(bytes);if(n<30||n>25*1024*1024)throw Error('Datei muss zwischen 30 Byte und 25 MiB groß sein.');
   if(n>=84){const count=view.getUint32(80,true);if(84+count*50===n&&count>0){let valid=true;for(let k=0;k<Math.min(count,2000);k++){for(let j=0;j<12;j++){const val=view.getFloat32(84+k*50+j*4,true);if(!Number.isFinite(val)){valid=false;break;}}if(!valid)break;}if(!valid)throw Error('Ungültige Dreiecks-Koordinaten.');return {format:'Binary STL',count,plausible:true};}}
   const str=new TextDecoder('utf-8',{fatal:false}).decode(bytes.slice(0,Math.min(n,25*1024*1024))).trim();
   const facets=(str.match(/facet\s+normal\s+/gi)||[]).length;
   if(!/^solid(?:\s|$)/i.test(str)||!facets||!/(?:endsolid)\s*$/i.test(str))throw Error('STL-Struktur nicht eindeutig lesbar.');
   const endVertices=(str.match(/endfacet/gi)||[]).length;if(facets!==endVertices)throw Error('STL enthält unvollständige Flächen.');
   return {format:'ASCII STL',count:facets,plausible:true};
 }
 input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file)return;result.className='tool-feedback';result.textContent='STL wird lokal untersucht …';try{if(!/\.stl$/i.test(file.name))throw Error('Nur STL-Dateien auswählen.');if(file.size>25*1024*1024)throw Error('Maximale Größe 25 MiB.');const buffer=await file.arrayBuffer();const info=inspect(buffer);const digest=await hash(buffer);result.className='tool-feedback good';result.textContent='Format: '+info.format+'\nDreiecke: '+info.count+'\nDateigröße: '+size(file.size)+'\nSHA-256: '+digest+'\nNur technische Basisprüfung. Keine klinische Modellfreigabe.';}catch(err){result.className='tool-feedback warning';result.textContent='Technische Prüfung nicht abgeschlossen: '+String(err.message);}});
 const boxes=[...document.querySelectorAll('[data-check]')];const state=$('checkStatus');const bar=$('checkBar');const count=$('checkLabel');
 function update(){const n=boxes.filter(c=>c.checked).length;count.textContent=n+' / '+boxes.length+' Punkte bestätigt';bar.style.width=(100*n/boxes.length)+'%';state.className='tool-feedback '+(n===boxes.length?'good':'warning');state.textContent=n===boxes.length?'Checkliste dieser Sitzung vollständig. Eine Druckfreigabe ist damit nicht erteilt. Für jeden Druck sind separate Gate-2-Prüfungen erforderlich.':'Noch '+(boxes.length-n)+' Punkte offen. Dies ist nur eine manuelle Arbeitshilfe ohne externe Wirkung.';}
 boxes.forEach(c=>c.addEventListener('change',update));$('clearChecks').addEventListener('click',()=>{boxes.forEach(c=>c.checked=false);update();});update();
 $('findFeature').addEventListener('click',()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true})));
})();
