import "jsr:@supabase/functions-js/edge-runtime.d.ts";
/**
 * Dedicated AI Act Stripe webhooks. Do not register this URL until the deployment
 * has STRIPE_WEBHOOK_SECRET (this endpoint's own whsec_), STRIPE_SECRET_KEY,
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY configured and tested in sandbox.
 * No browser-originated requests; no credentials ever returned.
 */
const CATALOG:Record<string,{price:string,amount:number,link:string}>={
 "PIGA-PROD-001":{price:"price_1UAulj68Ef1eoQ8vGk3O3zLb",amount:790000,link:"plink_1UAuyW68Ef1eoQ8vvsBHv88w"},
 "PIGA-PROD-002":{price:"price_1UAunN68Ef1eoQ8vCoqWMrvD",amount:790000,link:"plink_1UAuyh68Ef1eoQ8vSFkh5Xv0"},
 "PIGA-PROD-005":{price:"price_1UAuoh68Ef1eoQ8v5GBNfz90",amount:1290000,link:"plink_1UAuz768Ef1eoQ8vFUKEQIdK"},
 "PIGA-PROD-011":{price:"price_1UAuq468Ef1eoQ8vcFzHmMT8",amount:2490000,link:"plink_1UAuzF68Ef1eoQ8vTFeu1OKD"},
 "PIGA-PROD-022":{price:"price_1UAurf68Ef1eoQ8vIUqBCQce",amount:2490000,link:"plink_1UAuzg68Ef1eoQ8vFz486i4e"},
 "PIGA-PROD-043":{price:"price_1UAuv168Ef1eoQ8vaLoiIqwX",amount:149000,link:"plink_1UAuzq68Ef1eoQ8veMuLx9ys"},
 "PIGA-BUNDLE-01":{price:"price_1UAuvn68Ef1eoQ8vF2f2RLAG",amount:1390000,link:"plink_1UAv0268Ef1eoQ8v4BlfeUDM"},
 "PIGA-BUNDLE-07":{price:"price_1UAuxo68Ef1eoQ8v9OmxtrlK",amount:4490000,link:"plink_1UAv0Q68Ef1eoQ8v1yvw5nOA"}
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
async function verifySignedPayload(raw:string,signature:string,secret:string):Promise<boolean>{
 const ts=/[,\s]t=(\d+)/.exec(","+signature)?.[1];
 const values=[...signature.matchAll(/(?:^|,)v1=([a-f0-9]{64})(?:,|$)/ig)].map(x=>x[1].toLowerCase());
 if(!ts||!values.length)return false;
 const date=Number(ts);
 if(!Number.isSafeInteger(date)||Math.abs(Math.floor(Date.now()/1000)-date)>300)return false;
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const digest=new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(ts+"."+raw)));
 const hex=Array.from(digest,b=>b.toString(16).padStart(2,"0")).join("");
 return values.some(x=>{let different=0;for(let i=0;i<64;i++)different|=x.charCodeAt(i)^hex.charCodeAt(i);return different===0;});
}
async function stripe(path:string,key:string):Promise<any>{
 const r=await fetch("https://api.stripe.com/v1/"+path,{headers:{"authorization":"Bearer "+key}});
 if(!r.ok)throw Error("STRIPE_READBACK_FAILED_"+r.status);
 return r.json();
}
async function supa(url:string,service:string,path:string,method="GET",body?:unknown):Promise<any>{
 const r=await fetch(url+"/rest/v1/"+path,{
  method,headers:{"apikey":service,"authorization":"Bearer "+service,"content-type":"application/json","prefer":"return=representation"},body:body===undefined?undefined:JSON.stringify(body)
 });
 if(!r.ok)throw Error("EVIDENCE_DATABASE_UNAVAILABLE_"+r.status);
 const raw=await r.text();return raw?JSON.parse(raw):null;
}
async function readbackPaid(sessionId:string,key:string){
 const session=await stripe("checkout/sessions/"+encodeURIComponent(sessionId),key);
 const sku=String(session?.metadata?.sku||""),offer=CATALOG[sku];
 const owner=String(session?.client_reference_id||""),email=String(session?.customer_details?.email||"");
 if(session?.metadata?.piga_origin!=="aiact-intelligence")return null; // Another product in the shared Stripe account
 if(!offer||session.id!==sessionId||!/^cs_live_[a-zA-Z0-9]{8,256}$/.test(sessionId)
  ||!/^[-a-f0-9]{36}$/i.test(owner)||!email.includes("@")||session.livemode!==true
  ||session.mode!=="payment"||session.status!=="complete"||session.currency!=="eur"
  ||session.amount_total!==offer.amount||typeof session.payment_intent!=="string")throw Error("ADMISSION_OR_CATALOG_MISMATCH");
 if(session.payment_status!=="paid")return {state:"UNPAID",session,sku,owner};
 const items=await stripe("checkout/sessions/"+encodeURIComponent(sessionId)+"/line_items?limit=10",key);
 if(items.has_more||!Array.isArray(items.data)||items.data.length!==1||items.data[0]?.price?.id!==offer.price||items.data[0]?.quantity!==1)
  throw Error("LINE_ITEM_MISMATCH");
 const intent=await stripe("payment_intents/"+encodeURIComponent(session.payment_intent)+"?expand%5B%5D=latest_charge",key);
 const charge=intent.latest_charge;
 if(intent.status!=="succeeded"||intent.amount_received<offer.amount||typeof charge!=="object"
  ||charge.paid!==true||charge.refunded===true||charge.disputed===true||(charge.amount_refunded||0)>0)throw Error("PAYMENT_EFFECT_NOT_VERIFIED");
 const idbytes=new TextEncoder().encode(sessionId+"|"+intent.id+"|"+owner);
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",idbytes)),b=>b.toString(16).padStart(2,"0")).join("");
 return {state:"PAID",session,sku,offer,owner,intent,verification_id:"verify_"+digest};
}
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return json({error:"METHOD_NOT_ALLOWED"},405);
 const whsec=Deno.env.get("STRIPE_WEBHOOK_SECRET")||"";
 const key=Deno.env.get("STRIPE_SECRET_KEY")||"";
 const db=Deno.env.get("SUPABASE_URL")||"";
 const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!whsec.startsWith("whsec_")||!key.startsWith("sk_live_")||!db.startsWith("https://")||!service)
  return json({error:"WEBHOOK_RUNTIME_NOT_ADMITTED"},503);
 const raw=await req.text();
 if(raw.length>262144)return json({error:"PAYLOAD_TOO_LARGE"},413);
 if(!await verifySignedPayload(raw,req.headers.get("stripe-signature")||"",whsec))
  return json({error:"STRIPE_SIGNATURE_INVALID"},400);
 let event:any;
 try{event=JSON.parse(raw)}catch{return json({error:"INVALID_JSON"},400)}
 if(!/^evt_[a-zA-Z0-9]+$/.test(String(event?.id||""))||event.livemode!==true||typeof event.type!=="string")
  return json({error:"EVENT_NOT_ADMITTED"},400);
 const eventId=encodeURIComponent(event.id),obj=event.data?.object||{};
 const known=new Set(["checkout.session.completed","checkout.session.async_payment_succeeded","charge.refunded","charge.dispute.created"]);
 if(!known.has(event.type))return json({ok:true,ignored:true});
 try{
  const previous=await supa(db,service,"aiact_webhook_events?event_id=eq."+eventId+"&select=event_id,processing_status");
  if(previous?.length)return json({ok:true,replayed:true});
  let status="IGNORED",objectId=String(obj.id||"");
  if(event.type==="checkout.session.completed"||event.type==="checkout.session.async_payment_succeeded"){
   const id=String(obj.id||"");
   if(!/^cs_live_[a-zA-Z0-9]{8,256}$/.test(id))throw Error("INVALID_CHECKOUT_ID");
   const paid=await readbackPaid(id,key);
   if(paid?.state==="UNPAID")status="UNPAID";
   else if(paid?.state==="PAID"){
    const payload={p_event_id:paid.verification_id,p_session:id,p_payment_intent:paid.intent.id,
      p_owner:paid.owner,p_payment_link:paid.offer.link,p_sku:paid.sku,
      p_amount:paid.offer.amount,p_currency:"eur"};
    const granted=await supa(db,service,"rpc/aiact_grant_paid_license","POST",payload);
    if(granted!==true)throw Error("LICENCE_GRANT_NOT_CONFIRMED");
    status="GRANTED";
   }
  }else{
   let paymentIntent=String(obj.payment_intent||"");
   if(event.type==="charge.dispute.created"&&!paymentIntent&&typeof obj.charge==="string"){
    const charge=await stripe("charges/"+encodeURIComponent(obj.charge),key);
    paymentIntent=String(charge?.payment_intent||"");
   }
   if(/^pi_[A-Za-z0-9]+$/.test(paymentIntent)){
    const receipts=await supa(db,service,"aiact_payment_receipts?stripe_payment_intent=eq."+encodeURIComponent(paymentIntent)+"&select=owner_id,sku,stripe_checkout_session");
    if(Array.isArray(receipts)&&receipts.length){
     let changed=0;
     for(const receipt of receipts){
      if(!receipt.owner_id||!receipt.sku||!receipt.stripe_checkout_session)throw Error("RECEIPT_OWNER_SCOPE_MISSING");
      const qs="aiact_entitlements?owner_id=eq."+encodeURIComponent(receipt.owner_id)+"&sku=eq."+encodeURIComponent(receipt.sku)
       +"&stripe_checkout_session=eq."+encodeURIComponent(receipt.stripe_checkout_session);
      const updated=await supa(db,service,qs,"PATCH",{status:"REVOKED",expires_at:new Date().toISOString()});
      if(!Array.isArray(updated))throw Error("REVOCATION_READBACK_MISSING");
      changed+=updated.length;
     }
     status=changed>0?"REVOKED":"IGNORED";
    }
   }
  }
  // Stable event key avoids duplicate message consequences. Protected service role only.
  await supa(db,service,"aiact_webhook_events","POST",{event_id:event.id,event_type:event.type,processing_status:status,stripe_object_id:objectId});
  return json({ok:true,processed:status});
 }catch(e){
  // Never return the raw payment/owner payload or secrets. Stripe retries non-2xx.
  return json({error:"WEBHOOK_RECEIPT_UNCONFIRMED",category:String((e as Error)?.message||"unknown").slice(0,90)},503);
 }
});
