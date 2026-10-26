'use strict';
/* Deterministic read-only data consistency checks. No clinical inferences and no repairs. */
window.PigaOrthoIntegrity=(()=>{
 const isObject=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const asArray=x=>Array.isArray(x)?x:[];
 const hash=async(value)=>{
  const src=new TextEncoder().encode(JSON.stringify(value));
  const buffer=await crypto.subtle.digest('SHA-256',src);
  return [...new Uint8Array(buffer)].map(x=>x.toString(16).padStart(2,'0')).join('');
 };
 function inspect(suite,direct){
  const counts={},issues=[],maxIssues=150;
  const issue=(severity,code,section,description)=>{
   if(issues.length<maxIssues)issues.push({severity,code,section,description});
  };
  const exists={suite:isObject(suite)&&suite.version===1,direct:isObject(direct)&&direct.version===1};
  if(!exists.suite)issue('INFO','NO_SUITE_DATA','suite','Noch keine gespeicherten Praxis- und Inventur-Testdaten.');
  if(!exists.direct)issue('INFO','NO_DIRECT_DATA','direct','Noch keine lokal gespeicherten Fall- und Kalender-Testdaten.');
  const checkRecords=(name,data,fields)=>{
   if(!data)return;
   for(const field of fields){
    const values=data[field];
    if(!Array.isArray(values)){
     issue('ERROR','INVALID_COLLECTION',name+'.'+field,'Erwarteter lokaler Datenbereich ist keine Liste.');
     continue;
    }
    counts[name+'.'+field]=values.length;
    if(values.length>100000){issue('WARN','HIGH_RECORD_COUNT',name+'.'+field,'Außergewöhnlich viele Testeinträge vorhanden.');continue;}
    const ids=new Set();
    for(const record of values){
     if(!isObject(record)){issue('ERROR','INVALID_RECORD',name+'.'+field,'Mindestens ein Datensatz hat keine gültige Objektstruktur.');continue;}
     const key=record.id;
     if(key!==undefined){
      if(typeof key!=='string'||!key){issue('WARN','INVALID_ID',name+'.'+field,'Mindestens eine Kennung ist leer oder ungültig.');continue;}
      if(ids.has(key)){issue('ERROR','DUPLICATE_ID',name+'.'+field,'Doppelte interne Datensatzkennung erkannt.');break;}
      ids.add(key);
     }
    }
   }
  };
  checkRecords('suite',suite,['staff','inventory','shifts']);
  checkRecords('direct',direct,['cases','tasks','calendar','inventory','team','audit']);
  if(exists.direct){
   const cases=asArray(direct.cases),caseIds=new Set(cases.map(c=>c?.id).filter(Boolean));
   const refs=new Set();
   for(const c of cases){
    if(!isObject(c))continue;
    const ref=String(c.ref||'').trim().toUpperCase();
    if(ref&&refs.has(ref)){issue('ERROR','DUPLICATE_CASE_REF','direct.cases','Ein Auftragskürzel ist mehrfach vergeben.');break}
    if(ref)refs.add(ref);
   }
   for(const field of ['tasks','calendar']){
    for(const item of asArray(direct[field])){
     if(!isObject(item))continue;
     const related=item.caseId||item.refId;
     if(related&&!caseIds.has(related)){
      issue('WARN','ORPHAN_REFERENCE','direct.'+field,'Ein Eintrag verweist auf einen nicht vorhandenen Testauftrag.');break;
     }
    }
   }
   for(const item of asArray(direct.calendar)){
    if(item?.start&&Number.isNaN(Date.parse(String(item.start)))){
     issue('WARN','INVALID_DATE','direct.calendar','Mindestens ein Kalendereintrag hat ein ungültiges Datum.');break;
    }
   }
  }
  if(exists.suite){
   const codes=new Set();
   for(const item of asArray(suite.inventory)){
    if(!isObject(item))continue;
    const sku=String(item.sku||'').trim().toUpperCase();
    if(sku&&codes.has(sku)){issue('WARN','DUPLICATE_STOCK_CODE','suite.inventory','Materialartikelnummer ist mehrfach vergeben.');break;}
    if(sku)codes.add(sku);
    if(item.quantity!==undefined&&(!Number.isFinite(Number(item.quantity))||Number(item.quantity)<0)){
     issue('WARN','STOCK_INVALID','suite.inventory','Mindestens eine Menge ist negativ oder ungültig.');break;
    }
   }
  }
  const summary={errors:issues.filter(i=>i.severity==='ERROR').length,warnings:issues.filter(i=>i.severity==='WARN').length,
   information:issues.filter(i=>i.severity==='INFO').length,
   status:issues.some(i=>i.severity==='ERROR')?'REVIEW_REQUIRED':issues.some(i=>i.severity==='WARN')?'REVIEW_RECOMMENDED':'STRUCTURE_OK'};
  return {schema:'piga-ortho-local-integrity.v1',scope:'browser-local technical test records',
   exists,counts,issues,summary,
   caveat:'Read-only strukturierte Plausibilitätsprüfung. Keine Prüfung auf medizinische Richtigkeit, digitale Signatur oder manipulationssichere Herkunft.'};
 }
 async function audit(suite,direct){
  const result=inspect(suite,direct);
  result.generatedAt=new Date().toISOString();
  result.digest={suite:suite?await hash(suite):null,direct:direct?await hash(direct):null};
  result.digestDescription='SHA-256 des JSON.stringify der jeweils geladenen lokalen Datenstruktur; kein kryptografisch signierter Nachweis.';
  return result;
 }
 return {inspect,audit};
})();
