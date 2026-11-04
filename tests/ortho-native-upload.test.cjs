'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../piga-ortho-3d');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
test('Studio has a visible native Android file input and persistent status',()=>{
 const h=read('studio.html'),css=read('style.css'),js=read('app.js');
 assert.match(h,/<input id="stlFile" type="file" accept="\.stl,model\/stl" aria-describedby="stlUploadHelp">/);
 assert.doesNotMatch(h,/<input[^>]*id="stlFile"[^>]*hidden\b/);
 assert.match(h,/id="stlUploadStatus"[^>]+role="status" aria-live="polite"/);
 assert.match(css,/\.piga-stl-chooser input\[type=file\]\{display:block;visibility:visible/);
 assert.match(js,/progress\.textContent='STL lokal geöffnet:/);
 assert.match(js,/progress\.textContent='BLOCK: '/);
});
test('Single-file chooser differentiates local import from cloud upload and rejects unsupported formats',()=>{
 const h=read('studio.html'),js=read('app.js');
 assert.match(h,/nicht in die Cloud hochgeladen/);
 assert.match(js,/Nur STL-Dateien \(\.stl\)/);
 assert.match(js,/void loadFile\(file\)/);
 assert.match(js,/Keine Datei ausgewählt/);
});
test('Movement loader shows persistent FDI-specific PASS_LOCAL and BLOCK evidence',()=>{
 const h=read('movement.html'),css=read('movement.css'),js=read('movement.js');
 assert.match(h,/<input id="uploads" class="piga-file-input" type="file" accept="\.stl,model\/stl" multiple/);
 assert.match(h,/id="uploadStatus"[^>]+role="status" aria-live="polite"/);
 assert.match(css,/input\.piga-file-input\[type=file\]\{display:block;visibility:visible/);
 assert.match(js,/uploadStatus'\)\.textContent='PASS_LOCAL:/);
 assert.match(js,/Dateinamen z\. B\. 11\.stl oder 21\.stl/);
 assert.match(js,/sourceBytes>48\*1024\*1024/);
 assert.match(js,/files\.length\+teeth\.length>28/);
});
test('Dashboard native STL chooser is not silently hidden',()=>{
 const h=read('dashboard.html'),css=read('dashboard.css');
 assert.match(h,/<input type="file" accept="\.stl,model\/stl" id="quickStl" class="piga-file-input"/);
 assert.doesNotMatch(h,/<input[^>]*id="quickStl"[^>]*hidden/);
 assert.match(css,/input\.piga-file-input\[type=file\]\{display:block;visibility:visible/);
});
test('Device transfer and setup overlays are restricted to dashboard',()=>{
 for(const n of ['transfer-offer.js','setup-offer.js']){
  const code=read(n);
  assert.match(code,/if\(PAGE!=='dashboard\.html'\)return/);
  const context={location:{pathname:'/ados/piga-ortho-3d/movement.html'}};
  Object.defineProperty(context,'document',{get(){throw Error('Overlay touched clinical DOM')}});
  assert.doesNotThrow(()=>vm.runInNewContext(code,context));
 }
});
test('PWA cache updated without offline-caching credential or password pages',()=>{
 const sw=read('sw.js');
 assert.match(sw,/const CACHE='piga-ortho-v160-native-upload'/);
 for(const n of ['portal.html','portal.js','portal-auth.html','portal-auth-callback.js'])assert(!sw.includes("'./"+n+"'"),n);
 for(const n of ['movement.html','movement.js','movement-core.js'])assert(sw.includes("'./"+n+"'"),n);
});
