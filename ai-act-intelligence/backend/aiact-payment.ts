import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// PIGA AI Act Intelligence licensed checkout + server-side Stripe readback.
// No compliance verdict or licence entitlement may originate from a browser claim.
const CATALOG:Record<string,{price:string,amount:number,paymentLink:string}>={
 "PIGA-PROD-001":{price:"price_1UAulj68Ef1eoQ8vGk3O3zLb",amount:790000,paymentLink:"plink_1UAuyW68Ef1eoQ8vvsBHv88w"},
 "PIGA-PROD-002":{price:"price_1UAunN68Ef1eoQ8vCoqWMrvD",amount:790000,paymentLink:"plink_1UAuyh68Ef1eoQ8vSFkh5Xv0"},
 "PIGA-PROD-005":{price:"price_1UAuoh68Ef1eoQ8v5GBNfz90",amount:1290000,paymentLink:"plink_1UAuz768Ef1eoQ8vFUKEQIdK"},
 "PIGA-PROD-011":{price:"price_1UAuq468Ef1eoQ8vcFzHmMT8",amount:2490000,paymentLink:"plink_1UAuzF68Ef1eoQ8vTFeu1OKD"},
 "PIGA-PROD-022":{price:"price_1UAurf68Ef1eoQ8vIUqBCQce",amount:2490000,paymentLink:"plink_1UAuzg68Ef1eoQ8vFz486i4e"},
 "PIGA-PROD-043":{price:"price_1UAuv168Ef1eoQ8vaLoiIqwX",amount:149000,paymentLink:"plink_1UAuzq68Ef1eoQ8veMuLx9ys"},
 "PIGA-BUNDLE-01":{price:"price_1UAuvn68Ef1eoQ8vF2f2RLAG",amount:1390000,paymentLink:"plink_1UAv0268Ef1eoQ8v4BlfeUDM"},
 "PIGA-BUNDLE-07":{price:"price_1UAuxo68Ef1eoQ8v9OmxtrlK",amount:4490000,paymentLink:"plink_1UAv0Q68Ef1eoQ8v1yvw5nOA"}
};
const ORIGINS=new Set(["https://mounirakarkach04-pixel.github.io","https://pigapocket.com","https://www.pigapocket.com","capacitor://localhost","http://localhost"]);
const FRONTEND="https://mounirakarkach04-pixel.github.io/ados/ai-act-intelligence/";
const cors=(o:string)=>({"content-type":"application/json","cache-control":"no-store","vary":"Origin","access-control-allow-origin":ORIGINS.has(o)?o:"","access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"authorization,apikey,content-type"});
async function digest(t:string){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");}
async function stripe(path:string,key:string,params?:URLSearchParams) {
 const r=await fetch("https://api.stripe.com/v1/"+path,{method:params?"POST":"GET",headers:{"authorization":"Bearer "+key,...(params?{"content-type":"application/x-www-form-urlencoded"}:{})},body:params?.toString()});
 const json=await r.json().catch(()=>({}));
 if(!r.ok)throw Error("STRIPE_REQUEST_FAILED_"+r.status);
 return json;
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin")||"";
 const headers=cors(origin);
 const respond=(json:unknown,status=200)=>new Response(JSON.stringify(json),{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return respond({error:"METHOD_NOT_ALLOWED"},405);
 if(origin&&!ORIGINS.has(origin))return respond({error:"ORIGIN_NOT_ALLOWED"},403);
 const auth=req.headers.get("authorization")||"";
 const supabase=Deno.env.get("SUPABASE_URL"),pub=Deno.env.get("SUPABASE_ANON_KEY");
 const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 const secret=Deno.env.get("STRIPE_SECRET_KEY");
 if(!supabase||!pub)return respond({error:"AUTH_CONFIGURATION_MISSING"},503);
 if(!auth.startsWith("Bearer "))return respond({error:"AUTH_REQUIRED"},401);
 const u=await fetch(supabase+"/auth/v1/user",{headers:{apikey:pub,authorization:auth}});
 if(!u.ok)return respond({error:"AUTH_INVALID"},401);
 const user=await u.json().catch(()=>null);
 if(!user?.id||!user?.email)return respond({error:"VERIFIED_ACCOUNT_REQUIRED"},403);
 if(!secret?.startsWith("sk_live_"))return respond({error:"STRIPE_LIVE_CHECKOUT_NOT_CONFIGURED"},503);
 let input:any;
 try{input=await req.json()}catch{return respond({error:"INVALID_JSON"},400)}
 const sku=typeof input?.sku==="string"?input.sku:"";
 const product=CATALOG[sku];
 if(input?.operation==="checkout"){
   if(!product)return respond({error:"UNKNOWN_OFFER"},400);
   const payload=new URLSearchParams();
   payload.set("mode","payment");
   payload.set("line_items[0][price]",product.price);
   payload.set("line_items[0][quantity]","1");
   payload.set("client_reference_id",user.id);
   payload.set("customer_email",user.email);
   payload.set("metadata[sku]",sku);
   payload.set("metadata[piga_origin]","aiact-intelligence");
   payload.set("success_url",FRONTEND+"?payment=success&session_id={CHECKOUT_SESSION_ID}#licensing");
   payload.set("cancel_url",FRONTEND+"?payment=cancel#licensing");
   try {
     const session=await stripe("checkout/sessions",secret,payload);
     const url=new URL(session.url);
     if(url.protocol!=="https:"||!url.hostname.endsWith(".stripe.com"))throw Error("INVALID_PAYMENT_DESTINATION");
     return respond({url:session.url,session_id:session.id,offer:sku});
   }catch{return respond({error:"CHECKOUT_UNAVAILABLE"},503)}
 }
 if(input?.operation!=="confirm")return respond({error:"UNKNOWN_OPERATION"},400);
 if(!service)return respond({error:"LICENSING_BACKEND_UNAVAILABLE"},503);
 const sessionId=typeof input?.session_id==="string"?input.session_id:"";
 if(!/^cs_live_[a-zA-Z0-9]{8,256}$/.test(sessionId))return respond({error:"INVALID_SESSION_ID"},400);
 try {
   const session=await stripe("checkout/sessions/"+encodeURIComponent(sessionId),secret);
   const actualSku=String(session?.metadata?.sku||"");
   const item=CATALOG[actualSku];
   if(!item||session.id!==sessionId||session.client_reference_id!==user.id||session.customer_details?.email?.toLowerCase()!==user.email.toLowerCase()||session?.metadata?.piga_origin!=="aiact-intelligence"||session.payment_status!=="paid"||session.status!=="complete"||session.livemode!==true||session.mode!=="payment"||session.currency!=="eur"||session.amount_total!==item.amount||!/^pi_[A-Za-z0-9]+$/.test(String(session.payment_intent||"")))
      return respond({error:"PAYMENT_NOT_ADMITTED"},403);
   const lineItems=await stripe("checkout/sessions/"+encodeURIComponent(sessionId)+"/line_items?limit=10",secret);
   if(lineItems.has_more||!Array.isArray(lineItems.data)||lineItems.data.length!==1||lineItems.data[0].price?.id!==item.price||lineItems.data[0].quantity!==1)
      return respond({error:"PRODUCT_NOT_VERIFIED"},403);
   const intent=await stripe("payment_intents/"+encodeURIComponent(session.payment_intent)+"?expand%5B%5D=latest_charge",secret);
   const charge=intent.latest_charge;
   if(intent.status!=="succeeded"||intent.amount_received<item.amount||typeof charge!=="object"||charge?.paid!==true||charge?.refunded===true||charge?.disputed===true||(charge?.amount_refunded||0)>0)
      return respond({error:"PAYMENT_EFFECT_NOT_VERIFIED"},403);
   const verificationId="verify_"+await digest(sessionId+"|"+intent.id+"|"+user.id);
   const rpc=await fetch(supabase+"/rest/v1/rpc/aiact_grant_paid_license",{
     method:"POST",headers:{"apikey":service,"authorization":"Bearer "+service,"content-type":"application/json"},
     body:JSON.stringify({p_event_id:verificationId,p_session:sessionId,p_payment_intent:intent.id,p_owner:user.id,p_payment_link:item.paymentLink,p_sku:actualSku,p_amount:item.amount,p_currency:"eur"})
   });
   if(!rpc.ok)return respond({error:"ENTITLEMENT_COMMIT_FAILED"},503);
   if(await rpc.json()!==true)return respond({error:"ENTITLEMENT_NOT_GRANTED"},403);
   return respond({ok:true,sku:actualSku,verified_at:new Date().toISOString(),grant_source:"stripe_server_readback"});
 }catch{return respond({error:"PAYMENT_VERIFICATION_UNAVAILABLE"},503)}
});