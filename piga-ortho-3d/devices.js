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
  if(buffer.byteLength<84)throw Error('Datei für den technischen STL-Check zu klein');
  const view=new DataView(buffer),count=view.getUint32(80,true);
  if(count<=0||84+count*50!==buffer.byteLength)throw Error('Nur gültige binäre STL-Dateien für die Messansicht unterstützt.');
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  let triangles=0,degenerate=0;
  const tri=(a,b,c)=>{const u=a.map((v,i)=>b[i]-v),v=a.map((w,i)=>c[i]-w);
   const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
   return Math.hypot(...cross)<1e-9;};
  for(let t=0;t<count;t++){
   const vertices=[];
   for(let k=0;k<3;k++){
    const coord=[];
    for(let j=0;j<3;j++){
      const x=view.getFloat32(84+t*50+12+k*12+j*4,true);
      if(!Number.isFinite(x))throw Error('Nicht-endliche STL-Koordinate erkannt.');
      min[j]=Math.min(min[j],x);max[j]=Math.max(max[j],x);coord.push(x);
    }vertices.push(coord);
   }
   if(tri(...vertices))degenerate++;triangles++;
  }
  return {triangles,degenerate,bounds:min.map((v,i)=>max[i]-v),min,max};
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
   log('Format: Binary STL · '+m.triangles+' Dreiecke · '+m.degenerate+' geometrisch degeneriert\nGrenzmaße X/Y/Z (STL-Einheiten): '+m.bounds.map(x=>x.toFixed(3)).join(' / ')+'\nSHA-256: '+hash+'\nPIGA Gate 1: DELAY (Maßstab unbekannt). Gate 2: BLOCK.');
   $('saveEvidence').disabled=false;$('openReport').disabled=false;
   return evidence;
  }catch(err){reset();log('BLOCK / Fehler: '+String(err.message).slice(0,220),true);return null;}
 }
 $('scanFile').onchange=e=>{process(e.target.files?.[0]);e.target.value='';};
 $('scanFile2').onchange=e=>{process(e.target.files?.[0]);e.target.value='';};
 // 14 simple, intentionally artificial tooth-shaped solids; not anatomical or clinically usable.
 function makeDemo(){
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
     const cx=26*Math.cos(angle),cy=18*Math.sin(angle);
     box(cx,cy,3,3.3,4.1,6);
   }
   const buffer=new ArrayBuffer(84+triangles.length*50),view=new DataView(buffer);
   const name=new TextEncoder().encode('PIGA SYNTHETIC DEMO – NOT CLINICAL');new Uint8Array(buffer).set(name.slice(0,80));
   view.setUint32(80,triangles.length,true);
   triangles.forEach((tr,i)=>{for(let v=0;v<3;v++)for(let a=0;a<3;a++)view.setFloat32(84+i*50+12+v*12+a*4,tr[v][a],true);});
   const file=new File([buffer],'PIGA_DEMO_ZAHNBOGEN_SYNTHETISCH.stl',{type:'model/stl'});
   Object.defineProperty(file,'synthetic',{value:true});return file;
 }
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
