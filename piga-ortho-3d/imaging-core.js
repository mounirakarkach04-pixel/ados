'use strict';
/* PIGA ORTHO IMAGING — bounded local evaluation algorithms, no cloud, no clinical decisions.
   DICOM PS3.5: only native uncompressed Implicit/Explicit VR Little Endian mono pixel arrays.
   All patient-identifiable metadata deliberately discarded, not serialized or logged. */
window.PigaImaging=(()=>{
 const MAX_FILE=32*1024*1024,MAX_TOTAL_PIXELS=30_000_000;
 const dec=new TextDecoder();
 const fail=m=>{throw Error(m)};
 function parseDicom(input){
  const b=input instanceof ArrayBuffer?input:input.buffer;
  if(!(b instanceof ArrayBuffer)||b.byteLength<150||b.byteLength>MAX_FILE)fail('DICOM: Datei leer, zu groß oder nicht unterstützt (maximal 32 MiB).');
  const d=new DataView(b),v=new Uint8Array(b);
  if(dec.decode(v.subarray(128,132))!=='DICM')fail('DICOM-Part-10-Header (DICM) fehlt.');
  const str=(offset,length)=>dec.decode(v.subarray(offset,offset+length)).replace(/\0/g,'').trim();
  const longVR=new Set(['OB','OD','OF','OL','OV','OW','SQ','UC','UN','UR','UT','UV']);
  function tag(offset,explicit){
   if(offset+8>b.byteLength)fail('DICOM: unvollständiger Datensatz.');
   const group=d.getUint16(offset,true),element=d.getUint16(offset+2,true);
   let size,start,vr='';
   if(explicit){
    vr=str(offset+4,2);
    if(!/^[A-Z]{2}$/.test(vr))fail('DICOM: VR-Format beschädigt.');
    if(longVR.has(vr)){if(offset+12>b.byteLength)fail('DICOM: langer VR-Header unvollständig.');size=d.getUint32(offset+8,true);start=offset+12;}
    else{size=d.getUint16(offset+6,true);start=offset+8;}
   }else{size=d.getUint32(offset+4,true);start=offset+8;}
   if(size===0xffffffff)fail('DICOM: undefinierte Sequenzlänge / komprimiertes Pixel Data wird hier nicht unterstützt.');
   if(size>b.byteLength-start||size<0)fail('DICOM: Elementlänge außerhalb der Datei.');
   return {key:group.toString(16).padStart(4,'0')+element.toString(16).padStart(4,'0'),
    group,element,vr,size,start,next:start+size};
  }
  let pos=132,ts='1.2.840.10008.1.2.1',read=0;
  while(pos+8<=b.byteLength){
   const group=d.getUint16(pos,true);
   if(group!==2)break;
   const t=tag(pos,true);
   if(t.key==='00020010')ts=str(t.start,t.size);
   pos=t.next;if(++read>3000)fail('DICOM: zu viele Metadatenfelder.');
  }
  if(!['1.2.840.10008.1.2','1.2.840.10008.1.2.1'].includes(ts))
   fail('DICOM: Transfer-Syntax '+ts+' ist nicht unkomprimiertes Little Endian.');
  const explicit=ts==='1.2.840.10008.1.2.1';
  const fields={},numericUS=new Set(['00280002','00280008','00280010','00280011','00280100','00280101','00280102','00280103']);
  let pixels=null;
  for(let i=0;i<12000&&pos+8<=b.byteLength;i++){
   const t=tag(pos,explicit);pos=t.next;
   if(t.key==='7fe00010'){pixels=t;break;}
   if(['00280010','00280011','00280100','00280101','00280102','00280103','00280002'].includes(t.key)){
    if(t.size<2)fail('DICOM: numerisches Bildfeld leer.');
    fields[t.key]=d.getUint16(t.start,true);
   }else if(['00280008','00280004','00281052','00281053','00281050','00281051','00200013','00200032','00280030'].includes(t.key)){
    fields[t.key]=str(t.start,t.size);
   }
  }
  if(!pixels)fail('DICOM: kein nicht komprimiertes Pixel-Element gefunden.');
  const rows=fields['00280010'],cols=fields['00280011'];
  const bits=fields['00280100'],stored=fields['00280101']||bits,signed=fields['00280103']===1;
  const spp=fields['00280002']||1;
  const frames=Number((fields['00280008']||'1').split('\\')[0])||1;
  const photo=fields['00280004']||'MONOCHROME2';
  if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<1||cols<1||rows>4096||cols>4096)
   fail('DICOM: ungültige Bildauflösung.');
  if(![8,16].includes(bits)||stored>bits||stored<1||spp!==1||frames>256||frames<1
   ||!['MONOCHROME1','MONOCHROME2'].includes(photo))fail('DICOM: nur 8/16-Bit-Monochrombilder unterstützt.');
  if(rows*cols*frames>MAX_TOTAL_PIXELS)fail('DICOM: Bildvolumen überschreitet das lokale Sicherheitslimit.');
  const size=rows*cols*frames*(bits/8);
  if(pixels.size<size)fail('DICOM: Pixelarray unvollständig.');
  let slope=Number(fields['00281053']||'1'),intercept=Number(fields['00281052']||'0');
  if(!Number.isFinite(slope)||Math.abs(slope)>10000||!Number.isFinite(intercept))fail('DICOM: ungültige Skalierung.');
  const mask=(1<<Math.min(stored,16))-1, sign=1<<(stored-1),mod=1<<Math.min(stored,16);
  function pixel(index){
   if(index<0||index>=rows*cols*frames)return 0;
   let n=bits===8?v[pixels.start+index]:d.getUint16(pixels.start+2*index,true);
   if(stored<16)n&=mask;
   if(signed&&(n&sign))n-=mod;
   return n*slope+intercept;
  }
  let min=Infinity,max=-Infinity;
  const step=Math.max(1,Math.ceil(rows*cols*frames/240000));
  for(let i=0;i<rows*cols*frames;i+=step){const n=pixel(i);min=Math.min(min,n);max=Math.max(max,n);}
  const spacing=(fields['00280030']||'').split('\\').map(Number).filter(Number.isFinite);
  const position=(fields['00200032']||'').split('\\').map(Number);
  const instance=Number(fields['00200013']);
  return {rows,cols,frames,bits,stored,signed,photo,ts,slope,intercept,min,max,
   spacing:spacing.length===2&&spacing.every(x=>x>0)?spacing:null,
   z:position.length===3&&Number.isFinite(position[2])?position[2]:null,
   instance:Number.isFinite(instance)?instance:null,
   pixel,
   source:'DICOM Part-10, native grayscale only',
   caveat:'Auswertung rein technisch; keine validierte Hounsfield-Kalibrierung, anatomische Segmentierung oder Diagnose.'};
 }
 function grayscale(image,frame,windowCenter,windowWidth,threshold=null){
  if(frame<0||frame>=image.frames)fail('Bild-Frame außerhalb der Serie.');
  const {rows,cols}=image,arr=new Uint8ClampedArray(rows*cols*4);
  const width=Number(windowWidth),center=Number(windowCenter);
  if(!Number.isFinite(width)||width<=0||!Number.isFinite(center))fail('Ungültiges Grauwertfenster.');
  const lo=center-width/2;
  let selected=0;
  for(let i=0;i<rows*cols;i++){
   const v=image.pixel(frame*rows*cols+i),p=i*4;
   const n=Math.min(255,Math.max(0,Math.round((v-lo)/width*255)));
   const g=image.photo==='MONOCHROME1'?255-n:n;
   const mask=threshold!==null&&v>=threshold;
   arr[p]=mask?246:g;arr[p+1]=mask?172:g;arr[p+2]=mask?54:g;arr[p+3]=255;
   if(mask)selected++;
  }
  return {data:arr,width:cols,height:rows,selected,ratio:selected/(rows*cols)};
 }
 function parseStlSamples(buffer,limit=1800){
  if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<30||buffer.byteLength>25*1024*1024)
   fail('STL: Datei ungültig oder größer als 25 MiB.');
  const d=new DataView(buffer),points=[],arr=new Uint8Array(buffer);
  const binary=buffer.byteLength>=84&&84+d.getUint32(80,true)*50===buffer.byteLength;
  let triangleCount=0;
  if(binary){
   triangleCount=d.getUint32(80,true);
   if(triangleCount>500000)fail('STL: zu viele Dreiecke.');
   const step=Math.max(1,Math.ceil(triangleCount/(Math.floor(limit/3)||1)));
   for(let t=0;t<triangleCount;t+=step){
    const at=84+t*50+12;
    for(let j=0;j<3;j++){
     const p=[d.getFloat32(at+j*12,true),d.getFloat32(at+j*12+4,true),d.getFloat32(at+j*12+8,true)];
     if(p.some(x=>!Number.isFinite(x)))fail('STL: nicht-endliche Eckpunkte.');
     points.push(p);
    }
   }
  }else{
   const text=dec.decode(arr);
   if(!/^\s*solid\b/i.test(text))fail('STL: unrecognized file.');
   const lines=[...text.matchAll(/\bvertex\s+([-+\deE.]+)\s+([-+\deE.]+)\s+([-+\deE.]+)/g)];
   triangleCount=Math.floor(lines.length/3);
   const step=Math.max(1,Math.ceil(lines.length/limit));
   for(let i=0;i<lines.length;i+=step){
    const p=lines[i].slice(1).map(Number);
    if(p.length!==3||p.some(x=>!Number.isFinite(x)))fail('STL: ungültige Koordinaten.');
    points.push(p);
   }
  }
  if(!points.length)fail('STL: keine Punkte.');
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const p of points)for(let k=0;k<3;k++){min[k]=Math.min(min[k],p[k]);max[k]=Math.max(max[k],p[k]);}
  return {points:points.slice(0,limit),triangleCount,min,max,
   caveat:'Abtastung ohne Registrierungs-, Normalen-, oder Kollisionsprüfung. Einheiten des STL unbekannt.'};
 }
 function clearance(a,b){
  if(!a?.points?.length||!b?.points?.length)fail('Zwei STL-Modelle erforderlich.');
  if(a.points.length>2200||b.points.length>2200)fail('Abstandsprobe auf 2.200 Punkte je Modell beschränkt.');
  let best=Infinity,pa=null,pb=null;
  for(const x of a.points)for(const y of b.points){
   const sq=(x[0]-y[0])**2+(x[1]-y[1])**2+(x[2]-y[2])**2;
   if(sq<best){best=sq;pa=x;pb=y;}
  }
  return {distanceModelUnits:Math.sqrt(best),sampleCountA:a.points.length,sampleCountB:b.points.length,
   closestPoints:[pa,pb],status:'GEOMETRIC_PROXY_ONLY',registered:false,
   caution:'Nicht als Okklusionskontakt, Bisslage, mm-Messung oder Behandlungsempfehlung interpretieren. Modelle müssen extern registriert und kalibriert werden.'};
 }
 function staging(a,b,steps){
  const n=Number(steps);
  if(!Number.isInteger(n)||n<2||n>30)fail('Technische Zwischenstufen: 2 bis 30.');
  if(!a||!b||!a.min||!b.min)fail('Geometrie-Bounds fehlen.');
  const center=o=>o.min.map((m,i)=>(m+o.max[i])/2);
  const ca=center(a),cb=center(b),delta=ca.map((v,i)=>cb[i]-v);
  const distance=Math.hypot(...delta);
  const levels=Array.from({length:n+1},(_,i)=>{
   const fraction=i/n;
   return {index:i,fraction,translation:delta.map(d=>d*fraction)};
  });
  return {levels,delta,distanceModelUnits:distance,status:'SYNTHETIC_GEOMETRY_INTERPOLATION',
   caution:'Nur lineare Interpolation von STL-Modellzentren. KEINE Zahnbewegungsplanung, Wurzel-/Kraftanalyse, Aligner-Staging oder medizinische Eignung.'};
 }
 return {parseDicom,grayscale,parseStlSamples,clearance,staging};
})();
