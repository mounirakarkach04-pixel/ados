'use strict';
(()=>{
const API='https://sanrkcovmkkhgdqydxfk.supabase.co',KEY='sb_publishable_GWNQHoz-ML6wphVEyXz0pA_TLuNDzDQ';
const $=id=>document.getElementById(id);
let session=null,staff=null,items=[],selected=null,movements=[],alerts=[],colleagues=[],permissions=[],lastForecast=[],isOwner=false,hasAccess=false;
const msg=(id,txt,error=false)=>{const e=$(id);e.textContent=String(txt);e.classList.toggle('error',error)};
const num=v=>Number(v)||0;
const fmt=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:3}).format(num(n));
const date=d=>d?new Date(d).toLocaleString('de-DE'):'—';
const node=(tag,text='',className='')=>{const e=document.createElement(tag);e.textContent=String(text);if(className)e.className=className;return e};
const clean=s=>String(s??'').trim().slice(0,120);
const q=uri=>encodeURIComponent(uri);
function csv(rows,name){
 const value=rows.map(row=>row.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(';')).join('\r\n');
 const blob=new Blob(['\uFEFF'+value],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
async function req(path,method='GET',body=null){
 const headers={apikey:KEY,'Authorization':'Bearer '+session.access_token};
 if(body!==null)headers['Content-Type']='application/json';
 const response=await fetch(API+path,{method,headers,body:body===null?undefined:JSON.stringify(body),credentials:'omit',cache:'no-store'});
 const raw=await response.text();let data=null;
 try{data=raw?JSON.parse(raw):null;}catch{}
 if(!response.ok)throw Error('Server '+response.status+': '+clean(data?.message||data?.msg||data?.error_description||'Aktion fehlgeschlagen'));
 return data;
}
async function authenticate(token){
 if(!token)throw Error('Bitte zuerst mit Ihrem Praxiskonto anmelden.');
 session={access_token:token};
 const auth=await req('/auth/v1/user');
 if(!auth?.id||!auth?.email_confirmed_at)throw Error('Bitte zuerst Ihre E-Mail-Adresse verifizieren.');
 const profiles=await req('/rest/v1/ortho_staff?select=user_id,email,full_name,staff_code,role,status&user_id=eq.'+q(auth.id));
 if(!Array.isArray(profiles)||profiles.length!==1)throw Error('Praxisprofil nicht zugeordnet. Bitte im Personalportal aktivieren.');
 staff=profiles[0];if(staff.status!=='active')throw Error('Ihr Konto wartet auf Freigabe durch die Praxisleitung.');
 isOwner=staff.role==='owner';
 if(!isOwner&&staff.role!=='employee')throw Error('Diese Rolle ist für das Lager nicht zugelassen.');
 if(!isOwner){
  const granted=await req('/rest/v1/ortho_inventory_access?select=can_manage_stock&user_id=eq.'+q(auth.id));
  if(!Array.isArray(granted)||granted.length!==1||granted[0].can_manage_stock!==true)throw Error('Dr. Akarkach hat den Lagerzugriff für dieses Konto noch nicht freigegeben.');
 }
 hasAccess=true;
 $('locked').hidden=true;$('workspace').hidden=false;
 $('hello').textContent=String(auth.email||'').toLowerCase()==='dr.akarkach@gmx.de'?'Guten Tag, Dr. Akarkach':'Guten Tag, '+String(staff.full_name||'Mitarbeiter').slice(0,80);
 $('identity').textContent=staff.staff_code+' · '+staff.full_name+' · '+(isOwner?'Praxisinhaber':'Mitarbeiterinventur');
 $('permissionBadge').textContent=isOwner?'INHABER / VOLLER LAGERZUGRIFF':'INVENTUR FREIGEGEBEN';
 $('staffNav').hidden=!isOwner;
 $('staffPermissions').hidden=!isOwner;
 $('configuration').hidden=!isOwner;
 await loadAll();
}
function logout(){
 sessionStorage.removeItem('piga-ortho-auth-ephemeral');
 session=null;staff=null;items=[];isOwner=false;hasAccess=false;
 $('workspace').hidden=true;$('locked').hidden=false;
 $('loginPassword').value='';msg('loginStatus','');
}
$('logout').onclick=logout;
$('login').onclick=async()=>{
 const email=$('loginEmail').value.trim().toLowerCase(),password=$('loginPassword').value;
 if(!email||!password)return msg('loginStatus','Bitte E-Mail und Passwort eingeben.',true);
 $('login').disabled=true;
 try{
   const response=await fetch(API+'/auth/v1/token?grant_type=password',{
     method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},
     body:JSON.stringify({email,password}),cache:'no-store',credentials:'omit'
   });
   const result=await response.json();
   if(!response.ok||!result.access_token)throw Error('Anmeldung nicht bestätigt. E-Mail-Verifizierung, Passwort oder Versandkonfiguration prüfen.');
   $('loginPassword').value='';
   sessionStorage.setItem('piga-ortho-auth-ephemeral',JSON.stringify({token:result.access_token,expiresAt:Date.now()+Math.min(Number(result.expires_in)||3600,3600)*1000}));
   await authenticate(result.access_token);
 }catch(e){msg('loginStatus',e.message,true);}finally{$('login').disabled=false;}
};
async function loadAll(){
 try{
  const result=await req('/rest/v1/ortho_inventory_items?select=*&active=eq.true&order=category.asc,label.asc&limit=400');
  if(!Array.isArray(result))throw Error('Materialantwort ungültig');
  items=result;drawFilters();renderItems();
  if(items.length&&!items.some(x=>x.id===selected?.id))selected=items[0];
  drawDetails();calculate();
  await Promise.allSettled([loadMovements(),isOwner?loadAlerts():Promise.resolve(),isOwner?loadStaff():Promise.resolve()]);
 }catch(e){msg('adjustStatus','Bestände konnten nicht geladen werden: '+e.message,true);}
}
$('reload').onclick=loadAll;
function status(item){
 if(item.minimum>0&&num(item.quantity)<=num(item.minimum))return 'critical';
 if(item.expiry_on){
   const days=Math.ceil((new Date(item.expiry_on+'T12:00:00').getTime()-Date.now())/86400000);
   if(days<=30)return 'expiry';
 }
 if(!num(item.minimum)&&!num(item.fixed_per_visit)&&!num(item.removable_per_visit)&&!num(item.aligner_per_visit)&&!num(item.general_per_visit))return 'unconfigured';
 return 'ok';
}
function drawFilters(){
 const category=$('category'),selectedCategory=category.value;
 category.replaceChildren();const all=node('option','Alle Kategorien');all.value='';category.append(all);
 for(const x of [...new Set(items.map(i=>i.category))].sort()){const el=node('option',x);el.value=x;category.append(el);}
 category.value=selectedCategory;
}
function renderItems(){
 const root=$('items');root.replaceChildren();
 const keyword=$('search').value.trim().toLowerCase(),category=$('category').value,stat=$('state').value;
 const shown=items.filter(x=>(!category||x.category===category)&&(!stat||status(x)===stat)&&
  (!keyword||[x.sku,x.label,x.variant,x.category].join(' ').toLowerCase().includes(keyword)));
 shown.forEach(x=>{
  const el=node('button','','item');el.type='button';el.setAttribute('aria-current',String(selected?.id===x.id));
  const left=node('div');left.append(node('b',x.label),node('small',x.sku+' · '+x.category+' · '+x.variant));
  const right=node('div'),state=status(x);
  right.append(node('b',fmt(x.quantity)+' '+x.unit),node('em',state==='critical'?'NACHBESTELLEN':state==='expiry'?'VERFALL PRÜFEN':state==='unconfigured'?'PARAMETER FEHLEN':'OK',state==='critical'?'alert':state==='unconfigured'?'none':''));
  el.append(left,right);el.onclick=()=>{selected=x;drawDetails();renderItems();loadMovements();};root.append(el);
 });
 if(!shown.length)root.append(node('p','Keine Materialien entsprechen dem Filter.'));
 $('statAll').textContent=String(items.length);
 $('statCritical').textContent=String(items.filter(x=>status(x)==='critical').length);
 $('statExpiring').textContent=String(items.filter(x=>status(x)==='expiry').length);
}
['search','category','state'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',renderItems));
function drawDetails(){
 const x=selected;
 $('adjust').disabled=!x;
 if(!x)return;
 msg('adjustStatus','');
 $('detailTitle').textContent=x.label;
 $('detailSku').textContent=x.sku+' · '+x.variant+(x.supplier?' · '+x.supplier:'');
 $('detailQuantity').textContent=fmt(x.quantity);
 $('detailUnits').textContent=x.unit;
 $('detailStatus').textContent=status(x)==='critical'?'KRITISCH: MINIMUM UNTERSCHRITTEN':status(x)==='expiry'?'VERFALLSPRÜFUNG':'Technische Inventur';
 $('detailExpire').textContent=x.expiry_on?'Verfall: '+x.expiry_on:'Verfall nicht erfasst';
 const keys={minimum:'minimum',incoming:'incoming',leadDays:'lead_days',reserveDays:'reserve_days',packSize:'pack_size',expiry:'expiry_on',batch:'batch_lot',supplier:'supplier',fixedUse:'fixed_per_visit',removableUse:'removable_per_visit',alignerUse:'aligner_per_visit',generalUse:'general_per_visit'};
 for(const [id,key] of Object.entries(keys))$(id).value=x[key]??'';
}
$('adjustForm').onsubmit=async e=>{
 e.preventDefault();if(!selected)return;
 const amount=Number($('changeQuantity').value),reason=$('changeReason').value;
 if(!Number.isFinite(amount)||amount<=0||amount>1000000)return msg('adjustStatus','Ungültige Menge.',true);
 const delta=reason==='RECEIVE'?amount:reason==='COUNT_CORRECTION'?Number(promptForSignedCorrection(amount)): -amount;
 if(!Number.isFinite(delta)||delta===0)return msg('adjustStatus','Keine gültige Differenz.',true);
 const note=clean($('changeNote').value);
 $('adjust').disabled=true;
 try{
  await req('/rest/v1/rpc/ortho_inventory_adjust','POST',{target_item_id:selected.id,change_quantity:delta,change_reason:reason,change_note:note});
  msg('adjustStatus','Buchung serverseitig gespeichert. Bestand und Journal werden neu gelesen.');
  $('changeQuantity').value='';$('changeNote').value='';await loadAll();
 }catch(err){msg('adjustStatus',err.message,true);}
 finally{$('adjust').disabled=false;}
};
function promptForSignedCorrection(amount){
 // User chooses direction with dedicated form control instead of silently assuming a sign.
 const choice=window.confirm('Inventurkorrektur: OK = Bestand erhöhen, Abbrechen = Bestand vermindern.');
 return choice?amount:-amount;
}
$('settingsForm').onsubmit=async e=>{
 e.preventDefault();if(!isOwner||!selected)return;
 const fields={
 minimum:num($('minimum').value),incoming:num($('incoming').value),lead_days:num($('leadDays').value),reserve_days:num($('reserveDays').value),
 pack_size:num($('packSize').value),expiry_on:$('expiry').value||null,batch_lot:clean($('batch').value),supplier:clean($('supplier').value),
 fixed_per_visit:num($('fixedUse').value),removable_per_visit:num($('removableUse').value),aligner_per_visit:num($('alignerUse').value),general_per_visit:num($('generalUse').value)
 };
 if(fields.pack_size<=0||fields.lead_days>365||fields.reserve_days>365||Object.values(fields).some(x=>typeof x==='number'&&(!Number.isFinite(x)||x<0)))return msg('settingStatus','Unzulässige Parameter.',true);
 $('saveSettings').disabled=true;
 try{await req('/rest/v1/ortho_inventory_items?id=eq.'+q(selected.id),'PATCH',fields);msg('settingStatus','Materialplanung gespeichert.');await loadAll();}
 catch(e){msg('settingStatus',e.message,true);}finally{$('saveSettings').disabled=false;}
};
async function loadMovements(){
 if(!selected)return;const out=await req('/rest/v1/ortho_inventory_movements?select=*&item_id=eq.'+q(selected.id)+'&order=occurred_at.desc&limit=30');
 movements=Array.isArray(out)?out:[];const root=$('historyList');root.replaceChildren();
 movements.forEach(x=>{const r=node('div','','record');const left=node('div');left.append(node('b',x.reason+' · '+(x.delta>0?'+':'')+fmt(x.delta)),node('small',date(x.occurred_at)+' · '+x.note));r.append(left,node('span','Rest '+fmt(x.quantity_after)));root.append(r);});
 if(!movements.length)root.append(node('p','Noch keine protokollierten Bewegungen.'));
}
function forecast(items,volumes,days){
 if(!Number.isInteger(days)||days<1||days>7||Object.values(volumes).some(v=>!Number.isInteger(v)||v<0||v>20000))throw Error('Die Terminmengen müssen ganze nichtnegative Zahlen sein; Arbeitstage 1–7.');
 return items.map(x=>{
  const weekly=volumes.fixed*num(x.fixed_per_visit)+volumes.removable*num(x.removable_per_visit)+volumes.aligner*num(x.aligner_per_visit)+volumes.general*num(x.general_per_visit);
  const daily=weekly/days;
  const planned=Math.max(num(x.minimum),daily*(num(x.lead_days)+num(x.reserve_days)));
  const gap=Math.max(0,planned-num(x.quantity)-num(x.incoming));
  const pack=num(x.pack_size);
  if(pack<=0)throw Error('Ungültige Verpackungseinheit für '+x.sku);
  const order=Math.ceil((gap-1e-9)/pack)*pack;
  return {...x,weekly,daily,target:planned,order:Number(order.toFixed(3)),configured:!!(num(x.minimum)||num(x.fixed_per_visit)||num(x.removable_per_visit)||num(x.aligner_per_visit)||num(x.general_per_visit))};
 }).filter(x=>x.configured&&x.order>0).sort((a,b)=>b.order-a.order);
}
function calculate(){
 try{
 const v={fixed:num($('fixedVisits').value),removable:num($('removableVisits').value),aligner:num($('alignerVisits').value),general:num($('generalVisits').value)};
 lastForecast=forecast(items,v,num($('workdays').value));
 $('statToOrder').textContent=String(lastForecast.length);
 const root=$('planList');root.replaceChildren();
 $('planSummary').textContent=lastForecast.length?lastForecast.length+' Positionen mit positivem Nachbestellbedarf. Mengen beruhen auf den eingetragenen Verbrauchsfaktoren.':'Keine mathematisch begründete Nachbestellung. Bei fehlenden Faktoren zuerst reale Verbrauchsdaten erfassen.';
 lastForecast.slice(0,80).forEach(x=>{const el=node('div','','record');const l=node('div');l.append(node('b',x.label),node('small',x.sku+' · Soll '+fmt(x.target)+' · vorhanden '+fmt(x.quantity)+' · unterwegs '+fmt(x.incoming)));el.append(l,node('span','+'+fmt(x.order)+' '+x.unit));root.append(el);});
 return lastForecast;
 }catch(e){msg('planSummary',e.message,true);lastForecast=[];return [];}
}
$('calculate').onclick=calculate;
['fixedVisits','removableVisits','alignerVisits','generalVisits','workdays'].forEach(id=>$(id).addEventListener('change',calculate));
$('inventoryCsv').onclick=()=>csv([['Artikelnummer','Kategorie','Artikel','Variante','Einheit','Bestand','Minimum','Unterwegs','Charge','Verfall','Lieferant'],...items.map(x=>[x.sku,x.category,x.label,x.variant,x.unit,x.quantity,x.minimum,x.incoming,x.batch_lot,x.expiry_on,x.supplier])],'PIGA_ORTHO_MATERIALBESTAND.csv');
$('movementCsv').onclick=()=>csv([['Zeit','Artikel','Typ','Menge','Rest','Begründung'],...movements.map(x=>[x.occurred_at,selected?.sku,x.reason,x.delta,x.quantity_after,x.note])],'PIGA_ORTHO_BUCHUNGSJOURNAL.csv');
$('orderCsv').onclick=()=>{calculate();csv([['SKU','Artikel','Einheit','Vorhanden','Unterwegs','Soll','Nachbestellen','Lieferant','Freigabe'],...lastForecast.map(x=>[x.sku,x.label,x.unit,x.quantity,x.incoming,x.target,x.order,x.supplier,'AUSSTEHEND'])],'PIGA_ORTHO_BESTELLENTWURF.csv');};
function mailBody(){
 calculate();
 const lines=lastForecast.map(x=>x.sku+' – '+x.label+': '+fmt(x.order)+' '+x.unit+' (vorhanden '+fmt(x.quantity)+', Soll '+fmt(x.target)+')');
 return ['Lieber Herr Dr. Akarkach,','','im Materialzentrum wurden folgende Nachbestellungen rechnerisch vorgeschlagen:','',...(lines.length?lines:['Keine berechneten Bestellpositionen.']),'','Die Angaben beruhen auf konfigurierten Lager- und Verbrauchsfaktoren. Bitte Bestellung, Lieferanten, Qualitäts- und Chargenangaben vor Freigabe prüfen. Es wurde nichts bestellt.','','Mit freundlichen Grüßen','PIGA','im Auftrag von Mounir Akarkach'].join('\n').slice(0,6500);
}
function compose(subject,body){window.location.href='mailto:dr.akarkach@gmx.de?subject='+q(subject)+'&body='+q(body);}
$('composeMail').onclick=()=>{if(!isOwner)return;compose('PIGA ORTHO 3D – Material-Bestellprüfung',mailBody());};
async function loadAlerts(){
 if(!isOwner)return;
 alerts=await req('/rest/v1/ortho_inventory_alerts?select=id,item_id,event_type,message,occurred_at,acknowledged_at,mail_delivery&acknowledged_at=is.null&order=occurred_at.desc&limit=100');
 const root=$('alerts');root.replaceChildren();
 const exp=items.filter(x=>status(x)==='expiry');
 for(const x of exp){const r=node('div','','record');r.append(node('b','Ablauf / Verfall prüfen: '+x.sku),node('small',x.expiry_on));root.append(r);}
 alerts.forEach(x=>{const r=node('div','','record'),l=node('div');l.append(node('b',x.message),node('small',date(x.occurred_at)+' · E-Mail: '+x.mail_delivery));const b=node('button','Gesehen');b.type='button';b.onclick=async()=>{try{await req('/rest/v1/ortho_inventory_alerts?id=eq.'+q(x.id),'PATCH',{acknowledged_at:new Date().toISOString()});await loadAlerts();}catch(e){msg('adjustStatus',e.message,true);}};r.append(l,b);root.append(r);});
 if(!root.children.length)root.append(node('p','Aktuell keine unbestätigten kritischen Ereignisse.'));
}
$('alertMail').onclick=()=>{if(!isOwner)return;const urgent=[...items.filter(x=>status(x)==='critical').map(x=>x.sku+' – '+x.label+': '+fmt(x.quantity)+' / Minimum '+fmt(x.minimum)),...items.filter(x=>status(x)==='expiry').map(x=>x.sku+' – Ablauf '+x.expiry_on)];compose('PIGA ORTHO 3D – Kritische Materialbestände',[
 'Lieber Herr Dr. Akarkach,','','folgende Bestandsereignisse sind im Materialzentrum zu überprüfen:','',...(urgent.length?urgent:['Keine aktuell als kritisch gekennzeichneten Bestände.']),'','Bitte prüfen Sie Verbrauch, Charge, Lieferfähigkeit und bestellen Sie nach Freigabe. E-Mail aus der App nur manuell erstellt, nicht automatisch versendet.','','Mit freundlichen Grüßen','PIGA','im Auftrag von Mounir Akarkach'].join('\n').slice(0,6500));};
async function loadStaff(){
 if(!isOwner)return;
 [colleagues,permissions]=await Promise.all([
 req('/rest/v1/ortho_staff?select=user_id,full_name,staff_code,role,status&status=eq.active&role=eq.employee&order=full_name.asc'),
 req('/rest/v1/ortho_inventory_access?select=user_id,can_manage_stock')
 ]);
 const root=$('staffList');root.replaceChildren();
 colleagues.forEach(c=>{
  const access=permissions.find(p=>p.user_id===c.user_id),active=access?.can_manage_stock===true;
  const row=node('div','','record'),left=node('div'),btn=node('button',active?'Berechtigung entziehen':'Inventur freigeben');
  left.append(node('b',c.full_name),node('small',c.staff_code+' · '+(active?'Zugang aktiv':'Noch keine Freigabe')));
  btn.onclick=async()=>{
   btn.disabled=true;
   try{
    if(access)await req('/rest/v1/ortho_inventory_access?user_id=eq.'+q(c.user_id),'PATCH',{can_manage_stock:!active,granted_by:staff.user_id});
    else await req('/rest/v1/ortho_inventory_access','POST',{user_id:c.user_id,can_manage_stock:true,granted_by:staff.user_id});
    await loadStaff();
   }catch(e){msg('adjustStatus',e.message,true);}finally{btn.disabled=false;}
  };
  row.append(left,btn);root.append(row);
 });
 if(!colleagues.length)root.append(node('p','Noch keine aktiven Mitarbeiterkonten.'));
}
(async()=>{
 try{
 const raw=sessionStorage.getItem('piga-ortho-auth-ephemeral');
 if(!raw)return;
 const info=JSON.parse(raw);
 if(!info?.token||Date.now()>=Number(info.expiresAt)){sessionStorage.removeItem('piga-ortho-auth-ephemeral');return;}
 await authenticate(info.token);
 }catch(e){logout();msg('loginStatus','Sitzung konnte nicht übernommen werden: '+e.message,true);}
})();
})();