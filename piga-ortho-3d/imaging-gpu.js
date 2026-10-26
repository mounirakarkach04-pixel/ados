'use strict';
/* Purely geometric GPU STL viewer. 4K output is conditional on renderbuffer size.
   No body/medical semantics, no printer effect, no network, no permanent files. */
(()=>{
 const canvas=document.getElementById('jaw4kCanvas'),box=document.getElementById('jaw4kStatus');
 if(!canvas||!box)return;
 const status=(m)=>{box.textContent=m};
 const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,preserveDrawingBuffer:true})||
  canvas.getContext('webgl',{antialias:true,alpha:false,preserveDrawingBuffer:true});
 if(!gl){status('GPU/WebGL wird in diesem Browser nicht unterstützt. Der bisherige STL-Viewer bleibt verfügbar.');return;}
 const makeShader=(kind,text)=>{
  const s=gl.createShader(kind);gl.shaderSource(s,text);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('GPU shader: '+gl.getShaderInfoLog(s));
  return s;
 };
 let program;
 try{
  const vs=makeShader(gl.VERTEX_SHADER,
   'attribute vec3 aPosition;attribute vec3 aNormal;uniform vec3 uCenter;uniform float uScale;uniform vec2 uRotate;uniform float uZoom;varying vec3 vNormal;varying vec3 vView;void main(){vec3 p=(aPosition-uCenter)*uScale;float ay=uRotate.x,ax=uRotate.y;mat3 ry=mat3(cos(ay),0.0,-sin(ay),0.0,1.0,0.0,sin(ay),0.0,cos(ay));mat3 rx=mat3(1.0,0.0,0.0,0.0,cos(ax),sin(ax),0.0,-sin(ax),cos(ax));mat3 r=rx*ry;vec3 q=r*p;gl_Position=vec4(q.xy*uZoom,q.z*0.15,1.0);vNormal=normalize(r*aNormal);vView=q;}');
  const fs=makeShader(gl.FRAGMENT_SHADER,
   'precision mediump float;uniform vec3 uColor;varying vec3 vNormal;varying vec3 vView;void main(){vec3 n=normalize(vNormal);vec3 light=normalize(vec3(0.4,0.8,1.0));float diffuse=abs(dot(n,light));float rim=pow(1.0-abs(n.z),2.0);vec3 enamel=mix(uColor,vec3(1.0,1.0,1.0),diffuse*0.65);enamel+=vec3(0.06,0.15,0.2)*rim;gl_FragColor=vec4(min(enamel,vec3(1.0)),1.0);}');
  program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('GPU program: '+gl.getProgramInfoLog(program));
 }catch(e){status('GPU-Rendering nicht verfügbar: '+String(e.message).slice(0,180));return;}
 const loc={pos:gl.getAttribLocation(program,'aPosition'),normal:gl.getAttribLocation(program,'aNormal'),
 center:gl.getUniformLocation(program,'uCenter'),scale:gl.getUniformLocation(program,'uScale'),
 rotate:gl.getUniformLocation(program,'uRotate'),zoom:gl.getUniformLocation(program,'uZoom'),color:gl.getUniformLocation(program,'uColor')};
 const models=[null,null],inputNames=['upperStl','lowerStl'];let rx=-0.32,ry=0.55,zoom=.9,drag=null;
 function decodeSTL(buffer){
  if(buffer.byteLength<84||buffer.byteLength>45*1024*1024)throw Error('GPU-STL ist zu klein oder größer als 45 MiB.');
  const d=new DataView(buffer),n=buffer.byteLength;
  let arr;
  if(n>=84&&84+d.getUint32(80,true)*50===n){
   const count=d.getUint32(80,true);
   if(count<1||count>420000)throw Error('GPU-STL Dreiecksgrenze überschritten (420.000).');
   arr=new Float32Array(count*18);
   for(let t=0;t<count;t++){
    const pos=84+t*50+12,k=t*18;let points=[];
    for(let p=0;p<3;p++)points.push([0,1,2].map(j=>d.getFloat32(pos+p*12+j*4,true)));
    if(points.some(p=>p.some(v=>!Number.isFinite(v))))throw Error('Unendliche/nicht lesbare STL-Koordinate');
    const a=points[0],b=points[1],c=points[2],x=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],y=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    const norm=[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
    const length=Math.hypot(...norm)||1;for(let j=0;j<3;j++)norm[j]/=length;
    for(let j=0;j<3;j++){arr.set(points[j],k+j*6);arr.set(norm,k+j*6+3);}
   }
   return {array:arr,count};
  }
  const txt=new TextDecoder().decode(buffer);
  if(!/^\s*solid\b/i.test(txt))throw Error('Nicht unterstütztes STL-Format.');
  const matches=[...txt.matchAll(/\bvertex\s+([+\-\deE.]+)\s+([+\-\deE.]+)\s+([+\-\deE.]+)/g)];
  if(!matches.length||matches.length%3||matches.length>420000*3)throw Error('Unvollständige ASCII-STL.');
  arr=new Float32Array(matches.length*6);
  for(let t=0;t<matches.length;t+=3){
   const points=matches.slice(t,t+3).map(m=>m.slice(1).map(Number));
   if(points.some(p=>p.some(x=>!Number.isFinite(x))))throw Error('STL-Koordinate ungültig.');
   const [a,b,c]=points,x=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],y=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
   const norm=[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
   const length=Math.hypot(...norm)||1;for(let j=0;j<3;j++)norm[j]/=length;
   for(let j=0;j<3;j++){arr.set(points[j],(t+j)*6);arr.set(norm,(t+j)*6+3);}
  }
  return {array:arr,count:matches.length/3};
 }
 function addMesh(buffer,slot){
  const {array,count}=decodeSTL(buffer),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<array.length;i+=6)for(let k=0;k<3;k++){min[k]=Math.min(min[k],array[i+k]);max[k]=Math.max(max[k],array[i+k]);}
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,array,gl.STATIC_DRAW);
  if(!gl.getError()&&models[slot]?.buffer)gl.deleteBuffer(models[slot].buffer);
  models[slot]={buffer:vb,count:count*3,min,max};
  const triangles=models.reduce((n,m)=>n+(m?.count||0)/3,0);
  status('GPU bereit · '+triangles.toLocaleString('de-DE')+' echte STL-Dreiecke · 4K bei geeigneter GPU möglich. Keine klinische Prüfung.');
  draw();
 }
 function draw(){
  const w=canvas.width,h=canvas.height;
  gl.viewport(0,0,w,h);gl.clearColor(.96,.991,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  gl.useProgram(program);
  let mn=[Infinity,Infinity,Infinity],mx=[-Infinity,-Infinity,-Infinity];
  for(const m of models)if(m)for(let j=0;j<3;j++){mn[j]=Math.min(mn[j],m.min[j]);mx[j]=Math.max(mx[j],m.max[j]);}
  if(!Number.isFinite(mn[0]))return;
  const center=mn.map((x,i)=>(x+mx[i])/2);
  const extent=Math.max(...mx.map((x,i)=>x-mn[i]),1e-6);
  gl.uniform3fv(loc.center,center);gl.uniform1f(loc.scale,1.75/extent);gl.uniform2f(loc.rotate,ry,rx);
  gl.uniform1f(loc.zoom,zoom*Math.min(1,h/w*1.65));
  for(let i=0;i<models.length;i++){
   const m=models[i];if(!m)continue;
   gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);
   gl.enableVertexAttribArray(loc.pos);gl.vertexAttribPointer(loc.pos,3,gl.FLOAT,false,24,0);
   gl.enableVertexAttribArray(loc.normal);gl.vertexAttribPointer(loc.normal,3,gl.FLOAT,false,24,12);
   gl.uniform3fv(loc.color,i===0?[.38,.76,.94]:[.37,.91,.81]);
   gl.drawArrays(gl.TRIANGLES,0,m.count);
  }
 }
 async function load(event,slot){
  const file=event.target.files?.[0];if(!file)return;
  status('STL-Geometrie wird für den GPU-Viewer vorbereitet …');
  try{addMesh(await file.arrayBuffer(),slot);}
  catch(err){status('GPU-STL nicht darstellbar: '+String(err.message).slice(0,180));}
 }
 for(let i=0;i<2;i++)document.getElementById(inputNames[i])?.addEventListener('change',event=>{void load(event,i)});
 const pointerPos=e=>[e.clientX,e.clientY];
 canvas.addEventListener('pointerdown',e=>{drag=pointerPos(e);canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;ry+=(e.clientX-drag[0])*.009;rx+=(e.clientY-drag[1])*.009;drag=pointerPos(e);draw()});
 canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.2,Math.min(4,zoom*(e.deltaY>0?.92:1.08)));draw()},{passive:false});
 document.getElementById('jawReset')?.addEventListener('click',()=>{rx=-.32;ry=.55;zoom=.9;draw()});
 document.getElementById('jaw4kExport')?.addEventListener('click',()=>{
  if(!models.some(Boolean))return status('Zum Exportieren zuerst ein STL-Gebissmodell laden.');
  const limit=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
  if(limit<3840)return status('Diese GPU unterstützt keine vollständige 3840-Pixel-Ansicht; bitte Desktop-GPU benutzen.');
  const [oldW,oldH]=[canvas.width,canvas.height];
  try{
   canvas.width=3840;canvas.height=2160;draw();gl.finish();
   canvas.toBlob(blob=>{
    canvas.width=oldW;canvas.height=oldH;draw();
    if(!blob)return status('4K-PNG konnte nicht erzeugt werden.');
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;
    a.download='PIGA-ORTHO-GEOMETRY-3840x2160.png';document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    status('4K PNG (3840 × 2160) erstellt. Die anatomische Detailtreue bleibt von der importierten STL-Quelle abhängig.');
   },'image/png');
  }catch(err){canvas.width=oldW;canvas.height=oldH;draw();status('4K-Rendering vom Browser nicht freigegeben: '+String(err.message))}
 });
 const resize=()=>{
  if(!canvas.isConnected)return;
  const box=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
  if(!box.width||!box.height)return;
  const w=Math.min(3200,Math.max(320,Math.round(box.width*dpr))),h=Math.min(1800,Math.max(180,Math.round(box.height*dpr)));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  draw();
 };
 if(typeof ResizeObserver!=='undefined'){const ro=new ResizeObserver(resize);ro.observe(canvas)}else window.addEventListener('resize',resize);
 resize();status('GPU initialisiert · STL-Datei A/B auswählen. Kein Upload oder Gerätekommando.');
})();
