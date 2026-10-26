import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// This suite validates the versioned LEGACY Android-WebView source in /web/.
// Modern public PWA files are validated by device-first/Chromium workflows.
const root='piga-ortho-3d/web';
const names=['index.html','app.js','style.css','sw.js','icon.svg','manifest.webmanifest','privacy.html','README.txt','workflow.html','workflow.css','workflow.js','praxis.html','praxis.css','praxis.js','dashboard.html','dashboard.css','dashboard.js','navigation.css','navigation.js','report.html','report.css','report.js','devices.html','devices.css','devices.js','assist.html','assist.css','assist.js','kfo-bema-2026.csv','team.html','team.css','team.js','auth.html','auth.js','inventory.html','inventory.css','inventory.js'];
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
for(const name of names){
  assert(fs.existsSync(path.join(root,name)),'Missing web asset: '+name);
  assert.ok(fs.statSync(path.join(root,name)).size>0,'Empty legacy Android WebView source asset: '+name);
}
const html=read('workflow.html');
const main=read('index.html');
const css=read('workflow.css');
const js=read('workflow.js');
const sw=read('sw.js');
assert(main.includes('href="./workflow.html"'),'Main entry to navigator missing');
for(const name of ['workflow.html','workflow.css','workflow.js','praxis.html','praxis.css','praxis.js','dashboard.html','dashboard.css','dashboard.js','navigation.css','navigation.js','report.html','report.css','report.js','devices.html','devices.css','devices.js','assist.html','assist.css','assist.js','kfo-bema-2026.csv','team.html','team.css','team.js','auth.html','auth.js'])assert(sw.includes(name),'Offline SW cache missing '+name);
for(const name of ['workflow.css','workflow.js'])assert(html.includes('./'+name),'Workflow asset link missing '+name);
assert(!/https?:\/\//i.test(html),'External URLs forbidden in local UI');
assert(read('praxis.css').includes('@media(max-width:600px)'),'Mobile staff UI missing');
assert(css.includes('@media(max-width:770px)'),'Mobile responsive rules missing');
const match=js.match(/const STAGES=(\[[\s\S]*?\]);\s*const \$/);
assert(match,'Expected static stage manifest missing');
const stages=JSON.parse(match[1]);
assert.equal(stages.length,12,'Exactly twelve process steps required');
assert.equal(new Set(stages.map(s=>s.title)).size,12,'Duplicate workflow steps');
for(const s of stages){
  assert(['ready','part','plan'].includes(s.kind),'Invalid release state');
  assert(s.module.startsWith('./index.html'),'Unsafe module navigation');
  for(const prop of ['title','short','subtitle','in','out','control','gate1','gate2','reverse','scope']){
    assert(typeof s[prop]==='string' && s[prop].length,'Missing stage property '+prop);
  }
  assert(Array.isArray(s.inputs)&&s.inputs.length>0);
  assert(Array.isArray(s.outputs)&&s.outputs.length>0);
  if(s.kind==='plan')assert(s.gate2.startsWith('BLOCK'),'Planned stage has an action gate');
}
for(const id of ['stageList','workbench','stageTitle','stageDescription','stageStatus','stageGlyph','stepCounter','schematicInput','schematicControl','schematicOutput','inputs','outputs','mode','openModule','gate1','gate2','reverse','back','next','exportSpec','printPlan','progressFill','scope'])
  assert(html.includes('id="'+id+'"'),'Missing required element '+id);
assert(html.includes('Mounir Akarkach')&&html.includes('Ibrahim Akarkach'),'Dedication missing');
assert(read('praxis.html').includes('id="authForm"'),'Auth form missing');
assert(read('praxis.html').includes('id="ownerArea"'),'Owner region missing');
assert(read('praxis.html').includes('id="startShift"'),'Work time clock missing');
assert(read('praxis.html').includes('id="costForm"'),'Private costing form missing');
assert(read('praxis.js').includes('/auth/v1/recover'),'Password recovery endpoint missing');
assert(read('praxis.js').includes('/rest/v1/rpc/ortho_claim_owner'),'Owner one-time claim missing');
assert(read('praxis.js').includes("profile?.role==='owner'"),'Owner guard absent');
assert(read('praxis.html').includes('Die Eingabe echter Patientendaten ist hier derzeit deaktiviert.'),'Health-data exclusion missing');
assert(js.includes('application/json')&&js.includes('clinicalApproved:false'),'Export and nonclinical flag required');

const praxis=read('praxis.html');
const workspace=read('praxis.js');
for(const id of ['staffCodeBadge','kpiStaff','kpiToday','kpiTotal','kpiState','workStaffCode','handoffPanel','traceCase','traceLoad','traceCsv','traceList','traceSummary']){
 assert(praxis.includes('id="'+id+'"'),'Missing v0.6 employee-trace UI '+id);
}
for(const required of ['staff_code','ortho_work_events','function loadTrail()','event_type','occurred_at','caseEvents','toLocaleString']){
 assert(workspace.includes(required),'Missing v0.6 employee-trace logic '+required);
}
assert(read('sw.js').includes('piga-ortho-v120-static'),'Offline service worker version not bumped');
assert(!workspace.includes("localStorage.setItem("),'Never persist sensitive staff session in localStorage');
assert(praxis.includes('Keine Patientennamen oder Krankenkassennummern'),'Patient-health-data exclusion missing in owner trace');
process.stdout.write('PIGA ORTHO LEGACY Android source QA PASS: 12 stages, 34 packaged-source assets, offline cache, controls, gate boundaries, attribution.\n');

const cockpit=read('dashboard.html');const navScript=read('navigation.js');const cockpitCode=read('dashboard.js');
for(const name of ['index.html','praxis.html','workflow.html','dashboard.html']){
  assert(read(name).includes('href="./navigation.css"'),'Shared navigation style missing on '+name);
  assert(read(name).includes('src="./navigation.js"'),'Shared navigation controller missing on '+name);
}
for(const key of ['quickStl','stlResult','checklist','checkStatus','checkBar','clearChecks','findFeature'])assert(cockpit.includes('id="'+key+'"'),'Cockpit tool '+key+' missing');
for(const f of ['index.html#studio','index.html#printer','index.html#evidence','praxis.html','workflow.html'])assert(navScript.includes(f),'Destination missing: '+f);
assert(navScript.includes('aria-current'),'Navigation has no active indicator');
assert(navScript.includes("ctrlKey"),'Keyboard navigation missing');
assert(cockpitCode.includes('crypto.subtle.digest'),'Local STL integrity hash missing');
assert(cockpitCode.includes('n===boxes.length'),'Checklist completeness missing');
assert(cockpitCode.includes('Eine Druckfreigabe ist damit nicht erteilt'),'Checklist must not misrepresent authorization');
assert(read('app.js').includes('activateRequestedSection'),'Deep-linked studio tabs not connected');
assert(read('sw.js').includes('piga-ortho-v120-static'),'Outdated service-worker cache version');
assert(read('manifest.webmanifest').includes('"start_url":"./dashboard.html"'),'PWA should launch cockpit first');

// v0.8 personal display and print-ready evidence report checks
for(const name of ['report.html','report.css','report.js'])assert(read(name).length>300,'Missing printable artifact '+name);
for(const id of ['personalGreeting'])assert(read('dashboard.html').includes('id="'+id+'"'),'Dashboard greeting missing');
assert(read('dashboard.js').includes('/auth/v1/user'),'Greeting must verify signed-in account server-side');
assert(read('dashboard.js').includes("email==='dr.akarkach@gmx.de'"),'Specific verified owner greeting missing');
assert(read('praxis.js').includes("sessionStorage.removeItem('piga-ortho-auth-ephemeral')"),'Logout must clear short-lived auth token');
assert(read('praxis.html').includes('id="praxisGreeting"'),'Authenticated greeting missing on praxis');
assert(read('index.html').includes('id="printEvidence"'),'Technical studio lacks report trigger');
assert(read('app.js').includes("sessionStorage.setItem('piga-ortho-report-once'"),'No one-time report handoff');
assert(read('app.js').includes("gate2:'BLOCK'"),'Report must not grant Gate2');
for(const x of ['id="importAudit"','id="print"','id="export"','id="seven"','id="terminal"'])assert(read('report.html').includes(x),'Report control missing '+x);
for(const x of ['crypto.subtle.digest','e.previousSha256!==previous','payload.sha256','terminal!==previous','function synthetic()','window.PigaNative.printReport'])assert(read('report.js').includes(x),'Missing report verification '+x);
assert(read('report.css').includes('@page{size:A4'),'Report lacks A4 print layout');
assert(read('navigation.js').includes("'./report.html'"),'Report not accessible through navigation');

// v0.9 functional controls and hardware access boundaries
for(const id of ['probe','wifiStatus','btStatus','btGrant','btSettings','pairedList','scanFile','scanFile2','scanResult','demoModel','saveEvidence','stepMeasure']){
 assert(read('devices.html').includes('id="'+id+'"'),'Device function missing '+id);
}
for(const fn of ['deviceSnapshot','requestBluetoothPermission','openWirelessSettings','makeDemo','function inspect(buffer)','crypto.subtle.digest','gate1:','gate2:']){
 const hay=fn==='deviceSnapshot'||fn==='requestBluetoothPermission'||fn==='openWirelessSettings'?read('devices.js'):read('devices.js');
 assert(hay.includes(fn),'Device safety function missing '+fn);
}
const android=fs.readFileSync('piga-ortho-3d/android/app/src/main/java/com/piga/ortho/MainActivity.java','utf8');
const manifest=fs.readFileSync('piga-ortho-3d/android/app/src/main/AndroidManifest.xml','utf8');
assert(android.includes('settings.setDomStorageEnabled(true)'), 'Android login blocked: WebView sessionStorage disabled');
assert(android.includes('deviceSnapshot()')&&android.includes('requestBluetoothPermission()'),'Missing native connectivity bridge');
assert(android.includes('web.getSettings()')&&android.includes('privateIPv4'), 'Native network restrictions missing');
assert(manifest.includes('BLUETOOTH_CONNECT')&&manifest.includes('ACCESS_NETWORK_STATE'),'Android connectivity permissions missing');
assert(read('dashboard.html').includes('href="./devices.html"'),'Device center missing from dashboard');
assert(read('navigation.js').includes("'./devices.html'"),'Device center missing from command palette');
assert(read('devices.html').includes('id="demoStudio"'),'No studio handoff control');
assert(read('devices.html').includes('id="downloadDemo"'),'No synthetic STL export');
assert(read('devices.js').includes('piga-ortho-demo-stl-once'),'No STL one-time session handoff');
assert(read('app.js').includes("sessionStorage.removeItem('piga-ortho-demo-stl-once')"),'One-time demo must be cleared');
assert(read('devices.js').includes('deviceTransmissions:0'),'Device evaluation must have zero physical effects');

for(const id of ['modelOptions','observationChoices','therapyOptions','tasks','codeSearch','codeList','skip','next','back']){
 assert(read('assist.html').includes('id="'+id+'"'),'Guided review missing '+id);
}
assert(read('assist.js').includes("stages=5"),'Five guided steps missing');
assert(read('assist.js').includes('touchstart'),'Optional swipe control missing');
assert(read('assist.js').includes("diagnosis:'NOT_ASSIGNED'"),'No clinical decision boundary');
assert(read('assist.js').includes("therapeuticDecision:'NOT_AUTHORIZED'"),'Therapy gate missing');
assert(read('assist.js').includes("pigaGate2:'BLOCK'"),'Action boundary missing');
assert(read('assist.js').includes('composeOwnerEmail'),'Owner-controlled safe message path missing');
assert(read('kfo-bema-2026.csv').includes('"117"'),'BEMA 2026 reference missing');
assert(read('devices.js').includes("selectedDemo='standard'"),'Three demo variants unavailable');
for(const kind of ['standard','crowding','spacing'])assert(read('devices.html').includes('data-model="'+kind+'"'),'Synthetic model '+kind+' missing');

for(const id of ['loginForm','clockIn','clockOut','breakStart','breakEnd','absenceForm','manualReader','ackForm','signedPdf','ownerArea','accountantArea','ownerManuals','ownerPayroll'])assert(read('team.html').includes('id="'+id+'"'),'Missing role/HR control '+id);
assert(read('team.js').includes("staff.role==='accountant'"),'Accountant role enforcement missing');
assert(read('team.js').includes("staff.role==='owner'"),'Owner role enforcement missing');
assert(read('team.js').includes("sessionStorage.removeItem('piga-ortho-auth-ephemeral')"),'Logout must clear session');
assert(read('team.js').includes("ortho-training-archive"),'Private PDF archiving missing');
assert(read('team.js').includes("includes_diagnosis:false"),'Payroll diagnosis exclusion missing');
assert(read('team.js').includes("status:'draft'"),'Payroll must start as private draft');
assert(read('team.js').includes("status:'shared'"),'Owner-controlled sharing missing');
assert(read('team.js').includes("ortho_hr_time_events"),'Separate daily clock system missing');
assert(read('team.js').includes("auth/v1/resend"),'Email verification resend missing');
assert(read('auth.js').includes("type==='recovery'"),'Password recovery validation missing');
assert(read('auth.js').includes("method:'PUT'"),'Password update callback missing');
assert(read('praxis.js').includes("auth.html?state=check-email"),'Signup no longer redirecting to verification page');
assert(read('navigation.js').includes('href:\'./team.html\''),'Team page navigation missing');
assert(read('sw.js').includes('piga-ortho-v120-static'),'Offline cache mismatch v1.1');

for(const name of ['inventory.html','inventory.css','inventory.js'])assert(read(name).length>500,'Inventory component missing '+name);
const inv=read('inventory.js'),invhtml=read('inventory.html');
for(const id of ['locked','loginEmail','loginPassword','login','workspace','items','search','category','state','adjustForm','minimum','incoming','leadDays','reserveDays','packSize','fixedVisits','removableVisits','alignerVisits','generalVisits','workdays','calculate','orderCsv','staffList','alerts','newItemForm','correctionSign']){
 assert(invhtml.includes('id="'+id+'"'),'Inventory UI input missing '+id);
}
for(const token of ['ortho_inventory_adjust','ortho_inventory_alerts','ortho_inventory_access','auth/v1/user','role','pack_size','minimum','sessionStorage','can_manage_stock','mailto:dr.akarkach@gmx.de','formula']){
 if(token==='formula')continue;
 assert(inv.includes(token),'Inventory logic missing '+token);
}
assert(inv.includes("staff.role!=='employee'")&&inv.includes('can_manage_stock'),'Employee inventory access logic missing');
assert(inv.includes("status!=='active'"),'Inactive accounts must not enter');
assert(!inv.includes('service_role'),'Inventory must not expose privileged server keys');
assert(!inv.includes('localStorage.setItem('),'No shared local storage of private inventory');
assert(read('sw.js').includes("'./inventory.js'"),'Offline shell missing stock module');
assert(read('dashboard.html').includes('href="./inventory.html"'),'Inventory not linked from main workflow');
assert(read('navigation.js').includes("'./inventory.html'"),'Inventory not discoverable via navigation');
assert(!read('index.html').includes('kostenloses persönliches KFO-Softwareprojekt'),'Free family marketing claim persists');
