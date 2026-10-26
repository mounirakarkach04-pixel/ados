'use strict';
/* PIGA ORTHO 3D — device-local, non-generative knowledge and admission planner.
 No network, no secrets, no diagnoses, no impersonated authority, no physical effects. */
window.PigaBrain=(()=>{
 const routes={
 research:['PIGA – 10 Rules (Zenodo)','https://zenodo.org/records/21390720'],
 sales:['PIGA ORTHO Produktübersicht','./sales.html'],privacy:['Datenschutz & Datenverarbeitung','./privacy.html'],
 overview:['Dashboard','./dashboard.html'],cases:['Fälle & Termine','./direct.html#cases'],
 praxis:['Praxis','./praxis.html'],team:['Personal','./team.html'],
 inventory:['Material','./inventory.html'],studio:['3D Studio','./studio.html#studio'],
 imaging:['DICOM / CBCT','./imaging.html'],handoff:['Praxis → Labor','./handoff.html'],
 assist:['KFO-Hilfe / BEMA','./assist.html'],device:['Drucker / Geräte','./devices.html'],
 reports:['Glassbox / Bericht','./report.html'],worker:['Geräte-Datenbank','./device-hub.html'],
 governance:['PIGA Prozesse','./workflow.html'],diagnostics:['Systemtest','./diagnostics.html'],
 };
 const patterns=[
  {rx:/(a7sem.reverse|rückwärtsprüf|reverse.audit|reverse.evidence)/i,kind:'GOVERNANCE_REVIEW',route:'governance',
   reply:'A7SEM Reverse prüft ein beobachtetes Ergebnis gegen die anfängliche Zulassung, Quelle, Abhängigkeiten und mögliche Widersprüche. Ohne authentifizierten Readback ist das Ergebnis UNKNOWN und keine neue Autorisierung.'},
  {rx:/(zenodo|forschungswerk|publikation|forschung.*piga|piga.*paper|mein wissen|meine arbeit|mounir akarkach)/i,kind:'GOVERNANCE_REVIEW',route:'research',
   reply:'Die öffentlich veröffentlichte Forschungsarbeit „PIGA for Everyone – 10 Rules. One Architecture“ ist über Zenodo (DOI 10.5281/zenodo.21390720) zugänglich. Die lokale App enthält ein begrenztes Modul- und Governance-Wissensverzeichnis; private Google-Drive-Werke werden ohne separat autorisierte Schnittstelle nicht automatisch gelesen.'},
  {rx:/(produktbeschreibung|was kann die app|preise|lizenz|vertrieb|kommerziell)/i,kind:'GENERAL_HELP',route:'sales',
   reply:'PIGA ORTHO 3D verbindet technische 3D-/DICOM-Werkzeuge, Workflow, lokale Datenbank, Personal-Testansichten, PIGA-Prüfungen und einen gerätegebundenen Chat. Die Vertriebsübersicht zeigt die Produktpositionierung; ein produktiver Lizenzzugang wird erst nach überprüfter Authentifizierung und Stripe-Entitlement-Anbindung freigegeben.'},
  {rx:/(dsgvo|datenschutz|patientendaten|gesundheitsdaten|privatsphäre)/i,kind:'GENERAL_HELP',route:'privacy',
   reply:'Dies ist eine öffentliche, passwortlose technische Evaluation. Bitte ausschließlich synthetische oder zuverlässig anonymisierte Testdaten verwenden. Für echte Patienten- und Mitarbeiterdaten sind gesicherte Konten, Zugriffskontrolle, Verschlüsselung, Backup, Löschkonzept und rechtliche/medizinische Prüfung erforderlich.'},
 
  {rx:/\b(urlaub|ferien|freistellung|abwesenheit)\b/i,role:'staff',kind:'LEAVE_REQUEST',route:'team',
   reply:'Ich kann eine Urlaubsanfrage als Entwurf in den lokalen Freigabeeingang aufnehmen. Ohne bestätigte Inhaberidentität wird kein Urlaub rechtsverbindlich genehmigt.'},
  {rx:/(druckauftrag|drucken|drucker|fertigung|resin)/i,kind:'PRINT_REVIEW',route:'studio',
   reply:'Ich erfasse einen technischen Druckprüfauftrag. STL/Slicer/Material/Gerät und PIGA Gate 2 müssen unabhängig autorisiert werden. Dieser Chat startet keinen Drucker.'},
  {rx:/(lager|inventur|material|nachbestell|bestand)/i,kind:'INVENTORY_REVIEW',route:'inventory',
   reply:'Materialbestände und Mindestmengen kann ich über einen begrenzten lokalen Worker prüfen. Bestellungen, Warenabgänge und Zahlungen werden nicht ausgelöst.'},
  {rx:/(abrechnung|bema|goz|bel|kig|ziffer|ebz)/i,kind:'BILLING_REVIEW',route:'assist',
   reply:'Die App enthält einen KFO-BEMA-Referenzkatalog und die fachliche Prüfliste. Positionen dürfen nur für tatsächlich erbrachte, dokumentierte und abrechnungsfähige Leistungen nach aktueller Regelung angesetzt werden; ich rechne keine Behandlung automatisch ab.'},
  {rx:/(diagnos|karies|behandl|therap|medizin|schmerz|biss|okklusion)/i,kind:'CLINICAL_REVIEW',route:'imaging',
   reply:'Ich kann technische Daten und Prüfschritte für die kieferorthopädische Beurteilung zusammenstellen. Diagnose, Behandlungsplanung, Indikation und klinische Freigabe benötigen den verantwortlichen Zahnarzt und validierte Verfahren.'},
  {rx:/(mitarbeiter|lohn|gehalt|dienstplan|zeit|schicht)/i,kind:'TEAM_REVIEW',route:'team',
   reply:'Die Personalansicht umfasst technische Testdaten zu Dienstplan und Zeiten. Vertrauliche Lohndaten und rechtswirksame Genehmigungen benötigen eine echte Rollen- und Identitätsprüfung.'},
  {rx:/(stl|scanner|3d|kiefer|gebiss|modell)/i,kind:'GEOMETRY_REVIEW',route:'studio',
   reply:'Im 3D Studio lassen sich STL-Modelle laden und technisch prüfen. Das Imaging Lab zeigt GPU-Modelle und unterstützt einen hardwareabhängigen 4K-PNG-Export. Maßstab und anatomische Qualität müssen geprüft werden.'},
  {rx:/(dicom|cbct|röntgen|segmentier|staging)/i,kind:'IMAGING_REVIEW',route:'imaging',
   reply:'Das Imaging Lab kann begrenzte native DICOM-Graustufenbilder und technische Masken ansehen. Automatische validierte Zahnsegmentierung oder Aligner-Staging sind noch nicht vorhanden.'},
  {rx:/(worker|heartbeat|herzschlag|24.?7|hintergrund|autonom|runner)/i,kind:'WORKER_CHECK',route:'worker',
   reply:'Die vorhandenen Geräte-Worker bearbeiten nur begrenzte, zugelassene lokale Analysen. Ein sichtbarer Heartbeat bestätigt lediglich die geöffnete Seite – nicht 24/7 nach dem Schließen. Für durchgehende Ausführung braucht es einen separaten laufenden Host oder nativen Hintergrunddienst.'},
  {rx:/(piga|a7sem|glassbox|freigabe|gate|sicherheit)/i,kind:'GOVERNANCE_REVIEW',route:'governance',
   reply:'PIGA trennt Inference Admission (Gate 1) und Action Admission (Gate 2). A7SEM strukturiert die Betrachtung, A7SEM Reverse prüft den beobachteten Effekt rückwärts. UNKNOWN, BLOCK oder abgelaufene Autorität lösen keine externe Aktion aus.'},
  {rx:/(backup|sicherung|export|import|synchron)/i,kind:'BACKUP_REVIEW',route:'worker',
   reply:'Die Geräte-Datenbank bietet lokale Export- und Importwege. Geräteübergreifende automatische Synchronisation ohne gesichertes Konto oder autorisierte Verbindung wird nicht vorgetäuscht.'},
  {rx:/(gemini|stimme|mikro|sprache|voice|sprachsteuerung)/i,kind:'VOICE_SETUP',route:'worker',
   reply:'Sprachausgabe kann per Gerätestimme funktionieren. Spracheingabe benötigt Mikrofonberechtigung und einen unterstützten Browser. Gemini ist nur optional über einen gesicherten Server-Proxy anzubinden – bitte keinen API-Schlüssel in dieser offenen Webseite eingeben.'}
 ];
 const escape=s=>String(s||'').replace(/\s+/g,' ').trim().slice(0,500);
 function intent(input){const prompt=escape(input);const p=patterns.find(x=>x.rx.test(prompt));
  if(!p)return {kind:'GENERAL_HELP',route:'overview',
   reply:'Ich bin der sofort verfügbare lokale PIGA-Assistent. Ich kenne die Module und kann technische Prüfaufträge vorbereiten. Für eine freie generative Antwort oder aktuelle Internetquellen wäre eine ausdrücklich konfigurierte, datenschutzkonforme KI-Anbindung nötig. Frage beispielsweise nach STL, DICOM, PIGA, Material, Urlaub, BEMA oder Workern.'};
  return {kind:p.kind,route:p.route,reply:p.reply};
 }
 function answer(input,role='owner',state={}){
  const classification=intent(input);
  const target=routes[classification.route]||routes.overview;
  const count=Number(state?.openTasks)||0;
  let reply=classification.reply;
  if(classification.kind==='WORKER_CHECK'&&state?.heartbeat)
   reply+=' Letztes beobachtetes lokales Signal: '+state.heartbeat+'.';
  if(classification.kind==='TEAM_REVIEW'&&Number.isFinite(count)&&count>0)reply+=' Im lokalen Arbeitsbestand gibt es '+count+' offene Aufgaben.';
  if(role==='staff'&&['BILLING_REVIEW','CLINICAL_REVIEW'].includes(classification.kind))
   reply+=' Als Mitarbeiter ist dies nur ein Hinweis zur Weitergabe; keine fachliche Freigabe.';
  return {...classification,reply,routeTitle:target[0],href:target[1],source:'LOCAL_RULE_BASED',
   actionAllowed:false,clinicalApproved:false,gate2:'BLOCK',humanReviewRequired:true};
 }
 const allowedRequest=new Set(['LEAVE_REQUEST','PRINT_REVIEW','INVENTORY_REVIEW','BILLING_REVIEW',
   'CLINICAL_REVIEW','TEAM_REVIEW','GEOMETRY_REVIEW','IMAGING_REVIEW','WORKER_CHECK','GOVERNANCE_REVIEW','BACKUP_REVIEW','VOICE_SETUP','GENERAL_HELP']);
 function request(kind,description,from){
  if(!allowedRequest.has(kind))throw Error('Unknown request kind');
  const ts=new Date().toISOString();
  return {id:crypto.randomUUID(),kind,description:escape(description).slice(0,250),
   requestedBy:from==='staff'?'STAFF_UI_UNVERIFIED':'OWNER_UI_UNVERIFIED',
   requestedAt:ts,status:'AWAITING_REVIEW',decision:null,decisionAt:null,
   clinicalAuthority:'NOT_ASSIGNED',gate1:'DELAY',gate2:'BLOCK',
   effects:0,ttlHours:24,expiresAt:new Date(Date.now()+86400000).toISOString()};
 }
 function decide(record,decision,reviewerVerified=false){
  if(!record||record.status!=='AWAITING_REVIEW')throw Error('Request cannot be decided');
  if(!['REJECT','PAUSE','ACK_TECHNICAL','APPROVE_DRAFT'].includes(decision))throw Error('Unsupported review outcome');
  if(decision==='APPROVE_DRAFT'&&!reviewerVerified)throw Error('Verified owner authority required for real approvals');
  const status=decision==='REJECT'?'REJECTED':decision==='PAUSE'?'PAUSED':'TECHNICALLY_REVIEWED';
  return {...record,status,decision,decisionAt:new Date().toISOString(),gate2:'BLOCK',
   clinicalAuthority:'NOT_ASSIGNED',effects:0};
 }
 return {routes,answer,intent,request,decide,allowedRequest};
})();
