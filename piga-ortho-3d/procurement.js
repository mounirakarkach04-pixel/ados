'use strict';
(async()=>{
 const S=window.PigaDeviceStore,P=window.PigaProcurement,$=id=>document.getElementById(id);
 if(!S||!P){$('buyResult').textContent='Lokale Warenkorb-Vorbereitung nicht geladen.';return}
 let items=[];
 const local=name=>{try{return JSON.parse(localStorage.getItem(S.keys[name])||'null')}catch{return null}};
 async function read(name){try{return (await S.get(name))?.data||local(name)}catch{return local(name)}}
 const status=s=>{$('buyResult').textContent=s};
 async function refresh(){
  try{
   await S.flush();const [suite,direct]=await Promise.all([read('suite'),read('direct')]);
   items=P.prepare(suite,direct);
   $('buyCount').textContent=String(items.length);
   const root=$('buyItems');root.replaceChildren();
   if(!items.length){
    const msg=document.createElement('p');msg.textContent='Keine lokalen Artikel unter dem erfassten Mindestbestand. Mindestmengen in der Inventur prüfen.';root.append(msg);
   }else for(const x of items){
    const row=document.createElement('article');row.className='buy-row';
    const name=document.createElement('div'),b=document.createElement('strong'),sm=document.createElement('small');
    b.textContent=x.name||x.code;sm.textContent=x.code+' · '+x.source;name.append(b,sm);
    const a=document.createElement('span'),c=document.createElement('span'),q=document.createElement('b');
    a.textContent='Lager: '+x.available;c.textContent='Minimum: '+x.minimum;q.textContent='+'+x.suggestedQuantity;
    row.append(name,a,c,q);root.append(row);
   }
   $('buyExport').disabled=!items.length;$('buyApproval').disabled=!items.length;
   status(items.length+' Nachbestellvorschläge bereit. Nur lokaler Entwurf, keine Bestellung, keine Abbuchung.');
  }catch(e){status('Bestandsprüfung fehlgeschlagen: '+String(e.message||e).slice(0,150))}
 }
 $('buyRefresh').onclick=()=>{void refresh()};
 $('buyExport').onclick=()=>{
  if(!items.length)return;
  const csv=P.csv(items),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='PIGA-ORTHO-EINKAUFSENTWURF-'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  status('CSV als Einkaufsliste exportiert. Artikel und Preise im Shop eigenständig abgleichen.');
 };
 $('buyApproval').onclick=async()=>{
  if(!items.length)return;
  try{
   const [r,b]=await Promise.all([
    S.loadPigaControl(),new Promise(resolve=>{
     if(window.PigaBrain)return resolve(window.PigaBrain);
     const s=document.createElement('script');s.src='./piga-brain.js';s.onload=()=>resolve(window.PigaBrain);
     s.onerror=()=>resolve(null);document.head.append(s);
    })]);
   if(!b?.request)throw Error('PIGA Brain nicht verfügbar.');
   const safe=r?.schema===1&&Array.isArray(r.requests)&&Array.isArray(r.messages)&&Array.isArray(r.teamMessages)?
    r:{schema:1,requests:[],messages:[],teamMessages:[]};
   const note='TECHNISCHER ENTWURF: '+items.length+' Artikel mit Unterschreitung des Mindestbestands. Keine Online-Bestellung oder Preisannahme.';
   safe.requests.push(b.request('INVENTORY_REVIEW',note,'owner'));
   safe.requests=safe.requests.slice(-100);
   await S.savePigaControl(safe);
   status('Einkaufsprüfung im PIGA Freigabeeingang vorgemerkt. Auch nach Entwurfsprüfung wird keine Bestellung automatisch gesendet.');
  }catch(e){status('Freigabeentwurf nicht gespeichert: '+String(e.message||e).slice(0,120))}
 };
 try{await S.initialize('suite')}catch{}
 await refresh();
})();
