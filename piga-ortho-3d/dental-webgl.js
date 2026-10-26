'use strict';
/* PIGA ORTHO GPU viewer v1: local WebGL2, no downloads/API/transfers.
 * Smooth normals, enamel and gingiva lighting, depth buffering, no continuous render loop.
 * Synthetic forms remain NON-CLINICAL; imported STL is measured only in its source units.
 */
window.PigaDentalWebGL=(()=>{
 const canvas=document.getElementById('jawWebgl');
 if(!canvas)return {render:()=>false,hide:()=>{}};
 let gl=null,program=null,buffer=null,vao=null,mesh=null,count=0,failed=false;
 const VS=`#version 300 es
 precision highp float;
 layout(location=0) in vec3 a_pos;
 layout(location=1) in vec3 a_normal;
 layout(location=2) in float a_material;
 uniform vec3 u_center;
 uniform vec2 u_angles;
 uniform vec2 u_scale;
 uniform float u_depth;
 out vec3 v_normal;
 out vec3 v_position;
 out float v_material;
 vec3 rot(vec3 v){
   float ca=cos(u_angles.y),sa=sin(u_angles.y);
   float cb=cos(u_angles.x),sb=sin(u_angles.x);
   vec3 a=vec3(v.x*ca+v.z*sa,v.y,-v.x*sa+v.z*ca);
   return vec3(a.x,a.y*cb-a.z*sb,a.y*sb+a.z*cb);
 }
 void main(){
   vec3 p=rot(a_pos-u_center);
   v_position=p;
   v_normal=normalize(rot(a_normal));
   v_material=a_material;
   gl_Position=vec4(p.x*u_scale.x,p.y*u_scale.y,-p.z*u_depth,1.0);
 }`;
 const FS=`#version 300 es
 precision highp float;
 in vec3 v_normal;
 in vec3 v_position;
 in float v_material;
 out vec4 frag;
 void main(){
   vec3 N=normalize(v_normal);
   if(!gl_FrontFacing) N=-N;
   vec3 L=normalize(vec3(-0.45,0.65,0.82));
   vec3 V=vec3(0.0,0.0,1.0);
   vec3 H=normalize(L+V);
   bool gum=v_material>1.5 && v_material<2.5;
   bool occlusal=v_material>2.5 && v_material<3.5;
   bool scan=v_material<0.5;
   vec3 base=gum?vec3(0.66,0.29,0.36):(occlusal?vec3(0.91,0.865,0.78):
      scan?vec3(0.74,0.84,0.91):vec3(0.94,0.925,0.875));
   float diff=max(dot(N,L),0.0);
   float bounced=max(dot(N,normalize(vec3(0.4,-0.35,0.8))),0.0);
   float spec=pow(max(dot(N,H),0.0),gum?48.0:105.0)*(gum?0.19:0.57);
   float rim=pow(1.0-max(dot(N,V),0.0),2.6);
   vec3 color=base*(0.31+0.56*diff+0.17*bounced);
   color+=vec3(1.0,0.985,0.95)*spec;
   color+=(gum?vec3(0.09,0.028,0.045):vec3(0.15,0.18,0.21))*rim;
   // Tone map with an enamel-friendly highlight rolloff. No fake measurements.
   color=color/(color+vec3(0.33));
   frag=vec4(pow(color,vec3(0.88)),1.0);
 }`;
 function compile(type,source){
  const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('Shader compile failed');
  return shader;
 }
 function init(){
  if(failed)return false;
  if(gl)return true;
  try{
   gl=canvas.getContext('webgl2',{alpha:true,antialias:true,preserveDrawingBuffer:true,
    powerPreference:'default',depth:true,stencil:false});
   if(!gl){failed=true;return false;}
   const v=compile(gl.VERTEX_SHADER,VS),f=compile(gl.FRAGMENT_SHADER,FS);
   program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);
   gl.deleteShader(v);gl.deleteShader(f);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('GPU program link failed');
   vao=gl.createVertexArray();gl.bindVertexArray(vao);
   buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   const stride=7*4;
   for(const [loc,size,offset] of [[0,3,0],[1,3,12],[2,1,24]]){
    gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,stride,offset);
   }
   gl.bindVertexArray(null);
   gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
   gl.disable(gl.CULL_FACE);
   canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();failed=true;canvas.hidden=true;gl=null;mesh=null;});
   canvas.addEventListener('webglcontextrestored',()=>{failed=false;gl=null;mesh=null;});
   return true;
  }catch{failed=true;canvas.hidden=true;return false;}
 }
 function upload(model){
  const triangles=model?.vertices||[];
  if(!Array.isArray(triangles)||!triangles.length||triangles.length>100000)return false;
  // Memory cap <= ~8.4 MB and >0; no streaming unbounded arrays.
  const positions=new Float32Array(triangles.length*3*7),normals=new Map();
  let i=0;
  const matCode={scan:0,enamel:1,gingiva:2,occlusal:3};
  const finite=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);
  const key=(p,m)=>p.map(x=>Math.round(x*1000)).join(':')+':'+m;
  for(const tr of triangles){
   if(!Array.isArray(tr)||tr.length!==3||!tr.every(finite))return false;
   const a=tr[0],b=tr[1],c=tr[2],m=matCode[tr.material]??0;
   const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
   const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
   const nlen=Math.hypot(...normal)||1;normal.forEach((n,k)=>normal[k]=n/nlen);
   for(const p of tr){
    const idx=i*7;positions.set(p,idx);positions[idx+6]=m;
    // Smooth geometry where safe; imported STL remains faceted to avoid false smoothing.
    if(model.synthetic){
     const k=key(p,m),before=normals.get(k)||[0,0,0];
     normals.set(k,before.map((v,j)=>v+normal[j]));
    }else positions.set(normal,idx+3);
    i++;
   }
  }
  if(model.synthetic){
   for(let v=0;v<i;v++){
    const ix=v*7,mat=positions[ix+6],k=key([positions[ix],positions[ix+1],positions[ix+2]],mat);
    const n=normals.get(k)||[0,0,1],size=Math.hypot(...n)||1;
    positions[ix+3]=n[0]/size;positions[ix+4]=n[1]/size;positions[ix+5]=n[2]/size;
   }
  }
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,positions,gl.STATIC_DRAW);
  mesh=model;count=i;return count>0;
 }
 function hide(){canvas.hidden=true;}
 function render({model,angleX,angleY,zoom,width,height}){
  if(!model||!init())return false;
  try{
   if(mesh!==model&&!upload(model))return false;
   if(canvas.width!==width)canvas.width=width;
   if(canvas.height!==height)canvas.height=height;
   gl.viewport(0,0,width,height);gl.clearColor(0,0,0,0);
   gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.useProgram(program);gl.bindVertexArray(vao);
   const min=model.min,max=model.max,bounds=model.bounds;
   if(!min?.every(Number.isFinite)||!max?.every(Number.isFinite))return false;
   const size=Math.max(...bounds,1),scale=Math.min(width,height)*0.62/size*zoom;
   gl.uniform3f(gl.getUniformLocation(program,'u_center'),(min[0]+max[0])/2,
    (min[1]+max[1])/2,(min[2]+max[2])/2);
   gl.uniform2f(gl.getUniformLocation(program,'u_angles'),angleX,angleY);
   gl.uniform2f(gl.getUniformLocation(program,'u_scale'),scale*2/width,scale*2/height);
   gl.uniform1f(gl.getUniformLocation(program,'u_depth'),0.8/size);
   gl.drawArrays(gl.TRIANGLES,0,count);
   gl.bindVertexArray(null);canvas.hidden=false;return true;
  }catch{hide();return false;}
 }
 return {render,hide};
})();
