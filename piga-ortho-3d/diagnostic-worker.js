'use strict';
/* Purely local, non-destructive device diagnostics. No clinical action or network requests. */
self.addEventListener('message',async e=>{
 if(e.data?.kind!=='SELF_TEST')return;
 try{
  const bytes=new TextEncoder().encode('PIGA ORTHO 3D / DEVICE SELF TEST');
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  self.postMessage({kind:'SELF_TEST',status:'PASS',bytes:hash.byteLength});
 }catch(err){self.postMessage({kind:'SELF_TEST',status:'FAIL',error:String(err.message||err)})}
});
