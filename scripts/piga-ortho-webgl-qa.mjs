import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const base='piga-ortho-3d/',read=f=>fs.readFileSync(base+f,'utf8');
const source=read('dental-webgl.js'),app=read('app.js'),html=read('studio.html'),sw=read('sw.js');
new vm.Script(source,{filename:'dental-webgl.js'});
assert(html.includes('id="jawWebgl"')&&html.includes('src="./dental-webgl.js"'));
assert(html.indexOf('dental-webgl.js')<html.indexOf('src="./app.js"'),'GPU renderer should load before app');
assert(sw.includes("'./dental-webgl.js'"),'Offline PWA must package GPU shader');
assert(app.includes('PigaDentalWebGL?.render?.('),'GPU viewer not wired to desktop/mobile');
assert(app.includes('capture.drawImage(overlay,0,0)'),'PNG must composite visible GPU geometry');
assert(!/\bfetch\s*\(/.test(source),'3D rendering must never send data to network');
assert(!/setInterval\s*\(/.test(source),'No GPU busy render loop');
const anatomy={window:{}};
vm.runInNewContext(read('dental-anatomy.js'),anatomy);
const model=anatomy.window.PigaDentalAnatomy.build();
assert.equal(model.teeth,28);
function makeContext(gl){
 const canvas={hidden:true,width:780,height:500,getContext:()=>gl,
  addEventListener:()=>{}};
 const window={};
 vm.runInNewContext(source,{window,document:{getElementById:id=>id==='jawWebgl'?canvas:null},Math,Float32Array,Map,Array,Infinity,Number});
 return {window,canvas};
}
const missing=makeContext(null);
assert.equal(missing.window.PigaDentalWebGL.render({model,angleX:0,angleY:0,zoom:1,width:780,height:500}),false);
let drawn=0,uploaded=0,buffers=0;
const gl=new Proxy({
 VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,ARRAY_BUFFER:5,
 STATIC_DRAW:6,FLOAT:7,TRIANGLES:8,COLOR_BUFFER_BIT:9,DEPTH_BUFFER_BIT:10,
 DEPTH_TEST:11,LEQUAL:12,CULL_FACE:13,
 createShader:()=>({}),shaderSource(){},compileShader(){},getShaderParameter:()=>true,
 createProgram:()=>({}),attachShader(){},linkProgram(){},deleteShader(){},getProgramParameter:()=>true,
 createVertexArray:()=>({}),bindVertexArray(){},createBuffer:()=>({}),
 bindBuffer(){},enableVertexAttribArray(){},vertexAttribPointer(){},
 enable(){},depthFunc(){},disable(){},viewport(){},clearColor(){},clear(){},
 useProgram(){},getUniformLocation:()=>({}),uniform3f(){},uniform2f(){},uniform1f(){},
 bufferData:(target,data)=>{uploaded=data.length;buffers++},
 drawArrays:(mode,first,count)=>{assert.equal(mode,8);drawn=count}
},{get:(target,key)=>target[key]});
const gpu=makeContext(gl);
const view={model,angleX:-.13,angleY:.3,zoom:1,width:780,height:500};
assert.equal(gpu.window.PigaDentalWebGL.render(view),true,'GPU path should activate with available WebGL2');
assert.equal(gpu.canvas.hidden,false);
assert.equal(drawn,model.vertices.length*3);
assert.equal(uploaded,model.vertices.length*3*7);
assert(uploaded*4<8*1024*1024,'GPU geometry must fit device budget');
assert.equal(gpu.window.PigaDentalWebGL.render({...view,angleY:.62}),true);
assert.equal(buffers,1,'Do not reupload geometry on every user gesture');
gpu.window.PigaDentalWebGL.hide();assert.equal(gpu.canvas.hidden,true);
console.log('PIGA ORTHO GPU QA PASS: 28-tooth offline render, bounded GPU bytes, single mesh upload, 2D fallback, capture layers.');
