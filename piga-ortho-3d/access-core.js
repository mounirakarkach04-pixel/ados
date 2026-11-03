/* PIGA ORTHO 3D · fail-closed role and workflow helpers. Not a medical-device clearance. */
(function(root,factory){const mod=factory();if(typeof module==='object'&&module.exports)module.exports=mod;else root.PigaOrthoAccessCore=mod;})(typeof globalThis!=='undefined'?globalThis:this,()=>{'use strict';
const TEMPLATE=[
 ['scan_units','Scan und mm-Einheit gegen Messreferenz kontrollieren'],
 ['segmentierung','FDI-Zähne und Segmentierungsgrenzen unabhängig prüfen'],
 ['kiefer_registration','Ober-/Unterkiefer-Registrierung und Bezugslage beurteilen'],
 ['okklusion','Okklusion und Kontakte klinisch prüfen'],
 ['wurzeln_knochen','Wurzel-/Knochenlage und Bilddatengrundlage beurteilen'],
 ['bewegungsgrenzen','Einzelzahn-Bewegungsgrenzen individuell beurteilen'],
 ['stufen_geometrie','Staging-Geometrie und technische Modellfehler prüfen'],
 ['druck_modell','Druckgeometrie, Modellbasis und geschlossene Oberfläche prüfen'],
 ['druck_material','Drucker, Material, Slicerprofil und Aushärtung prüfen'],
 ['aerztliche_kontrolle','Abschließende ärztliche Kontrolle dokumentieren']
];
const ALLOWED=new Set(['owner','employee','accountant']);
function role(value){return ALLOWED.has(value)?value:null;}
function permitted(value,action){
 const r=role(value);if(!r)return false;
 return ({
   viewTasks:['owner','employee'],
   acknowledge:['owner','employee'],
   createCases:['owner'],
   inviteStaff:['owner'],
   assignPosition:['owner'],
   finalizeAdminCase:['owner'],
   seeClinicCost:['owner','accountant'],
   downloadResearchPrint:['owner'],
   viewDirectory:['owner']
 })[action]?.includes(r)||false;
}
function canRespond(role,task){return permitted(role,'acknowledge')&&(!String(task?.title||'').startsWith('aerztliche_kontrolle:')||role==='owner');}
const safeRef=s=>typeof s==='string'&&/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(s);
const validInvite=s=>typeof s==='string'&&/^PIGA-STAFF-[A-F0-9]{48}$/.test(s);
function taskSummary(tasks){
 const t=Array.isArray(tasks)?tasks:[];
 return {total:t.length,pending:t.filter(x=>x.state!=='done').length,done:t.filter(x=>x.state==='done').length,checkedCodes:TEMPLATE.filter(([k])=>t.some(x=>x.title.startsWith(k+':')&&x.state==='done')).map(([k])=>k)};
}
function expectedTasks(caseId,clinicId,userId){
 return TEMPLATE.map(([code,label])=>({clinic_id:clinicId,case_id:caseId,title:code+': '+label,state:'open',created_by:userId,note:''}));
}
const PRINT_SUFFIX=/\.(?:gcode|bgcode|3mf|ctb|photon|pws)$/i;
function assessMachineFile(file){
 if(!file||!PRINT_SUFFIX.test(String(file.name||'')))return{ok:false,reason:'Nur .gcode, .bgcode, .3mf, .ctb, .photon oder .pws.'};
 if(!Number.isInteger(file.size)||file.size<64||file.size>80*1024*1024)return{ok:false,reason:'Dateigröße muss zwischen 64 Byte und 80 MiB liegen.'};
 return{ok:true,reason:'Dateiendung und Größe geprüft – kein Sicherheits-, Format-, Slicer- oder Gerätefunktionsnachweis.'};
}
return{TEMPLATE,role,permitted,canRespond,safeRef,validInvite,taskSummary,expectedTasks,assessMachineFile};
});
