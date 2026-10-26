'use strict';
/* PIGA ORTHO Imaging: finite event-based local research workflow. Clinical and device actions
   are never admitted here. No remote calls. No imaging data stored persistently. */
(()=>{
 const P=window.PigaImaging,$=id=>document.getElementById(id);
 if(!P){$('imageStatus').textContent='BLOCK / ENGINE';return;}
 let series=[],selected=0,modelA=null,modelB=null,clearanceResult=null,stageResult=null;
 let analyses=[],epoch=0,pipeline={status:'IDLE',steps:[],index:0,history:[],session:crypto.randomUUID()},dialogResolve=null;
 const MAX_FILES=100,MAX_BYTES=128*1024*1024;
 function note(id,message){$(id).textContent=message}
 function newEntry(type,result){analyses.unshift({type,at:new Date().toISOString(),result});analyses=analyses.slice(0,25)}
 function getCurrent(){if(!series.length)return null;let n=selected;for(const img of series){if(n<img.frames)return{img,frame:n};n-=img.frames}return null}
 function resize(canvas,cssW,cssH){
  // Pixel backing tracks high DPI but never exceeds UHD 3840 x 2160.
  const dpr=Math.min(3,window.devicePixelRatio||1),ratio=Math.min(3840/(cssW*dpr),2160/(cssH*dpr),1);
  const w=Math.max(1,Math.round(cssW*dpr*ratio)),h=Math.max(1,Math.round(cssH*dpr*ratio));
  if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
 }
 function render(){
  const canvas=$('dicomCanvas'),ctx=canvas.getContext('2d',{alpha:false});
  resize(canvas,Math.max(220,canvas.clientWidth||700),Math.max(220,canvas.clientHeight||700));
  const w=canvas.width,h=canvas.height;ctx.fillStyle='#081d32';ctx.fillRect(0,0,w,h);
  const c=getCurrent();
  if(!c){
   ctx.fillStyle='#87bed6';ctx.textAlign='center';ctx.font=Math.round(Math.min(w,h)*.045)+'px system-ui';
   ctx.fillText('DICOM / CBCT',w/2,h/2);
   ctx.font=Math.round(Math.min(w,h)*.018)+'px system-ui';ctx.fillText('DATEIEN ÖFFNEN ODER SYNTHETISCHE VORSCHAU',w/2,h/2+40);
   $('maskPercent').textContent='—';return;
  }
  const windowCenter=Number($('windowCenter').value),windowWidth=Number($('windowWidth').value);
  const threshold=$('maskEnabled').checked?Number($('threshold').value):null;
  let output;
  try{output=P.grayscale(c.img,c.frame,windowCenter,windowWidth,threshold)}
  catch(e){note('dicomMessage',e.message);return}
  const temp=document.createElement('canvas');temp.width=output.width;temp.height=output.height;
  temp.getContext('2d').putImageData(new ImageData(output.data,output.width,output.height),0,0);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const scale=Math.min(w/output.width,h/output.height),dw=output.width*scale,dh=output.height*scale;
  ctx.drawImage(temp,(w-dw)/2,(h-dh)/2,dw,dh);
  $('maskPercent').textContent=threshold===null?'Maske deaktiviert':(output.ratio*100).toFixed(2).replace('.',',')+' %';
  $('sliceReadout').textContent=(selected+1)+' / '+series.reduce((n,x)=>n+x.frames,0);
 }
 function displaySeries(){
  const frames=series.reduce((n,x)=>n+x.frames,0);
  $('imageCount').textContent=String(frames);
  $('imageSize').textContent=series.length?series[0].cols+' × '+series[0].rows:'—';
  $('sliceIndex').max=String(Math.max(0,frames-1));
  selected=Math.max(0,Math.min(frames-1,selected));$('sliceIndex').value=String(selected);
  if(series.length)note('dicomMessage',series.length+' Datei(en), '+frames+' Schnittbilder lokal geladen. Transfer-Syntax: '+series[0].ts+'. Keine Patientendaten gespeichert.');
  $('imageStatus').textContent=series.length?'DICOM LOCAL':'LOCAL';
  render();
 }
 function clear(){
  series=[];selected=0;displaySeries();
  note('dicomMessage','Bilder verworfen. Keine Dateien oder Metadaten in der Datenbank gespeichert.');
 }
 $('dicomFiles').onchange=async e=>{
  const input=e.target,files=[...(input.files||[])];input.value='';
  if(!files.length)return;
  if(files.length>MAX_FILES||files.some(f=>f.size>32*1024*1024)||
   files.reduce((sum,f)=>sum+f.size,0)>MAX_BYTES)return note('dicomMessage','Maximal 100 Dateien, 32 MiB je Datei und 128 MiB pro Import. Keine Daten geladen.');
  const next=[],errors=[];
  note('dicomMessage','DICOM-Serie wird lokal eingelesen …');
  for(const f of files){
   try{const im=P.parseDicom(await f.arrayBuffer());
    if(next.length&&(im.rows!==next[0].rows||im.cols!==next[0].cols||im.bits!==next[0].bits))
     throw Error('abweichende Bilddimensionen oder Pixelauflösung');
    next.push(im);
   }catch(err){errors.push(String(err.message||err).slice(0,150));}
  }
  if(!next.length)return note('dicomMessage','Keine kompatible Datei: '+errors.slice(0,2).join(' / '));
  next.sort((a,b)=>((a.z??a.instance??0)-(b.z??b.instance??0)));
  series=next;selected=0;displaySeries();
  if(errors.length)note('dicomMessage',next.length+' Dateien lesbar, '+errors.length+' inkompatibel: '+errors[0]);
 };
 $('syntheticDicom').onclick=()=>{
  const N=256,count=16;
  const img={rows:N,cols:N,frames:count,bits:16,photo:'MONOCHROME2',ts:'SYNTHETIC',min:-1024,max:2100,
   pixel(index){
    const slice=Math.floor(index/(N*N)),pos=index%(N*N),x=pos%N-N/2,y=Math.floor(pos/N)-N/2;
    const angle=Math.atan2(y,x),radius=Math.hypot(x,y);
    const bone=Math.abs(radius-(69+5*Math.sin(angle*6+slice*.18)))<14?1750:-650;
    const arc=Math.abs(radius-(37+3*Math.sin(angle*9)))<11?550:0;
    const mod=62*Math.sin((x+slice)*.13)*Math.cos(y*.2);
    return bone+arc+mod;
   }
  };
  series=[img];selected=0;displaySeries();
  note('dicomMessage','SYNTHETISCHES GRAUWERTVOLUMEN · 16 Frames × 256². Keine anatomischen Bilddaten oder Diagnostik.');
 };
 $('clearImages').onclick=clear;
 $('sliceIndex').oninput=e=>{selected=Number(e.target.value);render()};
 for(const id of ['windowCenter','windowWidth','maskEnabled','threshold']){
  $(id).addEventListener('input',()=>{
   $('thresholdValue').textContent='≥ '+$('threshold').value+' (nur Forschungsmaske)';render();
  });
 }
 let renderQueued=false;
 const laterRender=()=>{if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;render()})};
 if('ResizeObserver' in window){const observer=new ResizeObserver(laterRender);observer.observe($('dicomCanvas'));}
 window.addEventListener('resize',laterRender);
 $('exportSlice').onclick=()=>{
  if(!series.length)return note('dicomMessage','Für den Bildexport zuerst ein synthetisches/kompatibles DICOM-Bild laden.');
  render();const a=document.createElement('a');a.href=$('dicomCanvas').toDataURL('image/png');
  a.download='PIGA-ORTHO-TECHNICAL-SLICE-'+selected+'.png';document.body.append(a);a.click();a.remove();
 };
 async function loadMesh(file){
  if(!file||!/\.stl$/i.test(file.name)||file.size>25*1024*1024)throw Error('Gültige STL-Datei bis 25 MiB erforderlich.');
  return P.parseStlSamples(await file.arrayBuffer());
 }
 async function measure(){
  const [a,b]=[$('upperStl').files?.[0],$('lowerStl').files?.[0]];
  if(!a||!b)throw Error('Zwei STL-Dateien auswählen.');
  modelA=await loadMesh(a);modelB=await loadMesh(b);
  clearanceResult=P.clearance(modelA,modelB);
  const v=clearanceResult.distanceModelUnits;
  note('clearanceMessage','Technische Abstandsprobe: '+v.toPrecision(5)+' unkalibrierte STL-Einheiten. '+
   clearanceResult.sampleCountA+' × '+clearanceResult.sampleCountB+' Eckpunktproben. Keine Kontakt- oder Okklusionsdiagnose.');
  newEntry('CLEARANCE_PROXY',{value:v,units:'unknown',registered:false,samplesA:clearanceResult.sampleCountA,samplesB:clearanceResult.sampleCountB});
  return clearanceResult;
 }
 $('analyzeClearance').onclick=async()=>{
  $('analyzeClearance').disabled=true;
  try{await measure()}catch(e){note('clearanceMessage','Abstandsprobe nicht möglich: '+e.message)}finally{$('analyzeClearance').disabled=false}
 };
 function showStage(n){
  const count=stageResult?.levels.length-1||Number($('stageCount').value)||8;
  const fraction=count?Math.min(1,Math.max(0,n/count)):0;
  $('stageMarker').style.setProperty('--stage-fraction',String(fraction));
  $('stageReadout').textContent=n+' / '+count;
 }
 function simulate(){
  if(!modelA||!modelB)throw Error('Bitte zuerst zwei STL-Modelle für die technische Abstandsprobe laden.');
  stageResult=P.staging(modelA,modelB,Number($('stageCount').value));
  const stages=stageResult.levels.length-1;
  $('stageSlider').max=String(stages);$('stageSlider').value='0';showStage(0);
  note('stageMessage',stages+' rein geometrische Zwischenstufen erzeugt. Gesamttranslation: '+
   stageResult.distanceModelUnits.toFixed(4)+' unkalibrierte STL-Einheiten. Keine Zahnbewegungs- oder Aligner-Planung.');
  newEntry('STAGING_INTERPOLATION',{steps:stages,distanceModelUnits:stageResult.distanceModelUnits,clinicalApproved:false});
  return stageResult;
 }
 $('analyzeStages').onclick=()=>{try{simulate()}catch(e){note('stageMessage',e.message)}};
 $('stageSlider').oninput=e=>showStage(Number(e.target.value));
 // Session-bounded state machine. No unbounded background work, no remote execution.
 function record(text){
  pipeline.history.push({at:new Date().toISOString(),event:text});
  pipeline.history=pipeline.history.slice(-30);
  const root=$('pipelineHistory');root.replaceChildren();
  for(const row of pipeline.history.slice(-8).reverse()){
   const p=document.createElement('p');p.textContent=new Date(row.at).toLocaleTimeString('de-DE')+' · '+row.event;root.append(p);
  }
  note('pipelineState','Zustand: '+pipeline.status+' · Schritt '+pipeline.index+'/'+pipeline.steps.length);
 }
 function prompt(step){
  return new Promise(resolve=>{
   dialogResolve=resolve;
   $('decisionText').textContent='Forschungsarbeit: '+step+'. Nur dieser lokale technische Verarbeitungsschritt wird zugelassen. Keine klinische Handlung.';
   const d=$('pigaDecision');
   d.showModal();
  });
 }
 const d=$('pigaDecision');
 d.addEventListener('close',()=>{
  const resolve=dialogResolve;dialogResolve=null;
  if(resolve)resolve(['approve','reject','pause'].includes(d.returnValue)?d.returnValue:'pause');
 });
 async function runPipeline(session){
  const steps=['Synthetische DICOM-Vorschau prüfen','Grauwertmaskierung berechnen','Technische Modellprüfung dokumentieren','PIGA-Glassbox-Evidenz zusammenstellen'];
  pipeline={status:'RUNNING',steps,index:0,history:[],session};record('FINITES FORSCHUNGSTICKET aufgenommen');
  for(let i=0;i<steps.length;i++){
   if(pipeline.session!==session||pipeline.status!=='RUNNING')break;
   pipeline.index=i+1;
   pipeline.status='AWAITING_APPROVAL';record('Freigabe wartet: '+steps[i]);
   const decision=await prompt(steps[i]);
   if(pipeline.session!==session)break;
   if(decision==='reject'){pipeline.status='REJECTED';record('Von Betreiber abgelehnt');break;}
   if(decision==='pause'){pipeline.status='PAUSED';record('Von Betreiber pausiert');break;}
   pipeline.status='RUNNING';record('Technische Einzelschrittfreigabe bestätigt: '+steps[i]);
   try{
    if(i===0&&!series.length)$('syntheticDicom').click();
    if(i===1){$('maskEnabled').checked=true;render();}
    if(i===2&&modelA&&modelB&&!clearanceResult)await measure();
    if(i===2&&!modelA)record('Kein STL vorhanden: keine Geometriemaße vorgetäuscht');
    if(i===3)newEntry('FINITE_REVIEW',{approvedSteps:i+1,clinicalApproval:false,gate2:'BLOCK',effectCount:0});
   }catch(e){pipeline.status='BLOCK';record('Schritt blockiert: '+String(e.message||e));break;}
  }
  if(pipeline.status==='RUNNING'){pipeline.status='TECHNICAL_READY';record('Forschungszyklus beendet · medizinische und Gerätefreigaben bleiben BLOCK');}
  $('runFinite').disabled=false;
  record('Letzter Zustand: '+pipeline.status);
 }
 $('runFinite').onclick=()=>{
  if(['AWAITING_APPROVAL','RUNNING'].includes(pipeline.status))return;
  $('runFinite').disabled=true;void runPipeline(crypto.randomUUID());
 };
 $('pausePipeline').onclick=()=>{
  if(d.open)d.close('pause');
  if(pipeline.status==='RUNNING')pipeline.status='PAUSED';
  record('Pausieren angefordert');
 };
 $('resetPipeline').onclick=()=>{
  if(d.open)d.close('pause');
  pipeline={status:'IDLE',steps:[],index:0,history:[],session:crypto.randomUUID()};
  $('runFinite').disabled=false;record('Forschungszyklus zurückgesetzt');
 };
 $('queueSlice').onclick=()=>{
  if(!series.length)return note('dicomMessage','Zuerst ein technisches Bild laden.');
  newEntry('IMAGE_REVIEW_REQUEST',{frame:selected,mask:$('maskEnabled').checked,clinicalAuthority:'NOT_ASSIGNED'});
  note('dicomMessage','Lokaler Forschungsschritt zur Prüfakte hinzugefügt. Keine externe Worker-Übertragung.');
 };
 $('exportEvidence').onclick=async()=>{
  try{
   const report={schema:'piga-ortho-imaging-technical-evidence.v1',generatedAt:new Date().toISOString(),
    series:{files:series.length,frames:series.reduce((n,x)=>n+x.frames,0),rows:series[0]?.rows||0,cols:series[0]?.cols||0,
      rawTransferSyntax:series[0]?.ts||null},
    modelA:modelA?{triangles:modelA.triangleCount,samples:modelA.points.length}:null,
    modelB:modelB?{triangles:modelB.triangleCount,samples:modelB.points.length}:null,
    analyses,reviewHistory:pipeline.history,session: pipeline.session,
    admission:{gate1:'DELAY',gate2:'BLOCK',clinicalAuthority:'NOT_ASSIGNED',deviceEffectCount:0},
    caveats:'Forschungsmetriken / keine klinische Validierung. Keine Patientendaten oder Bild-Pixel in der Datei.'};
   const data=new TextEncoder().encode(JSON.stringify(report));
   const hash=await crypto.subtle.digest('SHA-256',data);
   const sha=[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('');
   const filename='PIGA-ORTHO-IMAGING-TECHNICAL-'+new Date().toISOString().slice(0,10)+'.json';
   const url=URL.createObjectURL(new Blob([JSON.stringify({report,sha256:sha},null,2)],{type:'application/json'}));
   const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   note('evidenceMessage','Technisches Protokoll exportiert · SHA-256 '+sha.slice(0,18)+'…');
  }catch(e){note('evidenceMessage','Export fehlgeschlagen: '+e.message)}
 };
 render();showStage(0);
})();
