'use strict';(()=>{
 const $=id=>document.getElementById(id),native=window.PigaNative;
 let evidence=null;
 const log=(msg,error=false)=>{const el=$('scanResult');el.textContent=msg;el.classList.toggle('error',error)};
 const set=(key,value)=>$(key).textContent=value;
 const detect=()=>{
   let info;
   try{info=native&&typeof native.deviceSnapshot==='function'?JSON.parse(native.deviceSnapshot()):null;}catch{}
   if(info){
     set('wifiStatus',info.wifiConnected?'WLAN verbunden':info.networkConnected?'Netzwerk ohne WLAN':'Kein aktives WLAN bestätigt');
     set('btStatus',info.bluetoothAvailable?info.bluetoothPermission?(info.bluetoothEnabled?'Bluetooth aktiv':'Bluetooth deaktiviert'):'Berechtigung erforderlich':'Bluetooth nicht vorhanden');
     $('wifiDot').classList.toggle('active',Boolean(info.wifiConnected));
     $('btDot').classList.toggle('active',Boolean(info.bluetoothAvailable&&info.bluetoothPermission&&info.bluetoothEnabled));
     const list=$('pairedList');list.textContent='';
     if(Array.isArray(info.pairedDevices)&&info.pairedDevices.length){
       info.pairedDevices.slice(0,20).forEach(device=>{const row=document.createElement('div');row.textContent=String(device.name||'Gekoppeltes Gerät').slice(0,80)+' · gekoppelt (kein Treiber)';list.append(row);});
     }else list.textContent=info.bluetoothPermission?'Keine gekoppelten Geräte gemeldet.':'Nur mit Android-Geräteberechtigung sichtbar.';
   }else{
     set('wifiStatus','Browser: '+(navigator.onLine?'Internetverbindung gemeldet':'Offline')+' – kein WLAN-Nachweis');
     set('btStatus','Browser: Android-Gerätezugriff nicht verfügbar');
     $('pairedList').textContent='Öffnen Sie die Android-App, um gekoppelte Bluetooth-Geräte anzuzeigen.';
   }
 };
 window.pigaDeviceRefresh=detect;
 $('probe').onclick=detect;
 $('wifiSettings').onclick=()=>{if(native?.openWirelessSettings)native.openWirelessSettings('wifi');else log('WLAN-Einstellungen sind nur in der Android-App direkt erreichbar.','error')};
 $('btSettings').onclick=()=>{if(native?.openWirelessSettings)native.openWirelessSettings('bluetooth');else log('Bluetooth-Kopplung über die Systemeinstellungen Ihres Gerätes öffnen.','error')};
 $('btGrant').onclick=()=>{if(native?.requestBluetoothPermission)native.requestBluetoothPermission();else log('Bluetooth-Geräteberechtigung ist nur im Android-Build verfügbar.','error')};
 async function sha(bytes){if(!crypto?.subtle)return null;const result=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(result),b=>b.toString(16).padStart(2,'0')).join('');}
 function inspect(buffer){
   if(buffer.byteLength<30)throw Error('STL-Datei zu klein.');
   const view=new DataView(buffer);
   const bounds=(tris,degenerate,min,max,format)=>({triangles:tris,degenerate,bounds:min.map((x,i)=>max[i]-x),min,max,format});
   const areaZero=(a,b,c)=>{
     const u=a.map((v,i)=>b[i]-v),v=a.map((x,i)=>c[i]-x);
     return Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])<1e-9;
   };
   const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   function add(coord){for(let j=0;j<3;j++){const n=coord[j];if(!Number.isFinite(n))throw Error('Ungültige STL-Koordinate.');min[j]=Math.min(min[j],n);max[j]=Math.max(max[j],n);}}
   const count=buffer.byteLength>=84?view.getUint32(80,true):0;
   if(count>0&&84+count*50===buffer.byteLength){
     if(count>500000)throw Error('Zu viele Dreiecke.');
     let degenerate=0;
     for(let t=0;t<count;t++){
       const verts=[];
       for(let v=0;v<3;v++){
         const xyz=[];
         for(let axis=0;axis<3;axis++)xyz.push(view.getFloat32(84+t*50+12+v*12+axis*4,true));
         add(xyz);verts.push(xyz);
       }
       if(areaZero(...verts))degenerate++;
     }
     return bounds(count,degenerate,min,max,'Binary STL');
   }
   const txt=new TextDecoder('utf-8',{fatal:false}).decode(buffer);
   if(!/^\\s*solid\\b/i.test(txt)||!/\\bendsolid\\s*$/i.test(txt))throw Error('Ungültiger ASCII-STL-Header oder Abschluss.');
   const lines=(txt.match(/\\bfacet\\s+normal\\b/gi)||[]).length;
   const ends=(txt.match(/\\bendfacet\\b/gi)||[]).length;
   if(!lines||lines!==ends||lines>500000)throw Error('Ungültige Facettenzahl.');
   const regex=/\\bvertex\\s+([^\\s]+)\\s+([^\\s]+)\\s+([^\\s]+)/gi;
   let match,tris=0,degenerate=0,vertices=[];
   while((match=regex.exec(txt))!==null){
     const xyz=[Number(match[1]),Number(match[2]),Number(match[3])];add(xyz);
     vertices.push(xyz);
     if(vertices.length===3){if(areaZero(...vertices))degenerate++;tris++;vertices=[];}
     if(tris>500000)throw Error('Zu viele Dreiecke.');
   }
   if(vertices.length||tris!==lines)throw Error('ASCII STL: unvollständige Facetten.');
   return bounds(tris,degenerate,min,max,'ASCII STL');
 }
 function reset(){set('stepScan','OFFEN');set('stepFile','OFFEN');set('stepMeasure','OFFEN');$('saveEvidence').disabled=true;$('openReport').disabled=true;evidence=null;}
 async function process(file){
  reset();log('Modell wird ausschließlich auf diesem Gerät geprüft …');
  try{
   if(!file||!file.name.toLowerCase().endsWith('.stl'))throw Error('Bitte eine STL-Datei auswählen.');
   if(file.size>25*1024*1024)throw Error('Maximal 25 MiB.');
   const data=await file.arrayBuffer();
   const m=inspect(data),hash=await sha(data);
   if(!hash)throw Error('SHA-256 fehlt im Browser-Sicherheitskontext.');
   set('stepScan','LOKAL');set('stepFile',m.degenerate?'HINWEIS':'GEPRÜFT');set('stepMeasure','EINHEIT OFFEN');
   evidence={schema:'piga-ortho-technical-device-evaluation.v1',time:new Date().toISOString(),sourceFile:file.name.slice(0,120),synthetic:Boolean(file.synthetic),sha256:hash,sizeBytes:file.size,triangles:m.triangles,degenerate:m.degenerate,stlUnits:'UNKNOWN',boundsSTL:m.bounds.map(x=>Number(x.toFixed(4))),piga:{gate1:'DELAY',reason:'Einheit, fachliche Eingangsprüfung und Mesh-Manifoldness nicht bestätigt',gate2:'BLOCK'},a7semReverse:{effect:'NO_DEVICE_ACTION',readback:'NOT_APPLICABLE'},medicalMeasurements:'NOT_COMPUTED',deviceTransmissions:0,clinicalApproved:false};
   log('Format: '+m.format+' · '+m.triangles+' Dreiecke · '+m.degenerate+' geometrisch degeneriert\nGrenzmaße X/Y/Z (STL-Einheiten): '+m.bounds.map(x=>x.toFixed(3)).join(' / ')+'\nSHA-256: '+hash+'\nPIGA Gate 1: DELAY (Maßstab unbekannt). Gate 2: BLOCK.');
   $('saveEvidence').disabled=false;$('openReport').disabled=false;
   return evidence;
  }catch(err){reset();log('BLOCK / Fehler: '+String(err.message).slice(0,220),true);return null;}
 }
 $('scanFile').onchange=e=>{process(e.target.files?.[0]);e.target.value='';};
 $('scanFile2').onchange=e=>{process(e.target.files?.[0]);e.target.value='';};
 // 14 simple, intentionally artificial tooth-shaped solids; not anatomical or clinically usable.
 // Three purely synthetic, non-clinical typodont examples; no real scans or PHI.
 let selectedDemo='standard';
 const demos={
  standard:{title:'Regulärer Zahnbogen – schematisch',code:'REGULAER'},
  crowding:{title:'Engstand – schematisch',code:'ENGSTAND'},
  spacing:{title:'Lückenstand – schematisch',code:'LUECKEN'}
 };
 function makeDemo(kind=selectedDemo){
   const triangles=[];
   const face=(a,b,c)=>{triangles.push([a,b,c]);};
   const box=(cx,cy,cz,w,d,h)=>{
     const x=w/2,y=d/2,z=h/2;
     const p=[[cx-x,cy-y,cz-z],[cx+x,cy-y,cz-z],[cx+x,cy+y,cz-z],[cx-x,cy+y,cz-z],
       [cx-x,cy-y,cz+z],[cx+x,cy-y,cz+z],[cx+x,cy+y,cz+z],[cx-x,cy+y,cz+z]];
     for(const [a,b,c,d] of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]){face(p[a],p[b],p[c]);face(p[a],p[c],p[d]);}
   };
   for(let i=0;i<14;i++){
     const angle=(Math.PI*0.12)+(i/13)*Math.PI*.76;
     const crowd=kind==='crowding';
     const space=kind==='spacing';
     const zig=crowd?(i%2===0?1.35:-1.35):0;
     const cx=(space?30:crowd?22:26)*Math.cos(angle)+zig;
     const cy=(space?20:crowd?16:18)*Math.sin(angle)+(crowd?(i%3-1)*1.2:0);
     box(cx,cy,3,space?2.65:3.3,4.1,6);
   }
   const buffer=new ArrayBuffer(84+triangles.length*50),view=new DataView(buffer);
   const name=new TextEncoder().encode('PIGA SYNTHETIC DEMO – NOT CLINICAL');new Uint8Array(buffer).set(name.slice(0,80));
   view.setUint32(80,triangles.length,true);
   triangles.forEach((tr,i)=>{for(let v=0;v<3;v++)for(let a=0;a<3;a++)view.setFloat32(84+i*50+12+v*12+a*4,tr[v][a],true);});
   const file=new File([buffer],'PIGA_DEMO_'+demos[kind].code+'_SYNTHETISCH.stl',{type:'model/stl'});
   Object.defineProperty(file,'synthetic',{value:true});Object.defineProperty(file,'demoType',{value:kind});return file;
 }
 const picks=[...document.querySelectorAll('[data-model]')];
 function choose(kind){
  if(!demos[kind])return;
  selectedDemo=kind;
  picks.forEach(p=>{const selected=p.dataset.model===kind;p.setAttribute('aria-pressed',String(selected));p.classList.toggle('selected',selected);});
  $('modelChoice').textContent=demos[kind].title+' · ausschließlich künstliche Form';
 }
 picks.forEach(p=>p.addEventListener('click',()=>choose(p.dataset.model)));
 choose('standard');
 $('demoModel').onclick=()=>process(makeDemo());
 async function report(){
   if(!evidence)return log('Keine zulässige technische Evidenz für einen Bericht.','error');
   try{
     const e=evidence,list=[];let prior='GENESIS';
     const stages=[
       ['SESSION_INITIALIZED','OBSERVED',{mode:'technical-demo',synthetic:e.synthetic}],
       ['STL_IMPORT','OBSERVED',{fileBytes:e.sizeBytes,triangles:e.triangles,invalid:0,degenerateSample:e.degenerate,sha256:e.sha256,synthetic:e.synthetic}],
       ['TECHNICAL_GEOMETRY','OBSERVED',{bounds:e.boundsSTL,units:'UNVERIFIED_STL_UNITS'}],
       ['PIGA_GATE1_EVALUATION','DELAY',{reason:e.piga.reason}],
       ['FINITE_INFINITE_START','OBSERVED',{maxCycles:2,automaticActions:false}],
       ['FINITE_WORKER_CYCLE','OBSERVED',{cycle:1,geometryObserved:true,externalEffects:0}],
       ['FINITE_WORKER_CYCLE','OBSERVED',{cycle:2,readback:'NO_EXTERNAL_EFFECT',externalEffects:0}],
       ['FINITE_INFINITE_RESULT','OBSERVED',{status:'COMPLETED',externalEffects:0}],
       ['A7SEM_REVERSE','UNKNOWN',{op:'NONE',before:'NO_ACTION',after:'NO_ACTION',fileMatches:false,externalEffects:0}]
     ];
     for(const [type,decision,details] of stages){
       const item={schema:'piga-ortho-event.v1',time:new Date().toISOString(),sequence:list.length+1,type,decision,
         caseId:e.synthetic?'CASE-DEMO-001':null,modelSha256:e.sha256,details,previousSha256:prior};
       item.sha256=await sha(new TextEncoder().encode(JSON.stringify(item)));
       if(!item.sha256)throw Error('SHA256 unavailable');
       prior=item.sha256;list.push(item);
     }
     const payload={
       schema:'piga-ortho-report-input.v1',exportedAt:new Date().toISOString(),
       caseId:e.synthetic?'CASE-DEMO-001':null,gate1:'DELAY',gate2:'BLOCK',readback:'UNKNOWN',
       unitVerified:false,clinicalApproved:false,
       model:{name:e.sourceFile,sha256:e.sha256,triangles:e.triangles,bounds:e.boundsSTL,fileBytes:e.sizeBytes,invalid:0,synthetic:e.synthetic},
       events:list,terminalSha256:prior
     };
     sessionStorage.setItem('piga-ortho-report-once',JSON.stringify(payload));
     location.assign('./report.html');
   }catch(err){log('Druckakte nicht erstellt: '+String(err.message).slice(0,120)+' · Sie können den Prüfbeleg getrennt exportieren.','error');}
 }
 $('openReport').onclick=report;
 $('downloadDemo').onclick=()=>{
   const file=makeDemo(),url=URL.createObjectURL(file),a=document.createElement('a');
   a.href=url;a.download='PIGA_DEMO_ZAHNBOGEN_SYNTHETISCH.stl';a.click();
   setTimeout(()=>URL.revokeObjectURL(url),2500);
 };
 $('demoStudio').onclick=async()=>{
   try{
     const file=makeDemo(),bytes=new Uint8Array(await file.arrayBuffer());
     if(bytes.length>20000)throw Error('Demo exceeds handoff size');
     let binary='';for(let k=0;k<bytes.length;k++)binary+=String.fromCharCode(bytes[k]);
     sessionStorage.setItem('piga-ortho-demo-stl-once',btoa(binary));
     location.assign('./index.html#studio');
   }catch(e){log('Modellübergabe nicht möglich. Bitte Test-STL herunterladen und im Viewer manuell öffnen.','error');}
 };
 $('demoJourney').onclick=async()=>{
   const file=makeDemo(),checked=await process(file);
   if(checked)await report();
 };

 $('saveEvidence').onclick=()=>{
   if(!evidence)return;
   const blob=new Blob([JSON.stringify(evidence,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='PIGA_ORTHO_GERAETEEVALUATION_'+new Date().toISOString().slice(0,10)+'.json';a.click();
   setTimeout(()=>URL.revokeObjectURL(url),2000);
 };
 detect();window.addEventListener('online',detect);window.addEventListener('offline',detect);
})();
