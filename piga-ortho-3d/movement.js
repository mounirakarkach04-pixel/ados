'use strict';
/* PIGA ORTHO 3D — local movement lab UI.
 * No automatic clinical treatment advice, cloud calls or direct printer operations.
 */
(()=>{
 const C=window.PigaMovementCore,$=id=>document.getElementById(id);
 if(!C){document.body.textContent='BLOCK: Bewegungs-Kernel konnte nicht geladen werden.';return;}
 const keys=['x','y','z','rx','ry','rz'],empty=()=>({x:0,y:0,z:0,rx:0,ry:0,rz:0});
 let teeth=[],selected='',stage=0,stages=8,verified=false,reverse='UNKNOWN',audit=[],yaw=-.6,pitch=-.25,task=null;
 let generation=0;
 const show=msg=>{const el=$('notice');el.textContent=String(msg);el.classList.add('show');clearTimeout(show.timer);show.timer=setTimeout(()=>el.classList.remove('show'),6000)};
 const log=(action,result,details={})=>{audit.push({at:new Date().toISOString(),action,result,details});if(audit.length>80)audit.shift()};
 const f=n=>Number(n).toFixed(3).replace('.',',');
 const tooth=()=>teeth.find(t=>t.fdi===selected)||null;
 function invalid(reason){
   verified=false;reverse='UNKNOWN';generation++;
   $('reverse').textContent=reason?'UNKNOWN · '+reason:'UNKNOWN · Änderung erfordert erneute Prüfung';
   $('review').checked=false;
   status();
 }
 function status(){
   const gate=C.gate1(teeth,$('units').checked,stages);
   $('count').textContent=teeth.length;
   $('stageCount').textContent=stages;
   $('gate1').textContent=gate.status;
   $('gateReason').textContent=gate.reason;
   const allowed=gate.status==='PASS'&&verified&&reverse==='PASS'&&$('review').checked&&$('reviewer').value.trim().length>=3;
   for(const id of ['exportStage','exportAll','exportReport'])$(id).disabled=!allowed;
   $('exportNote').textContent=allowed?
     'Nur technische STL-Geometriedateien. Klinische Anwendung, Aligner-/Modellfertigung und Druckfreigabe: BLOCK.':
     'Export gesperrt: mm-Quelle, FDI-Segmente, Gate 1, drei Reverse-Prüfzyklen, Prüfkürzel und manuelle Bestätigung benötigt.';
 }
 const fileCode=name=>{
   const m=String(name).match(/(?:^|[^0-9])([1-4][1-8])(?:[^0-9]|$)/);
   return m&&C.FDI.test(m[1])?m[1]:null;
 };
 async function sha256(buffer){
   if(!crypto?.subtle)throw Error('SHA-256 benötigt HTTPS oder sicheren lokalen Kontext.');
   const hash=await crypto.subtle.digest('SHA-256',buffer);
   return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
 }
 function syncFiles(){
   const list=$('files');list.replaceChildren();
   for(const t of teeth){
     const li=document.createElement('li');
     li.textContent='FDI '+t.fdi+' · '+t.mesh.triangles.toLocaleString('de-DE')+' Dreiecke · SHA-256 '+t.sha.slice(0,12)+'…';
     list.append(li);
   }
   if(!teeth.length){const li=document.createElement('li');li.textContent='Keine Zahnsegmente geladen';list.append(li);}
   const sel=$('tooth');sel.replaceChildren();
   if(!teeth.length){const opt=document.createElement('option');opt.value='';opt.textContent='Erst Zahn-STLs hochladen';sel.append(opt);}
   else for(const t of teeth){const opt=document.createElement('option');opt.value=t.fdi;opt.textContent='FDI '+t.fdi;sel.append(opt);}
   if(!teeth.some(t=>t.fdi===selected))selected=teeth[0]?.fdi||'';
   sel.value=selected;
   syncFields();status();draw();
 }
 async function loadFiles(files){
   if(!files?.length)return;
   if(files.length+teeth.length>28){show('BLOCK: höchstens 28 getrennte Zahnmodelle.');return;}
   const oldGen=generation,chosen=[],used=new Set(teeth.map(t=>t.fdi));
   try{
     for(const file of files){
       if(!/\.stl$/i.test(file.name))throw Error('Nur STL-Dateien zulässig: '+file.name);
       if(file.size>C.MAX_BYTES)throw Error('STL zu groß: '+file.name);
       const code=fileCode(file.name);
       if(!code||used.has(code))throw Error('Keine eindeutige gültige FDI-Nummer: '+file.name);
       const buffer=await file.arrayBuffer(),mesh=C.parseSTL(buffer);
       if(mesh.degenerate)throw Error('Degenerierte Dreiecke in '+file.name+': '+mesh.degenerate);
       const digest=await sha256(buffer);
       if(generation!==oldGen)throw Error('Dateien wurden während des Imports geändert; erneut laden.');
       chosen.push({fdi:code,file:file.name,sha:digest,mesh,plan:empty()});used.add(code);
     }
     teeth.push(...chosen);teeth.sort((a,b)=>Number(a.fdi)-Number(b.fdi));
     selected=chosen[0].fdi;invalid('Neue Quelle geladen');
     log('IMPORT','OBSERVED',{fdi:chosen.map(t=>t.fdi),sha256:chosen.map(t=>t.sha),triangles:chosen.map(t=>t.mesh.triangles)});
     syncFiles();show(chosen.length+' Zahnsegmente lokal geladen. Keine Cloud-Übertragung.');
   }catch(e){log('IMPORT','BLOCK',{reason:e.message});show('BLOCK: '+e.message);}
   $('uploads').value='';
 }
 function syncFields(){
   const t=tooth();
   for(const k of keys){$(k).disabled=!t;$(k).value=t?t.plan[k]:0;}
   measure();
 }
 function measure(){
   const t=tooth(),panel=$('metrics');
   if(!t){panel.textContent='Noch keine Einzelzahn-Geometrie geladen.';return;}
   const p=C.atStage(t.plan,stage,stages);
   let maximum='—';
   try{maximum=f(C.maxVertexDisplacement(t.mesh,p))+' mm';}catch{}
   panel.textContent='FDI '+t.fdi+' · Stufe '+stage+'/'+stages+
    '\nTranslation: '+f(Math.hypot(p.x,p.y,p.z))+' mm'+
    '\nResultierende starre Rotation: '+f(C.rotationAngle(p))+' °'+
    '\nGrößte Vertexverschiebung: '+maximum+
    '\nAnmerkung: Nur Modellgeometrie. Keine biologische Weglänge oder therapeutische Empfehlung.';
 }
 function setStageCount(value){
   const next=Number(value);
   if(!Number.isInteger(next)||next<1||next>40){show('Stufenzahl muss ganzzahlig von 1 bis 40 sein.');$('stages').value=stages;return;}
   stages=next;stage=Math.min(stage,stages);$('stage').max=stages;$('stage').value=stage;
   updateStage();invalid('Stufenfolge geändert');log('STAGING','UPDATED',{stages});draw();
 }
 function updateStage(){
   $('stageLabel').textContent=stage+' / '+stages;
   measure();
 }
 function renderModel(){
   const canvas=$('preview'),rect=canvas.getBoundingClientRect();
   const dpr=Math.min(1.5,window.devicePixelRatio||1);
   const w=Math.min(1400,Math.max(320,Math.round((rect.width||800)*dpr)));
   const h=Math.min(820,Math.max(200,Math.round((rect.height||440)*dpr)));
   if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
   const ctx=canvas.getContext('2d',{alpha:false});
   ctx.fillStyle='#e9f8fd';ctx.fillRect(0,0,w,h);
   if(!teeth.length){
     ctx.fillStyle='#387687';ctx.textAlign='center';ctx.font='bold '+Math.max(16,Math.floor(w/33))+'px system-ui';
     ctx.fillText('Einzelzahn-STLs auswählen',w/2,h/2);return;
   }
   const all=[],min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
   const budget=Math.max(14,Math.floor(1700/teeth.length));
   for(const t of teeth){
     const coords=t.mesh.coords,tri=t.mesh.triangles,step=Math.max(1,Math.ceil(tri/budget)),sample=[];
     for(let j=0;j<tri;j+=step)for(let k=0;k<9;k++)sample.push(coords[9*j+k]);
     const geometry=C.transform({coords:new Float32Array(sample),pivot:t.mesh.pivot},C.atStage(t.plan,stage,stages));
     for(let i=0;i<geometry.length;i+=3)for(let d=0;d<3;d++){min[d]=Math.min(min[d],geometry[i+d]);max[d]=Math.max(max[d],geometry[i+d]);}
     all.push({fdi:t.fdi,coords:geometry});
   }
   const center=min.map((v,i)=>(v+max[i])/2);
   const span=Math.max(...min.map((v,i)=>max[i]-v),1e-2),scale=Math.min(w,h)*.73/span;
   const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
   const project=(x,y,z)=>{
     x-=center[0];y-=center[1];z-=center[2];
     const a=cy*x+sy*z,q=-sy*x+cy*z,b=cp*y-sp*q,d=sp*y+cp*q;
     return[w*.5+a*scale,h*.5-b*scale,d];
   };
   const polygons=[];
   for(const item of all){
     const v=item.coords;
     for(let i=0;i<v.length;i+=9){
       const a=project(v[i],v[i+1],v[i+2]),b=project(v[i+3],v[i+4],v[i+5]),c=project(v[i+6],v[i+7],v[i+8]);
       const nx=(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]);
       const ny=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
       const nz=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
       const bright=Math.min(1,Math.max(.28,(Math.abs(nx*.4+ny*.35+nz*.85)/(Math.hypot(nx,ny,nz)||1))));
       polygons.push({a,b,c,z:(a[2]+b[2]+c[2])/3,bright,active:item.fdi===selected});
     }
   }
   polygons.sort((a,b)=>a.z-b.z);
   for(const p of polygons){
     const light=p.active?[47,175,190]:[89,140,165];
     const col=light.map(v=>Math.round(Math.min(250,v*(.52+p.bright*.67))));
     ctx.fillStyle='rgb('+col.join(',')+')';
     ctx.beginPath();ctx.moveTo(p.a[0],p.a[1]);ctx.lineTo(p.b[0],p.b[1]);ctx.lineTo(p.c[0],p.c[1]);ctx.closePath();ctx.fill();
   }
   ctx.fillStyle='#28647a';ctx.textAlign='left';ctx.font=Math.max(12,Math.min(18,14*dpr))+'px system-ui';
   ctx.fillText('STUFE '+stage+'/'+stages+'  ·  '+teeth.length+' ZAHNSEGMENT(E)  ·  VORSCHAU',12,26);
 }
 function draw(){if(task!==null)return;task=requestAnimationFrame(()=>{task=null;try{renderModel();}catch(e){show('Vorschau: '+e.message);}});}
 function reverseTest(){
   let worst=0,count=0;
   for(const t of teeth){
     const p=t.plan,m=C.matrix(p),v=t.mesh.coords,tv=C.transform(t.mesh,p),o=t.mesh.pivot;
     const jump=Math.max(3,Math.floor(v.length/12000/3)*3);
     for(let i=0;i<v.length;i+=jump){
       const x=tv[i]-o[0]-p.x,y=tv[i+1]-o[1]-p.y,z=tv[i+2]-o[2]-p.z;
       const recovered=[m[0]*x+m[3]*y+m[6]*z+o[0],m[1]*x+m[4]*y+m[7]*z+o[1],m[2]*x+m[5]*y+m[8]*z+o[2]];
       for(let j=0;j<3;j++)worst=Math.max(worst,Math.abs(recovered[j]-v[i+j]));
       count++;
     }
   }
   return{worst,samples:count};
 }
 function verify(){
   verified=false;reverse='UNKNOWN';status();const gate=C.gate1(teeth,$('units').checked,stages);
   if(gate.status!=='PASS'){show('Gate 1 BLOCK: '+gate.reason);log('A7SEM_GATE1','BLOCK',{reason:gate.reason});return;}
   try{
     const pass1={step:1,check:'source/representation/FDI/units',result:'PASS'};
     const rev=reverseTest();
     if(rev.worst>1e-3)throw Error('Reverse-Abweichung >0,001 mm ('+rev.worst+').');
     const pass2={step:2,check:'inverse-rigid-transform',result:'PASS',maxError:rev.worst,samples:rev.samples};
     const t=teeth[0],roundTrip=C.parseSTL(C.writeSTL(C.transform(t.mesh,t.plan),'review'));
     if(roundTrip.triangles!==t.mesh.triangles)throw Error('STL-Roundtrip: Dreieckzahl weicht ab.');
     const out=C.transform(t.mesh,t.plan);
     let error=0;for(let j=0;j<Math.min(90,out.length);j++)error=Math.max(error,Math.abs(out[j]-roundTrip.coords[j]));
     if(error>1e-3)throw Error('STL-Roundtrip: Koordinatenabweichung.');
     const pass3={step:3,check:'binary-stl-roundtrip',result:'PASS',maxError:error};
     log('A7SEM_REVERSE','PASS',{finiteCycles:[pass1,pass2,pass3],clinicalRelease:'BLOCK'});
     reverse='PASS';verified=true;
     $('reverse').textContent='PASS · 3/3 technische Prüfzyklen · inverse Abweichung max '+f(rev.worst)+' mm';
     show('3/3 technische Prüfzyklen bestanden. Klinische Druckfreigabe bleibt BLOCK.');
   }catch(e){reverse='BLOCK';log('A7SEM_REVERSE','BLOCK',{reason:e.message});$('reverse').textContent='BLOCK · '+e.message;show('Prüfung BLOCK: '+e.message);}
   status();
 }
 function report(){
   return{schema:'piga-ortho-movement-v1',created:new Date().toISOString(),purpose:'GEOMETRY_RESEARCH_ONLY',
     gate1:C.gate1(teeth,$('units').checked,stages),a7semReverse:reverse,
     clinicalRelease:'BLOCK',manufacturingRelease:'BLOCK',treatmentRecommendations:'NOT_COMPUTED',
     allCoordinatesUnits:'mm / user-verified only',rotationConvention:'Rz*Ry*Rx about per-tooth AABB center',
     caseId:/^[a-zA-Z0-9_-]{0,40}$/.test($('case').value)?$('case').value:null,
     reviewerSelfAttested:$('reviewer').value.trim(),reviewSelfAttested:$('review').checked,
     stages,stage,
     teeth:teeth.map(t=>({fdi:t.fdi,sourceName:t.file,sha256:t.sha,triangles:t.mesh.triangles,bounds:t.mesh.bounds,
       pivot:t.mesh.pivot,plan:t.plan,translationMm:Math.hypot(t.plan.x,t.plan.y,t.plan.z),
       rotationAngleDegrees:C.rotationAngle(t.plan),maxVertexDisplacementMm:C.maxVertexDisplacement(t.mesh,t.plan)})),
     events:audit.slice(),warnings:[
       'Not a medical device clearance, prescription or orthodontic treatment plan.',
       'No root, force, biological movement limits, bone collision, interproximal contact or occlusion validation.',
       'No automatic segmentation, crown-shell design, gingiva, print base, slicer, resin profile, physical printer or lab approval.',
       'STL has no inherent length unit: millimeters are user-attested, not verifiable from STL alone.'
     ]};
 }
 const jsonBuffer=obj=>new TextEncoder().encode(JSON.stringify(obj,null,2));
 function download(bytes,filename,type){
   const blob=new Blob([bytes],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 function exportFiles(all){
   const allowed=verified&&reverse==='PASS'&&C.gate1(teeth,$('units').checked,stages).status==='PASS'&&
    $('review').checked&&$('reviewer').value.trim().length>=3;
   if(!allowed){show('Export BLOCK: Gates und manuelle Prüfung fehlen.');return;}
   const count=all?stages+1:1;
   const estimated=count*teeth.reduce((n,t)=>n+84+50*t.mesh.triangles,0)+60000;
   if(estimated>100*1024*1024||count*teeth.length+1>512){show('ZIP zu groß. Weniger Stufen wählen oder einzelne Stufen exportieren (max. 100 MiB).');return;}
   try{
     const entries=[];
     for(let s=all?0:stage;s<=(all?stages:stage);s++){
       for(const t of teeth){
         const plan=C.atStage(t.plan,s,stages);
         entries.push({name:'stufe_'+String(s).padStart(2,'0')+'_FDI_'+t.fdi+'.stl',
           data:C.writeSTL(C.transform(t.mesh,plan),'FDI_'+t.fdi)});
       }
     }
     const evidence=report();evidence.exportedStageRange=all?[0,stages]:[stage,stage];
     evidence.files=entries.map(e=>e.name);evidence.exportApproval='TECHNICAL_ONLY';
     entries.push({name:'piga_evidence.json',data:jsonBuffer(evidence)});
     download(C.packZip(entries),'PIGA_Ortho_STL_TECHNISCH_'+(all?'ALLE_STUFEN':'STUFE_'+stage)+'.zip','application/zip');
     log('EXPORT_ZIP','OBSERVED',{files:entries.length,range:evidence.exportedStageRange,clinicalRelease:'BLOCK'});
     show('Technischer ZIP-Export ausgelöst. Druck- und Behandlungsfreigabe bleiben BLOCK.');
   }catch(e){log('EXPORT_ZIP','BLOCK',{reason:e.message});show('Export BLOCK: '+e.message);}
 }
 function exportJson(){
   if($('exportReport').disabled){show('Prüfpass gesperrt.');return;}
   download(jsonBuffer(report()),'PIGA_Ortho_Bewegungsplan_Glassbox.json','application/json');
   log('EXPORT_EVIDENCE','OBSERVED',{clinicalRelease:'BLOCK'});
 }
 $('uploads').addEventListener('change',e=>{void loadFiles([...e.target.files])});
 $('clear').addEventListener('click',()=>{
   teeth=[];selected='';audit=[];$('units').checked=false;$('review').checked=false;$('reviewer').value='';
   invalid('Alle Modelle aus Arbeitsspeicher entfernt');syncFiles();show('Lokale Modelldaten entfernt.');
 });
 $('tooth').addEventListener('change',e=>{selected=e.target.value;syncFields();draw();});
 keys.forEach(k=>$(k).addEventListener('change',()=>{
   const t=tooth();if(!t)return;
   const input=Number($(k).value);
   try{t.plan=C.limits({...t.plan,[k]:input});invalid('Bewegung geändert');log('MOTION_UPDATED','OBSERVED',{fdi:t.fdi,key:k,value:input});measure();draw();}
   catch(e){$(k).value=t.plan[k];show('BLOCK: '+e.message);}
 }));
 $('stages').addEventListener('change',e=>setStageCount(e.target.value));
 $('stage').addEventListener('input',e=>{stage=Number(e.target.value);updateStage();draw();});
 $('units').addEventListener('change',()=>invalid('Quellenfreigabe geändert'));
 $('case').addEventListener('change',()=>{invalid('Fallkennung geändert');});
 $('reviewer').addEventListener('input',status);$('review').addEventListener('change',status);
 $('verify').addEventListener('click',verify);
 $('exportStage').addEventListener('click',()=>exportFiles(false));
 $('exportAll').addEventListener('click',()=>exportFiles(true));
 $('exportReport').addEventListener('click',exportJson);
 $('left').addEventListener('click',()=>{yaw-=Math.PI/9;draw()});
 $('right').addEventListener('click',()=>{yaw+=Math.PI/9;draw()});
 $('reset').addEventListener('click',()=>{yaw=-.6;pitch=-.25;draw()});
 const canvas=$('preview');let dragging=false,lastX=0,lastY=0;
 canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw+=(e.clientX-lastX)*.007;pitch=Math.max(-1.5,Math.min(1.5,pitch+(e.clientY-lastY)*.007));lastX=e.clientX;lastY=e.clientY;draw()});
 canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
 window.addEventListener('resize',draw);
 $('stage').max=stages;updateStage();syncFiles();log('SESSION','OBSERVED',{mode:'research-only',print:'BLOCK'});
})();
