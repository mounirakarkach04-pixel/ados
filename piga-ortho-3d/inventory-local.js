'use strict';
(()=>{
 const L=window.OrthoLocal,{db,$,value,number,text,visible,date,format,now,uuid,el,row,csv,save,showMsg}=L;
 L.banner();visible('workspace');visible('staffNav');visible('staffPermissions');visible('configuration');visible('addNewItem');
 text('hello','Materialverwaltung');text('identity','Lokaler Materialbestand · ohne Anmeldung');
 text('permissionBadge','LOKAL · ALLE BEREICHE');$('reload').onclick=()=>renderAll();
 const stock=db.inventory;let selected=null,lastForecast=[];
 const get=()=>selected?stock.find(s=>s.id===selected.id):null;
 const quantity=x=>Math.max(0,Number(x.quantity)||0);
 const state=x=>{
  const expiry=x.expiry_on?Date.parse(x.expiry_on+'T23:59:59'):NaN;
  if(Number.isFinite(expiry)&&expiry<=Date.now()+30*86400000)return 'expiry';
  if(Number(x.minimum)>0&&quantity(x)<Number(x.minimum))return 'critical';
  if(x.minimum==null)return 'unconfigured';
  return 'ok';
 };
 const change=(n,sign)=>{const x=get();if(!x)throw Error('Bitte zuerst einen Artikel auswählen.');if(!Number.isFinite(n)||n<=0||n>1000000)throw Error('Bitte eine gültige Menge eingeben.');if(quantity(x)+sign*n<0)throw Error('Bestand kann nicht negativ werden.');x.quantity=Math.round((quantity(x)+sign*n)*1000)/1000;return x};
 const settings=['minimum','incoming','leadDays','reserveDays','packSize','expiry','batch','supplier','fixedUse','removableUse','alignerUse','generalUse'];
 const prop=id=>({leadDays:'leadDays',reserveDays:'reserveDays',packSize:'packSize',expiry:'expiry_on',batch:'batch_lot',supplier:'supplier'}[id]||id);
 const numeric=new Set(['minimum','incoming','leadDays','reserveDays','packSize','fixedUse','removableUse','alignerUse','generalUse']);
 function select(id){selected=stock.find(x=>x.id===id)||stock[0]||null;renderDetails();renderItems();}
 function renderItems(){
  const category=value('category'),filter=value('search').toLowerCase(),st=value('state');
  const list=$('items');list.replaceChildren();
  const found=stock.filter(x=>(!category||x.category===category)&&(!st||state(x)===st)&&(!filter||[x.sku,x.label,x.variant,x.category].join(' ').toLowerCase().includes(filter)));
  for(const item of found)row(list,item.label+' · '+item.sku,format(quantity(item))+' '+item.unit+' · '+(state(item)==='critical'?'unter Mindestmenge':state(item)==='expiry'?'Verfall prüfen':item.category),[['Auswählen',()=>select(item.id)]]);
  if(!found.length)row(list,'Keine passenden Positionen','Material unten über „Neuen Artikel anlegen“ erfassen.');
  text('statAll',stock.length);text('statCritical',stock.filter(x=>state(x)==='critical').length);text('statExpiring',stock.filter(x=>state(x)==='expiry').length);
 }
 function renderDetails(){
  const x=get();const disabled=!x;
  for(const id of ['adjust','saveSettings'])$(id).disabled=disabled;
  text('detailTitle',x?.label||'Artikel auswählen');text('detailSku',x?x.sku+' · '+x.category+' · '+(x.batch_lot||'Keine Charge'):'Keine Artikelposition');
  text('detailQuantity',x?format(quantity(x)):'–');text('detailUnits',x?.unit||'–');
  text('detailStatus',x?state(x).toUpperCase():'Nicht ausgewählt');
  text('detailExpire',x?.expiry_on||'');
  for(const id of settings)if($(id))$(id).value=x?(x[prop(id)]??(id==='packSize'?1:'')):'';
  const history=$('historyList');history.replaceChildren();
  for(const ev of db.movements.filter(e=>e.itemId===x?.id).slice().reverse().slice(0,25))row(history,ev.reason+' · '+(ev.delta>=0?'+':'')+format(ev.delta),date(ev.at)+' · Rest '+format(ev.after)+' · '+(ev.note||''));
  if(!history.children.length)row(history,'Keine Buchungen','');
 }
 function forecast(){
  const weekly={fixed:number('fixedVisits'),removable:number('removableVisits'),aligner:number('alignerVisits'),general:number('generalVisits')};
  const days=Math.max(1,number('workdays')||5);
  lastForecast=[];
  for(const x of stock){
   const demand=weekly.fixed*Number(x.fixedUse||0)+weekly.removable*Number(x.removableUse||0)+weekly.aligner*Number(x.alignerUse||0)+weekly.general*Number(x.generalUse||0);
   const target=Math.max(Number(x.minimum)||0,demand/days*(Number(x.leadDays||0)+Number(x.reserveDays||0)));
   const shortage=Math.max(0,target-quantity(x)-Math.max(0,Number(x.incoming)||0));
   const size=Math.max(0.001,Number(x.packSize)||1);
   const order=Math.ceil((shortage-1e-10)/size)*size;
   if(order>0)lastForecast.push({...x,target,order});
  }
  text('statToOrder',lastForecast.length);
  text('planSummary',lastForecast.length+' Materialpositionen mit rechnerischem Nachbestellbedarf · keine automatische Bestellung.');
  const list=$('planList');list.replaceChildren();
  for(const x of lastForecast)row(list,x.sku+' · '+x.label,'Nachbestellen: '+format(x.order)+' '+x.unit+' · Soll '+format(x.target));
  if(!lastForecast.length)row(list,'Keine berechnete Nachbestellung','Bei fehlenden Verbrauchsfaktoren zunächst diese Werte eintragen.');
  return lastForecast;
 }
 function renderAlerts(){
  const box=$('alerts');box.replaceChildren();
  for(const x of stock.filter(s=>state(s)!=='ok'))row(box,x.sku+' · '+x.label,state(x)==='expiry'?'Verfalldatum prüfen: '+(x.expiry_on||'–'):'Bestand '+format(x.quantity)+' / Minimum '+format(x.minimum));
  if(!box.children.length)row(box,'Keine aktiven Warnungen','');
  const people=$('staffList');people.replaceChildren();
  row(people,'Lokaler Zugang','Alle Bereiche auf diesem Browser sind ohne Supabase-Rollenprüfung erreichbar. Keine geräteübergreifende Anmeldung.');
 }
 function renderAll(){
  const c=$('category'),prior=c.value;const cats=[...new Set(stock.map(s=>s.category))].sort();
  c.replaceChildren(new Option('Alle Kategorien',''));
  for(const cat of cats)c.append(new Option(cat,cat));c.value=cats.includes(prior)?prior:'';
  if(!get())selected=stock[0]||null;
  renderItems();renderDetails();forecast();renderAlerts();
 }
 $('newItemForm').onsubmit=e=>{
  e.preventDefault();const sku=value('newSku').toUpperCase(),label=value('newLabel'),category=value('newCategory');
  if(!/^[A-Z0-9_-]{3,32}$/.test(sku)||label.length<3||category.length<3)return showMsg('newItemFeedback','Bitte SKU, Gruppe und Bezeichnung prüfen.',true);
  if(stock.some(s=>s.sku===sku))return showMsg('newItemFeedback','Diese Artikelnummer existiert bereits.',true);
  const item={id:uuid(),sku,label,category,variant:value('newVariant'),unit:value('newUnit')||'Stück',quantity:0,minimum:0,incoming:0,leadDays:0,reserveDays:0,packSize:1};
  stock.push(item);selected=item;save();$('newItemForm').reset();showMsg('newItemFeedback','Artikel lokal angelegt.');renderAll();
 };
 $('changeReason').onchange=()=>visible('correctionDirection',value('changeReason')==='COUNT_CORRECTION');
 $('adjustForm').onsubmit=e=>{
  e.preventDefault();const reason=value('changeReason'),n=number('changeQuantity'),sign=reason==='RECEIVE'?1:reason==='COUNT_CORRECTION'&&value('correctionSign')==='+'?1:-1;
  try{const x=change(n,sign);db.movements.push({id:uuid(),itemId:x.id,at:now(),delta:sign*n,reason,after:x.quantity,note:value('changeNote').slice(0,120)});
   save();$('adjustForm').reset();showMsg('adjustStatus','Bestandsbuchung lokal gespeichert.');renderAll();
  }catch(err){showMsg('adjustStatus',err.message,true);}
 };
 $('settingsForm').onsubmit=e=>{
  e.preventDefault();const x=get();if(!x)return showMsg('settingStatus','Kein Material ausgewählt.',true);
  for(const id of settings){const p=prop(id);const v=numeric.has(id)?number(id):value(id);if(numeric.has(id)&&v<0)return showMsg('settingStatus','Negative Werte nicht erlaubt.',true);x[p]=v;}
  save();showMsg('settingStatus','Parameter lokal gespeichert.');renderAll();
 };
 for(const f of ['search','category','state'])$(f).addEventListener(f==='search'?'input':'change',renderItems);
 for(const f of ['fixedVisits','removableVisits','alignerVisits','generalVisits','workdays'])$(f).addEventListener('change',forecast);
 $('calculate').onclick=forecast;
 $('inventoryCsv').onclick=()=>csv('ORTHO-MATERIALBESTAND.csv',[['SKU','Kategorie','Material','Variante','Einheit','Bestand','Minimum','Unterwegs','Charge','Verfall','Lieferant'],...stock.map(x=>[x.sku,x.category,x.label,x.variant,x.unit,x.quantity,x.minimum,x.incoming,x.batch_lot,x.expiry_on,x.supplier])]);
 $('movementCsv').onclick=()=>csv('ORTHO-MATERIALJOURNAL.csv',[['Zeit','SKU','Grund','Delta','Rest','Notiz'],...db.movements.map(e=>[e.at,stock.find(x=>x.id===e.itemId)?.sku||'',e.reason,e.delta,e.after,e.note])]);
 $('orderCsv').onclick=()=>{forecast();csv('ORTHO-BESTELLVORSCHLAG.csv',[['SKU','Artikel','Soll','Nachbestellen','Einheit','Lieferant'],...lastForecast.map(x=>[x.sku,x.label,x.target,x.order,x.unit,x.supplier])]);};
 const mail=(subject,body)=>{location.href='mailto:?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body)};
 $('composeMail').onclick=()=>{forecast();mail('Ortho Material-Bestellprüfung',lastForecast.map(x=>x.sku+' '+x.label+': '+format(x.order)+' '+x.unit).join('\n')||'Keine rechnerische Nachbestellung.');};
 $('alertMail').onclick=()=>mail('Ortho Materialhinweise',stock.filter(x=>state(x)!=='ok').map(x=>x.sku+' '+x.label+': '+state(x)).join('\n')||'Keine Warnungen.');
 window.addEventListener('ortho-local-change',()=>renderAll());
 renderAll();
})();
