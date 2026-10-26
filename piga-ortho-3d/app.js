'use strict';
/* PIGA ORTHO 3D v0.1. Local evaluation only. No clinical treatment inference. */
(() => {
  const $ = id => document.getElementById(id);
  const enc = new TextEncoder();
  const state = { caseId:'', model:null, mesh:[], gate1:'UNKNOWN', gate2:'BLOCK', readback:'UNKNOWN', printer:null, host:'', key:'', printerStatus:null, events:[], chain:'GENESIS', cycle:false, stop:false, angleX:-0.40, angleY:0.55, zoom:1, connected:false, drawing:false, auditHealthy:true, nativeReady:false };
  function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function show(message){const el=$('toast');el.textContent=message;el.classList.add('visible');clearTimeout(show.timer);show.timer=setTimeout(()=>el.classList.remove('visible'),3600);}
  const iso=()=>new Date().toISOString();
  const digest=async data=>{let input = typeof data === 'string'?enc.encode(data):data; let buffer = await crypto.subtle.digest('SHA-256',input); return Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');};
  let auditQueue=Promise.resolve();
  function log(type,decision,details={}){
    auditQueue=auditQueue.then(async()=>{const event={schema:'piga-ortho-event.v1',time:iso(),sequence:state.events.length+1,type,decision,caseId:state.caseId||null,modelSha256:state.model?.sha||null,details,previousSha256:state.chain};event.sha256=await digest(JSON.stringify(event));state.chain=event.sha256;state.events.push(event);renderAudit();return event;}).catch(()=>{state.auditHealthy=false;state.gate2='BLOCK';labels();show('Auditfehler – weitere Druckaktionen gesperrt.');});
    return auditQueue;
  }
  function renderAudit(){const el=$('audit');if(!state.events.length){el.innerHTML='<div class="empty">Noch keine Ereignisse dieser Sitzung</div>';return;}el.innerHTML=state.events.slice().reverse().map(x=>`<div class="event"><div><b>${safe(x.type)}</b><span>${safe(x.time)} · #${x.sequence} · ${safe(JSON.stringify(x.details).slice(0,115))}</span></div><span class="event-state">${safe(x.decision)}</span></div>`).join('');}
  function labels(){ $('gate1Label').textContent=state.gate1; $('gate2Label').textContent=state.gate2; $('readbackLabel').textContent=state.readback; $('statusMain').textContent=state.gate1==='ALLOW'?'GEOMETRY ADMITTED':'AWAITING ADMISSION'; $('g1bar').className='bar'+(state.gate1==='ALLOW'?' good':''); $('connectedState').textContent=state.connected?'Drucker: verbunden':'Drucker nicht verbunden';}
  document.querySelectorAll('.tabs button').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.pane').forEach(x=>x.classList.remove('active'));btn.classList.add('active');$(btn.dataset.tab).classList.add('active');if(btn.dataset.tab==='studio')draw();}));
  $('setCase').onclick=async()=>{const id=$('caseId').value.trim();if(!/^[a-zA-Z0-9_-]{0,48}$/.test(id)){show('Fallkennung: nur Buchstaben, Ziffern, _ und -');return;}state.caseId=id;await log('CASE_CONTEXT','OBSERVED',{pseudonymPresent:Boolean(id)});show('Fallkennung übernommen (nur im RAM).');};
  async function parseSTL(file){if(!file || file.size>25*1024*1024 || file.size<30)throw Error('Nur STL-Dateien bis 25 MB und mindestens 30 Bytes.');const buf=await file.arrayBuffer();const dv=new DataView(buf);let vertices=[],triangles=0,degenerate=0,invalid=0;let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    const update=(a,b,c)=>{const vals=[a,b,c];if(!vals.every(Number.isFinite)){invalid++;return;}for(let j=0;j<3;j++){min[j]=Math.min(min[j],vals[j]);max[j]=Math.max(max[j],vals[j]);}};
    const binary=buf.byteLength>=84 && 84+dv.getUint32(80,true)*50===buf.byteLength;
    if(binary){triangles=dv.getUint32(80,true);if(triangles>500000)throw Error('Modell zu groß.');const stride=Math.max(1,Math.ceil(triangles/($('renderQuality')?.value==='ultra'?44000:22000)));for(let i=0;i<triangles;i++){const start=84+i*50,coords=[];for(let v=0;v<3;v++){const p=start+12+v*12,xyz=[dv.getFloat32(p,true),dv.getFloat32(p+4,true),dv.getFloat32(p+8,true)];update(...xyz);coords.push(xyz);}if(i<25000 && area2(...coords)<1e-18)degenerate++;if(i%stride===0)vertices.push(coords);}}
    else{const txt=new TextDecoder('utf-8',{fatal:false}).decode(buf);if(!/^\s*solid\b/i.test(txt))throw Error('Ungültiger STL-Header.');const regex=/\bvertex\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/ig;let match,seq=[],count=0;while((match=regex.exec(txt))!==null){if(++count>1500000)throw Error('Zu viele Eckpunkte.');const xyz=[Number(match[1]),Number(match[2]),Number(match[3])];update(...xyz);seq.push(xyz);if(seq.length===3){if(triangles<25000 && area2(...seq)<1e-18)degenerate++;if(triangles%Math.max(1,Math.ceil(count/72000))===0 && vertices.length<44000)vertices.push(seq);triangles++;seq=[];}}if(seq.length)invalid++;}
    if(triangles===0||!vertices.length)throw Error('STL enthält keine auswertbaren Dreiecke.');if(min.some(x=>!Number.isFinite(x))||max.some(x=>!Number.isFinite(x)))throw Error('STL enthält unzulässige Koordinaten.');const dims=max.map((v,i)=>v-min[i]);const good=invalid===0&&dims.every(x=>x>0)&&degenerate===0;
    return {name:file.name.replace(/[<>]/g,''),sha:await digest(buf),triangles,invalid,degenerate,bounds:dims,min,max,vertices,ok:good,binary};
  }
  function area2(a,b,c){let x=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],y=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];return Math.hypot(x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]);}
  async function loadFile(file){try{state.model=null;state.gate1='UNKNOWN';labels();show('Modell wird lokal geprüft …');const m=await parseSTL(file);state.model=m;state.mesh=m.vertices;state.angleY=.65;state.angleX=-.4;state.zoom=1;$('fileName').textContent=m.name;$('triCount').textContent=m.triangles.toLocaleString('de-DE');$('bounds').textContent=m.bounds.map(x=>x.toFixed(2)).join(' × ')+' [STL-Einheiten]';$('geometryState').textContent=m.ok?'Technisch plausibel':'Auffälligkeiten';$('modelHash').textContent=m.sha.slice(0,28)+'…';await log('STL_IMPORT',m.ok?'OBSERVED':'DELAY',{fileBytes:file.size,triangles:m.triangles,invalid:m.invalid,degenerateSample:m.degenerate,sha256:m.sha});draw();show('STL nur lokal geladen. Gate 1 noch ausstehend.');}catch(e){await log('STL_IMPORT','BLOCK',{error:String(e.message).slice(0,140)});show(e.message);}}
  $('stlFile').onchange=e=>{const file=e.target.files?.[0];if(file)loadFile(file);e.target.value='';};
  const cube=[[[ -1,-1,-1],[1,-1,-1],[1,1,-1]], [[-1,-1,-1],[1,1,-1],[-1,1,-1]], [[-1,-1,1],[1,1,1],[1,-1,1]],[[-1,-1,1],[-1,1,1],[1,1,1]], [[-1,-1,-1],[-1,-1,1],[1,-1,1]],[[-1,-1,-1],[1,-1,1],[1,-1,-1]], [[-1,1,-1],[1,1,-1],[1,1,1]],[[-1,1,-1],[1,1,1],[-1,1,1]], [[1,-1,-1],[1,-1,1],[1,1,1]],[[1,-1,-1],[1,1,1],[1,1,-1]],[[-1,-1,-1],[-1,1,1],[-1,-1,1]],[[-1,-1,-1],[-1,1,-1],[-1,1,1]]];
  $('demo').onclick=async()=>{state.model={name:'DEMO_WUERFEL.stl',sha:'synthetic-no-file',triangles:12,invalid:0,degenerate:0,bounds:[2,2,2],min:[-1,-1,-1],max:[1,1,1],vertices:cube,ok:true,synthetic:true};state.mesh=cube;$('fileName').textContent='DEMO (nicht druckbar)';$('triCount').textContent='12';$('bounds').textContent='2 × 2 × 2 [synthetisch]';$('geometryState').textContent='Demo / nicht klinisch';$('modelHash').textContent='SYNTHETIC';state.gate1='UNKNOWN';labels();await log('DEMO_MODEL','OBSERVED',{synthetic:true});draw();};
  $('reset').onclick=()=>{state.angleX=-.4;state.angleY=.55;state.zoom=1;draw();};
  const canvas=$('mesh'),ctx=canvas.getContext('2d');
  const QUALITY={standard:1,detail:2,ultra:4};let renderScheduled=false,interactivePreview=false;
  function resizeCanvas(interactive=false,forceUltra=false){
    const rect=canvas.getBoundingClientRect();
    const cssW=Math.max(480,rect.width||780),cssH=Math.max(310,rect.height||500);
    const quality=forceUltra?'ultra':$('renderQuality')?.value||'detail';
    const ratio=(interactive?1:QUALITY[quality]||2);
    const factor=Math.min(ratio,3840/cssW,2160/cssH);
    const w=Math.max(480,Math.round(cssW*factor)),h=Math.max(310,Math.round(cssH*factor));
    if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
    return {w,h};
  }
  function scheduleDraw(interactive=false){
    interactivePreview=interactivePreview||interactive;
    if(renderScheduled)return;
    renderScheduled=true;requestAnimationFrame(()=>{
      renderScheduled=false;const fast=interactivePreview;interactivePreview=false;draw(fast);
    });
  }
  function draw(interactive=false){if(!canvas)return;resizeCanvas(interactive);const w=canvas.width,h=canvas.height;ctx.fillStyle='#e7faff';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#c4e9f2';for(let i=0;i<16;i++){let x=i*w/16;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}const m=state.model;if(!m){ctx.textAlign='center';ctx.fillStyle='#376d8b';ctx.font='18px sans-serif';ctx.fillText('STL MODELL ÖFFNEN',w/2,h/2);ctx.font='12px sans-serif';ctx.fillText('3D-Geometrie bleibt auf dem Gerät',w/2,h/2+30);return;}let center=m.min.map((x,i)=>(x+m.max[i])/2),size=Math.max(...m.bounds,1),scale=Math.min(w,h)*.62/size*state.zoom;const ax=state.angleX,ay=state.angleY,cx=Math.cos(ax),sx=Math.sin(ax),cy=Math.cos(ay),sy=Math.sin(ay);const project=v=>{let x=v[0]-center[0],y=v[1]-center[1],z=v[2]-center[2],p=x*cy+z*sy,q=-x*sy+z*cy,r=y*cx-q*sx,t=y*sx+q*cx;return [w/2+p*scale,h/2-r*scale,t];};const detail=interactive?Math.min(9000,state.mesh.length):state.mesh.length,step=Math.max(1,Math.ceil(state.mesh.length/detail));
   const projected=state.mesh.filter((_,i)=>i%step===0).map(tr=>tr.map(project));projected.sort((a,b)=>((a[0][2]+a[1][2]+a[2][2])-(b[0][2]+b[1][2]+b[2][2])));for(const tr of projected){let aa=tr[0],bb=tr[1],cc=tr[2];const cross=(bb[0]-aa[0])*(cc[1]-aa[1])-(bb[1]-aa[1])*(cc[0]-aa[0]);const light=Math.max(.15,Math.min(.92,.58+cross/(scale*scale*21)));ctx.beginPath();ctx.moveTo(aa[0],aa[1]);ctx.lineTo(bb[0],bb[1]);ctx.lineTo(cc[0],cc[1]);ctx.closePath();ctx.fillStyle=`rgba(${Math.round(165+light*90)},${Math.round(198+light*56)},${Math.round(219+light*36)},.97)`;ctx.fill();ctx.strokeStyle='rgba(33,100,146,.19)';ctx.lineWidth=interactive?.25:.48;ctx.stroke();}ctx.fillStyle='#27668c';ctx.font='11px sans-serif';ctx.textAlign='left';ctx.fillText(`${m.synthetic?'SYNTHETIC DEMO':'LOCAL STL'}  · ${m.triangles.toLocaleString('de-DE')} triangles`,18,h-18);}
  let dragging=false,px=0,py=0;canvas.addEventListener('pointerdown',e=>{dragging=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!dragging)return;state.angleY+=(e.clientX-px)*.012;state.angleX+=(e.clientY-py)*.012;px=e.clientX;py=e.clientY;scheduleDraw(true);});canvas.addEventListener('pointerup',()=>{dragging=false;scheduleDraw();});canvas.addEventListener('pointercancel',()=>{dragging=false;scheduleDraw();});canvas.addEventListener('wheel',e=>{e.preventDefault();state.zoom=Math.max(.15,Math.min(7,state.zoom*(e.deltaY>0?.9:1.1)));scheduleDraw(true);},{passive:false});
  $('renderQuality').onchange=()=>scheduleDraw();
  $('export4k').onclick=()=>{
    const selected=$('renderQuality').value;
    $('renderQuality').value='ultra';
    draw(false);
    try{const a=document.createElement('a');a.download='PIGA-ORTHO-3D-'+
      (state.model?.synthetic?'SYNTHETIC':'TECHNICAL')+'.png';a.href=canvas.toDataURL('image/png');a.click();
      show('HiDPI-Modellansicht exportiert. Quelle und STL-Einheit bestimmen die Detailgenauigkeit.');
    }catch(e){show('Bildexport nicht möglich: '+String(e.message||e))}
    finally{$('renderQuality').value=selected;setTimeout(()=>scheduleDraw(),50)}
  };
  if('ResizeObserver' in window){
    const observer=new ResizeObserver(()=>scheduleDraw());
    observer.observe(canvas);
  }
  $('runG1').onclick=async()=>{const m=state.model;if(!m){state.gate1='UNKNOWN';$('g1Reason').textContent='UNKNOWN · Keine Geometrie vorhanden.';}else if(m.synthetic){state.gate1='DELAY';$('g1Reason').textContent='DELAY · Demo-Modell ist kein klinischer oder druckbarer Datensatz.';}else if(!m.ok){state.gate1='DELAY';$('g1Reason').textContent=`DELAY · Auffälligkeiten: ${m.invalid} Koordinatenfehler, ${m.degenerate} Degenerate (Probe).`;}else{state.gate1='ALLOW';$('g1Reason').textContent='ALLOW · Nur technische STL-Formprüfung. Weder klinische Maßhaltigkeit noch Druckeignung bestätigt.';}await log('GATE_1',state.gate1,{purpose:'technical-stl-viewer',clinicalAuthority:false});labels();show('Gate 1: '+state.gate1);};
  function localOrigin(input){let url;try{url=new URL(input);}catch{throw Error('Ungültige Serveradresse.');}if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('Nur http(s)://IP:Port ohne Pfad, Login oder Parameter.');const host=url.hostname.replace(/^\[|\]$/g,'');const parts=host.split('.').map(Number);const ipv4=parts.length===4&&parts.every((p,i)=>Number.isInteger(p)&&p>=0&&p<=255&&String(p)===host.split('.')[i]);const local=ipv4 && (parts[0]===10 || parts[0]===192&&parts[1]===168 || parts[0]===172&&parts[1]>=16&&parts[1]<=31 || parts[0]===127);if(!local)throw Error('Nur explizite private IPv4-Adressen zulässig (kein Internetserver).');return url.origin;}
  const nativeRequests=new Map();
  window.__pigaBridgeReceive=(id,result)=>{const pending=nativeRequests.get(id);if(!pending)return;nativeRequests.delete(id);try{const r=JSON.parse(result);if(!r.ok)pending.reject(Error(String(r.error||'Native request failed')));else pending.resolve(r.data??null);}catch(e){pending.reject(e);}};
  async function api(method,path,payload){
    if(!state.host||(!state.key&&!state.nativeReady))throw Error('Drucker nicht verbunden.');
    if(window.PigaNative && state.nativeReady){const id=crypto.randomUUID();return new Promise((resolve,reject)=>{nativeRequests.set(id,{resolve,reject});try{window.PigaNative.request(id,method,path,payload?JSON.stringify(payload):'');}catch(e){nativeRequests.delete(id);reject(e);}setTimeout(()=>{if(nativeRequests.has(id)){nativeRequests.delete(id);reject(Error('Native Anfrage zeitüberschritten: UNKNOWN'));}},15000);});}
    const response=await fetch(state.host+path,{method,mode:'cors',credentials:'omit',redirect:'error',cache:'no-store',headers:{'X-Api-Key':state.key,...(payload?{'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(9000)});
    if(!response.ok)throw Error('API HTTP '+response.status);return response.status===204?null:await response.json();
  }
  $('connect').onclick=async()=>{state.connected=false;state.key='';state.host='';state.nativeReady=false;labels();try{if(!$('authorityCheck').checked)throw Error('Zuerst Betreiberberechtigung bestätigen.');const origin=localOrigin($('printerUrl').value.trim());const key=$('apiKey').value.trim();if(key.length<8||key.length>200)throw Error('API-Schlüssel fehlt oder ist unplausibel.');state.host=origin;state.key=key;state.nativeReady=false;if(window.PigaNative){if(!window.PigaNative.configure(origin,key))throw Error('Native Druckeradapter hat Verbindung verweigert.');state.nativeReady=true;state.key='';$('apiKey').value='';}const data=await api('GET','/api/version');const s=await api('GET','/api/job');state.connected=true;state.printer=data;state.printerStatus=s;$('printerName').textContent=data?.server||'OctoPrint';updateJob(s);await log('PRINTER_CONNECT','OBSERVED',{origin,apiVersion:data?.api??null});labels();show('OctoPrint-Verbindung erfolgreich.');}catch(e){state.connected=false;state.key='';state.host='';state.nativeReady=false;state.printerStatus=null;await log('PRINTER_CONNECT','UNKNOWN',{reason:String(e.message).slice(0,140)});labels();show('Verbindung nicht bestätigt: '+e.message);}};
  function updateJob(s){$('printerState').textContent=s?.state||'UNKNOWN';$('jobName').textContent=s?.job?.file?.name||'Nicht ausgewählt';$('lastReadback').textContent=iso();}
  async function getJob(){const data=await api('GET','/api/job');state.printerStatus=data;updateJob(data);return data;}
  $('refreshPrinter').onclick=async()=>{try{const s=await getJob();await log('PRINTER_READBACK','OBSERVED',{state:s.state,file:s.job?.file?.name||null});show('Gerätestatus gelesen.');}catch(e){state.readback='UNKNOWN';await log('PRINTER_READBACK','UNKNOWN',{error:e.message});show('Status unklar: '+e.message);}labels();};
  async function command(op){let nonce=crypto.randomUUID(),pre,jobFile=null;state.gate2='BLOCK';state.readback='UNKNOWN';labels();try{
      if(!state.auditHealthy)throw Error('Auditintegrität nicht verfügbar – Aktion gesperrt.');if(!state.connected||(!state.key&&!state.nativeReady)||!state.host)throw Error('Keine bestätigte Sitzung.');if(!$('authorityCheck').checked||!$('operatorCheck').checked)throw Error('Autorität / konkrete Aktion nicht bestätigt.');if(op==='start'&&!$('qualityCheck').checked)throw Error('Material-, Slicer-, Datei- und Zuordnungscheck fehlt.');
      pre=await getJob();jobFile=pre?.job?.file?.name||'';if(op==='start'&&(!/\.g(co|code)$/i.test(jobFile)||!['Operational','Ready'].includes(pre.state)))throw Error('Kein freigegebenes ausgewähltes G-Code-Programm im Bereit-Zustand.');if(op==='pause'&&pre.state!=='Printing')throw Error('Pausieren nur während Printing.');if(op==='cancel'&&!['Printing','Paused'].includes(pre.state))throw Error('Abbruch nur bei aktivem Druck.');
      if(!confirm(`PIGA Gate 2: ${op.toUpperCase()} am Gerät ${state.host}?\nJob: ${jobFile||'n/a'}\nDiese Aktion wird genau einmal gesendet.`)){await log('ACTION_WITHDRAWN','BLOCK',{op});return;}
      state.gate2='ALLOW';labels();await log('GATE_2','ALLOW',{op,nonce,host:state.host,jobFile,preState:pre.state,operatorConfirmed:true});
      if(!state.auditHealthy)throw Error('Evidenzprotokoll fehlgeschlagen – keine externe Ausführung.');
      /* One authorization -> one request. Never auto retry an ambiguous external effect. */
      const payload=op==='pause'?{command:'pause',action:'pause'}:{command:op};await api('POST','/api/job',payload);
      await log('ACTION_SUBMITTED','OBSERVED',{op,nonce,jobFile});const after=await getJob();let verified=(op==='start'&&after.state==='Printing'&&after.job?.file?.name===jobFile)||(op==='pause'&&after.state==='Paused')||(op==='cancel'&&!['Printing','Paused'].includes(after.state));state.readback=verified?'OBSERVED':'UNKNOWN';await log('A7SEM_REVERSE',state.readback,{op,nonce,before:pre.state,after:after.state,fileMatches:after.job?.file?.name===jobFile});show(verified?'Aktion durch Gerätestatus bestätigt.':'Keine eindeutige Wirkung bestätigt. Bitte manuell prüfen.');
    }catch(e){state.readback='UNKNOWN';await log('ACTION_OR_RECHECK','UNKNOWN',{op,nonce,error:String(e.message).slice(0,150)});show('BLOCK/UNKNOWN: '+e.message+' · Kein automatischer Retry.');}finally{state.gate2='BLOCK';$('operatorCheck').checked=false;labels();}}
  $('printStart').onclick=()=>command('start');$('printPause').onclick=()=>command('pause');$('printCancel').onclick=()=>command('cancel');
  $('printEvidence').onclick=async()=>{
    if(!state.auditHealthy){show('Prüfakte gesperrt: Auditfehler.');return;}
    await log('REPORT_PREPARED','OBSERVED',{printable:true,clinicalApproved:false,automaticPrinterAction:false});
    await auditQueue;
    if(!state.auditHealthy){show('Prüfakte gesperrt: fehlende Evidenz.');return;}
    const m=state.model;
    const report={schema:'piga-ortho-report-input.v1',exportedAt:iso(),caseId:state.caseId||null,
      gate1:state.gate1,gate2:'BLOCK',readback:state.readback,unitVerified:false,
      clinicalApproved:false,autonomousPhysicalActions:false,
      model:m?{name:m.name,sha256:m.sha,triangles:m.triangles,bounds:m.bounds,
        invalid:m.invalid,degenerateSample:m.degenerate,synthetic:!!m.synthetic}:null,
      events:state.events,terminalSha256:state.chain};
    try{sessionStorage.setItem('piga-ortho-report-once',JSON.stringify(report));location.assign('./report.html');}
    catch(e){show('Übergabe fehlgeschlagen: JSON exportieren und in der Prüfakte laden.');}
  };
  $('exportAudit').onclick=async()=>{await log('AUDIT_EXPORT','OBSERVED',{eventCountBeforeExport:state.events.length});await auditQueue;const exportFile={schema:'piga-ortho-glassbox-export.v1',exportedAt:iso(),integrity:'untrusted-local-sha256-chain-not-a-digital-signature',gate1:state.gate1,gate2:'BLOCK',readback:state.readback,events:state.events,terminalSha256:state.chain};if(window.PigaNative && typeof window.PigaNative.exportJson==='function'){window.PigaNative.exportJson(JSON.stringify(exportFile,null,2));show('Android-Dateiauswahl für Glassbox-Journal geöffnet.');return;}const blob=new Blob([JSON.stringify(exportFile,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='PIGA_ORTHO_GLASSBOX_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000);show('Glassbox-Journal exportiert.');};
  $('clearAudit').onclick=async()=>{if(!confirm('Sitzungsprotokoll zurücksetzen? Vorher exportieren, falls gewünscht.'))return;await auditQueue;state.events=[];state.chain='GENESIS';state.auditHealthy=true;await log('SESSION_RESET','OBSERVED',{newSession:true});show('Neue lokale Sitzung.');};
  $('loopStart').onclick=async()=>{if(state.cycle)return;state.cycle=true;state.stop=false;const max=Number($('maxCycles').value);$('loopState').textContent='RUNNING';await log('FINITE_INFINITE_START','OBSERVED',{maxCycles:max,automaticActions:false});for(let i=1;i<=max&&!state.stop;i++){const decision=state.model?.ok?'OBSERVED':'UNKNOWN';await log('FINITE_WORKER_CYCLE',decision,{cycle:i,geometryObserved:!!state.model?.ok,printerEffect:'NONE',authorisedActions:0,reverse:'NO_EXTERNAL_EFFECT'});$('loopProgress').textContent=`${i} / ${max}`;await new Promise(r=>setTimeout(r,130));}const result=state.stop?'STOPPED':'COMPLETED';$('loopState').textContent=result;await log('FINITE_INFINITE_RESULT','OBSERVED',{status:result,externalEffects:0});state.cycle=false;show(result+' – keine externe Aktion ausgeführt.');};
  $('loopStop').onclick=()=>{state.stop=true;show('Stoppsignal gesetzt.');};
  addEventListener('offline',()=>{$('offlineState').textContent='Gerät offline · lokale App nutzbar';});addEventListener('online',()=>{$('offlineState').textContent='Lokale Verarbeitung aktiv';});
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{}));
  function activateRequestedSection(){
    const name=location.hash.slice(1);
    if(!['studio','printer','governance','evidence','loop','about'].includes(name))return;
    const btn=document.querySelector('.tabs button[data-tab="'+name+'"]');
    if(btn)btn.click();
  }
  window.addEventListener('hashchange',activateRequestedSection);
  activateRequestedSection();
  // Controlled, one-time scanner test handoff. Synthetic STL only; never persists patient data.
  async function consumeDeviceDemo(){
    let raw=null;
    try{raw=sessionStorage.getItem('piga-ortho-demo-stl-once');sessionStorage.removeItem('piga-ortho-demo-stl-once');}
    catch{return;}
    if(!raw||raw.length>28000||!/^[A-Za-z0-9+/=]+$/.test(raw))return;
    try{
      const bin=atob(raw);if(bin.length>20000||bin.length<84)return;
      const bytes=new Uint8Array(bin.length);for(let k=0;k<bin.length;k++)bytes[k]=bin.charCodeAt(k);
      await loadFile(new File([bytes],'PIGA_DEMO_ZAHNBOGEN_SYNTHETISCH.stl',{type:'model/stl'}));
      show('Synthetisches Scanner-Testmodell übernommen. Keine klinische Nutzung.');
    }catch{show('Demoimport aus Geräte-Center fehlgeschlagen.');}
  }
  consumeDeviceDemo();
  labels();draw();log('SESSION_INITIALIZED','OBSERVED',{version:'0.2.0',mode:'technical-evaluation',clinicalApproved:false});
})();
