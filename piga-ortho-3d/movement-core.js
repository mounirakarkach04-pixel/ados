/* PIGA ORTHO 3D | Dental motion research kernel 1.0
 * Deterministic geometry only. NO clinical inference, prescription, root simulation,
 * collision clearance claim, appliance design, or manufacturing approval.
 * All transforms are rigid, applied to independently segmented teeth.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.PigaMovementCore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const MAX_BYTES=36*1024*1024, MAX_TRIANGLES=600000, FDI=/^(1[1-8]|2[1-8]|3[1-8]|4[1-8])$/;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function assertFinite(v,label){if(v===null||v===undefined||typeof v==="boolean"||(typeof v==="string"&&v.trim()===""))throw Error(label+" darf nicht leer oder boolesch sein.");const n=Number(v);if(!Number.isFinite(n))throw Error(label+" muss endlich sein.");return n;}
function limits(plan){
  const p={};
  for(const k of ["x","y","z","rx","ry","rz"]){
    const v=assertFinite(plan[k]===undefined?0:plan[k],k),max=k[0]==="r"?45:20;
    if(Math.abs(v)>max)throw Error(k+": außerhalb des technischen Eingabebereichs (±"+max+").");
    p[k]=v;
  }
  return p;
}
function parseSTL(buffer){
  if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<84||buffer.byteLength>MAX_BYTES)throw Error("STL: ungültige Größe (maximal 36 MiB).");
  const view=new DataView(buffer),n=view.getUint32(80,true);
  let coords,triangles;
  if(n>0&&n<=MAX_TRIANGLES&&84+50*n===buffer.byteLength){
    triangles=n;coords=new Float32Array(n*9);let cursor=84,at=0;
    for(let t=0;t<n;t++,cursor+=50)for(let j=0;j<9;j++)coords[at++]=view.getFloat32(cursor+12+j*4,true);
  }else{
    const s=new TextDecoder().decode(buffer);
    if(!/^\s*solid(?:\s|$)/i.test(s)||!/facet\s+normal/i.test(s))throw Error("STL: unbekanntes oder beschädigtes Format.");
    const lines=s.match(/^\s*vertex\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*$/gim);
    if(!lines||lines.length%3||lines.length>MAX_TRIANGLES*3)throw Error("STL: unvollständige ASCII-Dreiecke.");
    triangles=lines.length/3;
    coords=new Float32Array(lines.length*3);
    lines.forEach((line,i)=>{const a=line.trim().split(/\s+/);for(let j=0;j<3;j++)coords[3*i+j]=Number(a[j+1]);});
  }
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  let degenerate=0;
  for(let i=0;i<coords.length;i+=9){
    for(let j=0;j<9;j++){const v=coords[i+j];if(!Number.isFinite(v)||Math.abs(v)>1e7)throw Error("STL: ungültige Koordinate.");min[j%3]=Math.min(min[j%3],v);max[j%3]=Math.max(max[j%3],v);}
    const ax=coords[i+3]-coords[i],ay=coords[i+4]-coords[i+1],az=coords[i+5]-coords[i+2],
      bx=coords[i+6]-coords[i],by=coords[i+7]-coords[i+1],bz=coords[i+8]-coords[i+2];
    if(Math.hypot(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx)<1e-8)degenerate++;
  }
  if(triangles<4)throw Error("STL: zu wenig Geometrie.");
  return {coords,triangles,degenerate,bounds:{min,max},pivot:min.map((v,i)=>(v+max[i])/2)};
}
function matrix(p){
  p=limits(p);const a=p.rx*Math.PI/180,b=p.ry*Math.PI/180,c=p.rz*Math.PI/180;
  const ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),cc=Math.cos(c),sc=Math.sin(c);
  return [cc*cb,cc*sb*sa-sc*ca,cc*sb*ca+sc*sa,
          sc*cb,sc*sb*sa+cc*ca,sc*sb*ca-cc*sa,
          -sb,cb*sa,cb*ca];
}
function atStage(p,stage,total){
  const count=assertFinite(total,"Stufenzahl"),idx=assertFinite(stage,"Stufe");
  if(!Number.isInteger(count)||!Number.isInteger(idx)||count<1||count>40||idx<0||idx>count)throw Error("Stufe ungültig (1–40).");
  const safe=limits(p),out={};for(const k of Object.keys(safe))out[k]=safe[k]*idx/count;return out;
}
function transform(source,p){
  const m=matrix(p),move=[p.x,p.y,p.z],v=source.coords,pivot=source.pivot;
  const result=new Float32Array(v.length);
  for(let i=0;i<v.length;i+=3){
    const x=v[i]-pivot[0],y=v[i+1]-pivot[1],z=v[i+2]-pivot[2];
    result[i]=m[0]*x+m[1]*y+m[2]*z+pivot[0]+move[0];
    result[i+1]=m[3]*x+m[4]*y+m[5]*z+pivot[1]+move[1];
    result[i+2]=m[6]*x+m[7]*y+m[8]*z+pivot[2]+move[2];
  }
  return result;
}
function bounds(coords){
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<coords.length;i++) {const d=i%3;min[d]=Math.min(min[d],coords[i]);max[d]=Math.max(max[d],coords[i]);}
  return {min,max};
}
function rotationAngle(p){const m=matrix(p);return Math.acos(clamp((m[0]+m[4]+m[8]-1)/2,-1,1))*180/Math.PI;}
function maxVertexDisplacement(source,p){
  const arr=transform(source,p),orig=source.coords;let maximum=0;
  for(let i=0;i<arr.length;i+=3)maximum=Math.max(maximum,Math.hypot(arr[i]-orig[i],arr[i+1]-orig[i+1],arr[i+2]-orig[i+2]));
  return maximum;
}
function writeSTL(coords,label){
  if(!coords.length||coords.length%9)throw Error("Export: unvollständige Dreiecke.");
  const tri=coords.length/9,out=new ArrayBuffer(84+50*tri),dv=new DataView(out);
  const header=new TextEncoder().encode("PIGA ORTHO - GEOMETRY RESEARCH ONLY - NOT PRINT READY - "+String(label).slice(0,16));
  new Uint8Array(out).set(header.slice(0,80));dv.setUint32(80,tri,true);
  for(let t=0;t<tri;t++){
    const i=t*9,o=84+t*50;
    const ax=coords[i+3]-coords[i],ay=coords[i+4]-coords[i+1],az=coords[i+5]-coords[i+2],
      bx=coords[i+6]-coords[i],by=coords[i+7]-coords[i+1],bz=coords[i+8]-coords[i+2];
    let nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;
    const size=Math.hypot(nx,ny,nz)||1;nx/=size;ny/=size;nz/=size;
    dv.setFloat32(o,nx,true);dv.setFloat32(o+4,ny,true);dv.setFloat32(o+8,nz,true);
    for(let j=0;j<9;j++)dv.setFloat32(o+12+j*4,coords[i+j],true);
    dv.setUint16(o+48,0,true);
  }
  return out;
}
function crc32(bytes){
  let c=0xffffffff;for(let i=0;i<bytes.length;i++){c^=bytes[i];for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}
  return(c^0xffffffff)>>>0;
}
function packZip(entries){
  // ZIP store (no compression), standard local headers, central directory + EOCD.
  // Max total 100 MiB and 512 entries to bound mobile memory use.
  if(entries.length<1||entries.length>512)throw Error("ZIP: Dateianzahl nicht zulässig.");
  let total=0;const normalized=entries.map(e=>{
    if(!/^[A-Za-z0-9_./\[\]-]{1,120}$/.test(e.name)||e.name.startsWith("/")||e.name.split("/").some(part=>part==="."||part===".."||!part))throw Error("ZIP: unsicherer Dateiname.");
    const name=new TextEncoder().encode(e.name),data=e.data instanceof ArrayBuffer?new Uint8Array(e.data):e.data;
    if(!(data instanceof Uint8Array))throw Error("ZIP: ungültige Daten.");
    total+=data.byteLength;if(total>100*1024*1024)throw Error("ZIP: 100 MiB überschritten.");
    return{name,data,crc:crc32(data)};
  });
  const locals=[],centrals=[];let offset=0;for(const e of normalized){
    const l=new Uint8Array(30+e.name.length+e.data.length),v=new DataView(l.buffer);
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(8,0,true);
    v.setUint32(14,e.crc,true);v.setUint32(18,e.data.length,true);v.setUint32(22,e.data.length,true);v.setUint16(26,e.name.length,true);
    l.set(e.name,30);l.set(e.data,30+e.name.length);locals.push(l);
    const c=new Uint8Array(46+e.name.length),cv=new DataView(c.buffer);
    cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);
    cv.setUint32(16,e.crc,true);cv.setUint32(20,e.data.length,true);cv.setUint32(24,e.data.length,true);
    cv.setUint16(28,e.name.length,true);cv.setUint32(42,offset,true);c.set(e.name,46);centrals.push(c);offset+=l.length;
  }
  const centralSize=centrals.reduce((s,c)=>s+c.length,0),out=new Uint8Array(offset+centralSize+22),dv=new DataView(out.buffer);
  let pos=0;for(const x of [...locals,...centrals]){out.set(x,pos);pos+=x.length;}
  dv.setUint32(pos,0x06054b50,true);dv.setUint16(pos+8,normalized.length,true);dv.setUint16(pos+10,normalized.length,true);
  dv.setUint32(pos+12,centralSize,true);dv.setUint32(pos+16,offset,true);
  return out.buffer;
}
function gate1(teeth,unitsConfirmed,stages){
  if(unitsConfirmed!==true)return{status:"BLOCK",reason:"STL-Koordinateneinheit mm nicht verifiziert."};
  if(!Number.isInteger(stages)||stages<1||stages>40)return{status:"BLOCK",reason:"Stufenzahl ungültig."};
  if(!teeth.length)return{status:"BLOCK",reason:"Keine einzeln segmentierten Zähne geladen."};
  const seen=new Set();
  for(const tooth of teeth){
    if(!FDI.test(tooth.fdi)||seen.has(tooth.fdi))return{status:"BLOCK",reason:"FDI-Zuordnung fehlt oder ist doppelt."};
    seen.add(tooth.fdi);
    if(!tooth.mesh||tooth.mesh.degenerate>0)return{status:"BLOCK",reason:"Degenerierte Dreiecke in Zahn "+tooth.fdi+"."};
    try{limits(tooth.plan)}catch(e){return{status:"BLOCK",reason:e.message};}
  }
  return{status:"PASS",reason:"Technische Geometrie und Eingabegrenzen geprüft. Keine klinische Eignung."};
}
return{MAX_BYTES,FDI,parseSTL,limits,matrix,atStage,transform,bounds,rotationAngle,maxVertexDisplacement,writeSTL,packZip,gate1};
});
