'use strict';
/* PIGA dental orientation specimen, NOT a scanned jaw, anatomical reconstruction or treatment model.
 * Lightweight mesh uses 28 differentiated crowns and gingival collars with per-face materials.
 * Genuine patient/clinical geometry must come from a clinically checked STL/DICOM workflow.
 */
window.PigaDentalAnatomy=(()=>{
 const TWO=Math.PI*2,SEG=18,RINGS=9;
 function build(){
  const vertices=[];
  const boundsMin=[Infinity,Infinity,Infinity],boundsMax=[-Infinity,-Infinity,-Infinity];
  const push=(a,b,c,material)=>{
   const tri=[a,b,c];tri.material=material;vertices.push(tri);
   for(const v of tri)for(let k=0;k<3;k++){
    boundsMin[k]=Math.min(boundsMin[k],v[k]);boundsMax[k]=Math.max(boundsMax[k],v[k]);
   }
  };
  function tooth(x,z,y,kind,upper,offset){
   const dims=kind===0?[2.75,3.8,7.2]:kind===1?[2.55,3.3,6.4]:
    kind===2?[3.1,3.4,7.7]:kind<5?[3.7,4.25,5.8]:[4.4,4.65,5.5];
   const [rw,rz,h]=dims;
   const orientation=offset*.092;
   const ang=(i)=>i/SEG*TWO;
   // Upper crowns point toward the centre of the bite; lower crowns point upward.
   const direction=upper?-1:1;
   function crownPoint(ring,i){
    const a=ang(i),t=ring/RINGS,side=Math.cos(a),front=Math.sin(a);
    const neck=0.75+0.25*Math.sin(Math.PI*t*.88),round=kind<3?1:0.88;
    const cuspCount=kind<2?2:kind===2?1:kind<5?2:4;
    const ridge=(kind===0||kind===1)?Math.pow(Math.abs(side),6)*.28:
     (Math.cos(a*cuspCount)+1)*.18+(kind===2?0.6:0);
    const end=ring===RINGS?ridge:0;
    const ey=direction*(t*h-end);
    const xx=rw*side*neck*(1-.07*t)+x;
    const zz=rz*front*neck*(1-.04*t)+z;
    return [xx*Math.cos(orientation)-zz*Math.sin(orientation)+z*Math.sin(orientation),
     y+ey,
     zz*Math.cos(orientation)+(xx-x)*Math.sin(orientation)];
   }
   for(let ring=0;ring<RINGS;ring++){
    for(let i=0;i<SEG;i++){
     const j=(i+1)%SEG,
      a=crownPoint(ring,i),b=crownPoint(ring,j),
      c=crownPoint(ring+1,j),d=crownPoint(ring+1,i);
     push(a,b,c,'enamel');push(a,c,d,'enamel');
    }
   }
   const top=[x,y+direction*(h-.22),z];
   for(let i=0;i<SEG;i++)push(crownPoint(RINGS,i),crownPoint(RINGS,(i+1)%SEG),top,'occlusal');
   // Rounded cervical gingival collar, intentionally separate from visible white crowns.
   const G=5;
   const gum=(t,i)=>{
    const a=ang(i),scale=1.3+(1-t)*.3;
    return [x+rw*scale*Math.cos(a),y-direction*(.5+t*2.1),z+rz*scale*Math.sin(a)];
   };
   for(let j=0;j<G;j++)for(let i=0;i<SEG;i++){
    const next=(i+1)%SEG,a=gum(j/G,i),b=gum(j/G,next),c=gum((j+1)/G,next),d=gum((j+1)/G,i);
    push(a,b,c,'gingiva');push(a,c,d,'gingiva');
   }
  }
  for(const upper of [true,false])for(const side of [-1,1])for(let i=0;i<7;i++){
   const x=side*(2.35+i*3.85);
   const z=12-i*4.15-(i*i*.11);
   const y=upper?7.8:-8.5;
   tooth(x,z,y,i,upper,side);
  }
  return {vertices,min:boundsMin,max:boundsMax,
   bounds:boundsMax.map((v,i)=>v-boundsMin[i]),triangles:vertices.length,invalid:0,
   degenerate:0,ok:false,synthetic:true,teeth:28,
   name:'PIGA 28-ZAHN ANATOMIE-ANSICHT (SYNTHETISCH)',
   sha:'synthetic-orientation-not-measured',
   disclaimer:'Anatomisch orientierende, synthetische Darstellung – keine Patientenmessung'};
 }
 return {build};
})();
