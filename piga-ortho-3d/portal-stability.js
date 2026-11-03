/* PIGA ORTHO 3D · deterministic client-side concurrency gates.
 * NOT a security/clinical authority. Server-side RLS/RPC always decides rights.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.PigaPortalStability=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function latestOnly(){
  let version=0;
  return {
    begin(){version++;return version;},
    valid(ticket){return Number.isSafeInteger(ticket)&&ticket>0&&ticket===version;},
    invalidate(){version++;}
  };
}
function alertTracker(){
  const seen=new Set();
  return {
    shouldNotify(scope,id){
      const key=String(scope)+'|'+String(id);
      if(!scope||!id||seen.has(key))return false;
      seen.add(key);return true;
    },
    reset(){seen.clear();},
    forget(scope,id){seen.delete(String(scope)+'|'+String(id));}
  };
}
function printEligible(data){
 return Boolean(
   data&&data.verifiedOwner===true&&data.filePresent===true&&
   /^[0-9a-f]{64}$/.test(String(data.sha256||''))&&
   Number.isInteger(data.size)&&data.size>=64&&data.size<=80*1024*1024&&
   data.checked===4&&String(data.model||'').trim().length>=5
 );
}
return{latestOnly,alertTracker,printEligible};
});
