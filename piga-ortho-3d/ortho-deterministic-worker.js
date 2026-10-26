/* PIGA ORTHO offline deterministic calculation core v1.5.
   Bounded computation; no fetch, credentials, network, patient identities or AI.
   Outputs clinical HYPOTHESES only; NO clinical approval, diagnosis certification or device actions. */
'use strict';
(function(root){
 const fmt=n=>Math.round((n+Number.EPSILON)*1000000)/1000000;
 const finite=(a,n,label)=>{if(!Array.isArray(a)||a.length!==n||!a.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=1&&v<=25))throw Error(label+': exactly '+n+' measured tooth widths in millimetres (1..25) required')};
 const sum=a=>a.reduce((a,b)=>a+b,0);
 function calculate(data){
  if(!data||data.schema!=='piga-ortho-offline.v1')throw Error('Invalid schema');
  if(data.units!=='mm'||data.calibrated!==true)throw Error('PIGA GATE1 DELAY: valid mm calibration and units required');
  if(data.landmarks_verified!==true)throw Error('PIGA GATE1 DELAY: human-validated landmarks required');
  if(data.source!=='synthetic'&&data.source!=='clinician_measured')throw Error('PIGA GATE1 BLOCK: untraceable origin');
  finite(data.upper_anterior,6,'upper_anterior');finite(data.lower_anterior,6,'lower_anterior');
  const upper=sum(data.upper_anterior),lower=sum(data.lower_anterior);
  if(upper<=0||lower<=0)throw Error('PIGA GATE1 BLOCK: invalid denominator');
  const ratio=fmt(100*lower/upper);
  // Classical Bolton anterior tooth-size ratio 77.2%, reference only,
  // NOT a classification threshold, validated diagnosis or recommended intervention.
  const reference=77.2, referenceExcess=fmt(lower-(upper*reference/100));
  let space=null;
  if(data.arch_length_mm!==undefined||data.required_tooth_width_mm!==undefined){
   if(!Number.isFinite(data.arch_length_mm)||!Number.isFinite(data.required_tooth_width_mm)||
     data.arch_length_mm<=0||data.required_tooth_width_mm<=0||
     data.arch_length_mm>200||data.required_tooth_width_mm>200)throw Error('PIGA GATE1 DELAY: valid arch-length measures missing');
   space=fmt(data.arch_length_mm-data.required_tooth_width_mm);
  }
  const provisional = referenceExcess>0?'lower_relative_to_reference':referenceExcess<0?'upper_relative_to_reference':'near_reference';
  const warnings=['No clinical diagnosis from mesiodistal widths alone','No measurement-error confidence interval provided','Reference ratio is descriptive and population-dependent','Clinical examination, occlusion and radiographs where indicated remain external'];
  if(data.source==='synthetic')warnings.push('SYNTHETIC FIXTURE — do not apply to patients');
  const result={schema:'piga-ortho-calculation.v1',status:'HYPOTHESIS_UNVALIDATED',algorithm:'BOLTON_ANTERIOR_WIDTH_RATIO',
    input_origin:data.source,units:'mm',ratio_percent:ratio,
    upper_sum_mm:fmt(upper),lower_sum_mm:fmt(lower),reference_percent:reference,
    difference_from_reference_percentage_points:fmt(ratio-reference),
    lower_width_excess_against_reference_mm:referenceExcess,
    possible_tooth_size_relationship:provisional,arch_space_balance_mm:space,
    suggestion:'Physician: recheck calibrated landmark widths, repeat measurement and correlate with full clinical examination; do not infer or prescribe an appliance from this ratio.',
    piga:{gate1:'ALLOW_TECHNICAL_CALCULATION_ONLY',gate2:'BLOCK_MEDICAL_ACTION_UNTIL_CLINICAL_VALIDATION_AND_PHYSICIAN_APPROVAL',unknown:warnings},
    a7sem:[
      'S1 measured numeric input with units and origin',
      'S2 tooth-width sums and ratio',
      'S3 compared against an explicitly disclosed reference',
      'S4 potential measurement-system uncertainty',
      'S5 hypothesis not verified diagnosis',
      'S6 doctor review and repeatability',
      'S7 record evidence and only bounded authorized actions'],
    a7sem_reverse:{input_sum_reconstruction:fmt(upper),reconstructed_ratio:fmt(100*lower/upper),round_trip_ok:Math.abs(100*lower/upper-ratio)<1e-5},
    warnings};
  return result;
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={calculate};
 if(root&&typeof root.postMessage==='function')root.onmessage=function(event){
  const id=event?.data?.id;try{
   if(typeof id!=='string'||id.length>72)throw Error('Invalid bounded work item');
   const result=calculate(event.data.payload);
   root.postMessage({id,ok:true,result});
  }catch(e){root.postMessage({id,ok:false,error:String(e.message||'Invalid work item').slice(0,240)})}
 };
})(typeof self!=='undefined'?self:null);
