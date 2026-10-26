/**
 * PIGA AI Act 119-entry practical implementation catalogue, public and free.
 * Article titles are editorial German summaries of the 27 July 2026 EU Act
 * consolidated official AI Act Explorer. No scraped statutory text, and no
 * invented legal obligation or certification is presented.
 * Source: https://ai-act-service-desk.ec.europa.eu/en/ai-act-explorer
 * Consolidated law: https://eur-lex.europa.eu/eli/reg/2024/1689/2026-07-27/eng
 */
export const PIGA_AI_ACT_SOURCE = Object.freeze({
  law:"https://eur-lex.europa.eu/eli/reg/2024/1689/2026-07-27/eng",
  explorer:"https://ai-act-service-desk.ec.europa.eu/en/ai-act-explorer",
  effective:"2026-07-27",kind:"editorial_workflow_mapping_not_legal_opinion",
  rights:"Public orientation and control proposals, not licensed implementation instructions"
});
const RAW = "1|Gegenstand\n2|Anwendungsbereich\n3|Begriffsbestimmungen\n4|KI-Kompetenz\n5|Verbotene KI-Praktiken\n6|Einstufungsregeln für Hochrisiko-KI-Systeme\n7|Änderungen des Anhangs III\n8|Einhaltung der Anforderungen\n9|Risikomanagementsystem\n10|Daten und Daten-Governance\n11|Technische Dokumentation\n12|Aufzeichnungspflichten\n13|Transparenz und Informationen für Betreiber\n14|Menschliche Aufsicht\n15|Genauigkeit, Robustheit und Cybersicherheit\n16|Pflichten der Anbieter von Hochrisiko-KI-Systemen\n17|Qualitätsmanagementsystem\n18|Aufbewahrung der Dokumentation\n19|Automatisch erzeugte Protokolle\n20|Korrekturmaßnahmen und Informationspflicht\n21|Zusammenarbeit mit zuständigen Behörden\n22|Bevollmächtigte von Anbietern von Hochrisiko-KI-Systemen\n23|Pflichten der Einführer\n24|Pflichten der Händler\n25|Verantwortlichkeiten entlang der KI-Wertschöpfungskette\n26|Pflichten der Betreiber von Hochrisiko-KI-Systemen\n27|Grundrechte-Folgenabschätzung bei Hochrisiko-KI\n28|Notifizierende Behörden\n29|Antrag einer Konformitätsbewertungsstelle auf Notifizierung\n30|Notifizierungsverfahren\n31|Anforderungen an notifizierte Stellen\n32|Vermutung der Konformität notifizierter Stellen\n33|Tochterunternehmen und Unterauftragnehmer notifizierter Stellen\n34|Operative Pflichten notifizierter Stellen\n35|Kennnummern und Listen notifizierter Stellen\n36|Änderungen von Notifizierungen\n37|Anfechtung der Kompetenz notifizierter Stellen\n38|Koordinierung notifizierter Stellen\n39|Konformitätsbewertungsstellen aus Drittländern\n40|Harmonisierte Normen und Standardisierungsdokumente\n41|Gemeinsame Spezifikationen\n42|Konformitätsvermutung für bestimmte Anforderungen\n43|Konformitätsbewertung\n44|Bescheinigungen\n45|Informationspflichten notifizierter Stellen\n46|Ausnahmen vom Konformitätsbewertungsverfahren\n47|EU-Konformitätserklärung\n48|CE-Kennzeichnung\n49|Registrierung\n50|Transparenzpflichten für bestimmte KI-Systeme\n51|Einstufung von GPAI-Modellen mit systemischem Risiko\n52|Verfahren zur Einstufung von GPAI-Modellen\n53|Pflichten der Anbieter von GPAI-Modellen\n54|Bevollmächtigte von GPAI-Modellanbietern\n55|Pflichten bei GPAI-Modellen mit systemischem Risiko\n56|Verhaltenskodizes\n57|KI-Reallabore\n58|Ausgestaltung und Betrieb von KI-Reallaboren\n59|Weiterverarbeitung personenbezogener Daten in Reallaboren\n60|Realtests von Hochrisiko-KI außerhalb von Reallaboren\n61|Informierte Einwilligung bei Realtests\n62|Unterstützung von KMU und Start-ups\n63|Ausnahmen für bestimmte Akteure\n64|KI-Büro\n65|Europäischer KI-Ausschuss\n66|Aufgaben des KI-Ausschusses\n67|Beratungsforum\n68|Wissenschaftliches Gremium unabhängiger Sachverständiger\n69|Zugang der Mitgliedstaaten zum Expertenpool\n70|Nationale zuständige Behörden und zentrale Anlaufstellen\n71|EU-Datenbank für Hochrisiko-KI-Systeme\n72|Überwachung nach dem Inverkehrbringen\n73|Meldung schwerwiegender Vorfälle\n74|Marktüberwachung und Kontrolle in der EU\n75|Marktüberwachung und gegenseitige Amtshilfe\n76|Überwachung von Realtests\n77|Befugnisse grundrechtsschützender Behörden\n78|Vertraulichkeit\n79|Nationale Verfahren bei risikobehafteten KI-Systemen\n80|Verfahren bei als nicht-hochriskant eingestuften KI-Systemen\n81|Schutzklauselverfahren der Union\n82|Konforme KI-Systeme mit Risiken\n83|Formale Nichtkonformität\n84|EU-Strukturen zur Unterstützung von KI-Prüfungen\n85|Beschwerderecht\n86|Recht auf Erläuterung individueller Entscheidungen\n87|Meldung von Verstößen und Schutz meldender Personen\n88|Durchsetzung der Pflichten von GPAI-Anbietern\n89|Überwachungsmaßnahmen\n90|Warnungen des wissenschaftlichen Gremiums\n91|Befugnis zur Anforderung von Unterlagen\n92|Befugnis zur Durchführung von Bewertungen\n93|Befugnis zur Anordnung von Maßnahmen\n94|Verfahrensrechte der Wirtschaftsakteure bei GPAI\n95|Freiwillige Verhaltenskodizes\n96|Leitlinien der Kommission\n97|Ausübung der Befugnisübertragung\n98|Ausschussverfahren\n99|Sanktionen\n100|Geldbußen für Einrichtungen der Union\n101|Geldbußen für GPAI-Modellanbieter\n102|Änderung der Verordnung (EG) Nr. 300/2008\n103|Änderung der Verordnung (EU) Nr. 167/2013\n104|Änderung der Verordnung (EU) Nr. 168/2013\n105|Änderung der Richtlinie 2014/90/EU\n106|Änderung der Richtlinie (EU) 2016/797\n107|Änderung der Verordnung (EU) 2018/858\n108|Änderungen der Verordnung (EU) 2018/1139\n109|Änderung der Verordnung (EU) 2019/2144\n110|Änderung der Richtlinie (EU) 2020/1828\n111|Bereits in Verkehr gebrachte KI-Systeme und GPAI-Modelle\n112|Bewertung und Überprüfung\n113|Inkrafttreten und Anwendung\n4a|Verarbeitung besonderer personenbezogener Daten für Bias-Prüfung\n60a|Realtests bestimmter Hochrisiko-Produkt-KI außerhalb von Reallaboren\n75a|Aufsichts- und Durchsetzungsbefugnisse des KI-Büros\n75b|Verpflichtungszusagen\n75c|Nichteinhaltung, Geldbußen und Zwangsgelder\n75d|Verfahrensgarantien und Konkretisierungen";
const headings = new Map(RAW.split("\n").map(line=>{const at=line.indexOf("|");return [line.slice(0,at),line.slice(at+1)];}));
const INSERTED = new Map([["4a",4],["60a",60],["75a",75],["75b",75],["75c",75],["75d",75]]);
const IDS=Array.from({length:113},(_,i)=>String(i+1)).flatMap(n=>[n,...[...INSERTED].filter(([,base])=>String(base)===n).map(([id])=>id)]);
const group=(n)=>{
 const id=Number.parseInt(n,10);
 if(id<=4)return "Geltung, Begriffe & KI-Kompetenz";
 if(id===5)return "Verbotene Praktiken";
 if(id<=27)return "Hochrisiko-KI: Einstufung, Betreiber und Anbieter";
 if(id<=39)return "Notifizierende Behörden & benannte Stellen";
 if(id<=49)return "Normen, Konformitätsbewertung und Registrierung";
 if(id===50)return "Transparenzpflichten";
 if(id<=56)return "GPAI-Modelle";
 if(id<=63)return "Innovation, Reallabore und Realtests";
 if(id<=70)return "EU- und nationale Aufsicht";
 if(id===71)return "EU-Registrierung";
 if(id<=94)return "Monitoring, Durchsetzung und Rechtsschutz";
 if(id<=96)return "Leitlinien & freiwillige Regeln";
 if(id<=98)return "Gesetzgebungsverfahren";
 if(id<=101)return "Sanktionen";
 return "Übergangsrecht & Änderung anderer Rechtsakte";
};
const chapter=(n)=>{
 const id=Number.parseInt(n,10);
 if(id<=4)return "I";if(id===5)return "II";if(id<=49)return "III";if(id===50)return "IV";
 if(id<=56)return "V";if(id<=63)return "VI";if(id<=70)return "VII";if(id===71)return "VIII";
 if(id<=94)return "IX";if(id<=96)return "X";if(id<=98)return "XI";if(id<=101)return "XII";return "XIII";
};
const profile=n=>{
 const a=Number.parseInt(n,10);
 if(a<=4)return {roles:["provider","deployer"],kind:"scope",lenses:["A7SEM","ASOSE","Glassbox Evidence"],control:"Rollen-/Zweckinventar mit Rechtsstand, Systemversion und KI-Kompetenz-Matrix",test:"Prüfe mit zwei unterschiedlichen Einsatzkontexten, ob Rolle, Anwendbarkeit und Lernbedarf korrekt neu eingestuft werden.",proof:"Abgezeichnetes Rollen- und Zweckinventar, Ausbildungs-/Kompetenzbelege und Versionsprotokoll"};
 if(a===5)return {roles:["provider","deployer"],kind:"prohibition",lenses:["Gate 1","ASOSE","VBR","A7SEM Reverse"],control:"Vor-Inferenz-Zweckprüfung, gesperrte Verwendungsfälle und technisch nachgewiesene Nichtausführung",test:"Negativprobe: verbotenen oder zweifelhaften Zweck einspeisen; prüfen, dass keine Inferenz oder Wirkung zugelassen wird.",proof:"Rechtsklassifikation, Verbots-/Ausnahmematrix, Gate-Entscheid, Nonexecution-/Wirkungs-Readback"};
 if(a<=27)return {roles:["provider","deployer"],kind:"highrisk",lenses:["Gate 1","Glassbox Evidence","ASOSE","Gate 2","A7SEM Reverse"],control:"Risikoklassifikation pro Systemversion; evidenzgebundene Kontrollen, Aufsicht und separater Effect-Admission-Pass",test:"Ändere Systemversion, Zweck oder Kontrollnachweis: vorherige Admission muss EXPIRED/DELAY sein, nicht still weitergelten.",proof:"Klassifikationsmemo, dokumentierte Kontrollen, Trace-/Aufsichtsprotokoll, Änderungs- und Reentry-Nachweis"};
 if(a<=39)return {roles:["authority"],kind:"institutional",lenses:["Provenance","Human-Reserved","Glassbox Evidence"],control:"Zuständigkeits- und Akkreditierungsnachweis samt unabhängigen Prüf- und Informationswegen",test:"Simuliere ungültige oder widerrufene Benennung und verifiziere, dass keine Zertifizierung behauptet wird.",proof:"Amtliche Benennung/Notifizierung, Verantwortliche, Gültigkeit, Verifikationsbeleg"};
 if(a<=49)return {roles:["provider","authority"],kind:"conformity",lenses:["Glassbox Evidence","Final Release Control","Trusted Time"],control:"Evidenzregister, Standards-/Konformitätsverweise, externe Zertifikats- und Registrierungsgrenzen",test:"Lasse fehlende Standards, abgelaufene Zertifikate und geänderte Produktversionen zu DELAY statt pauschalem ALLOW führen.",proof:"Standardsmatrix, Zertifikate soweit vorhanden, Herstellererklärung, formeller Prüfausgang"};
 if(a===50)return {roles:["provider","deployer"],kind:"transparency",lenses:["ASiSO","Glassbox Evidence","A7SEM Reverse"],control:"Erkennbare KI-Interaktion, Kennzeichnungs- und Offenlegungspunkte pro Kanal und Inhalt",test:"Teste Sprache, Text und synthetische Medien; verifiziere, ob erforderliche Offenlegung vor Wirkung wahrnehmbar ist.",proof:"Kanal-/Inhaltsmatrix, Kennzeichnungsprobe, Screenshots, Nutzer-Testbeleg"};
 if(a<=56)return {roles:["provider"],kind:"gpai",lenses:["ARSAL","A7SEM","Glassbox Evidence","VBR"],control:"Modellherkunft, Lieferketten- und Lizenznachweise; systemische Risiken getrennt behandeln",test:"Wechsle Modellanbieter oder Modellversion und prüfe, dass alte Evidenz nicht automatisch übernommen wird.",proof:"Modellkarte, Trainings-/Copyright-Dokumentation soweit einschlägig, Evaluationsprotokoll, Eskalationsakte"};
 if(a<=63)return {roles:["provider","deployer","authority"],kind:"testing",lenses:["ASOSE","Gate 2","Human-Reserved","Glassbox Evidence"],control:"Testmandat mit Teilnehmern, Bedingungen, Wirkungsscope und Beendigungs-/Widerrufsweg",test:"Entziehe Testmandat oder Einwilligung; der Testbetrieb muss vor weiteren Wirkungen angehalten werden.",proof:"Testplan, Aufsicht, Einwilligung falls erforderlich, Zeitfenster und Rückbau-/Stopprotokoll"};
 if(a<=70)return {roles:["authority"],kind:"institutional",lenses:["Provenance","Trusted Time","Human-Reserved"],control:"Institutionelle Zuständigkeit, Eskalations-, Unterlagen- und Informationswege verifizieren",test:"Prüfe Unzuständigkeit oder unbestätigte behördliche Anweisung gegen einen autorisierten Gegenkanal.",proof:"Amtliche Rechtsquelle, gültige Behördenidentität, Zuständigkeit, fristgebundene Korrespondenz"};
 if(a===71)return {roles:["provider","deployer"],kind:"registry",lenses:["Glassbox Evidence","Provenance","Trusted Time"],control:"Anwendbarkeit der EU-Registrierung prüfen; versionsgebundene Meldedaten vorbereiten",test:"Vergleiche veröffentlichte Systemdaten mit aktueller, intern verifizierter Version.",proof:"Registrierungsnachweis oder dokumentierte Nichtanwendbarkeit, Datensatzrevision und Abgleich"};
 if(a<=94)return {roles:["provider","deployer","authority"],kind:"oversight",lenses:["VBR","Glassbox Evidence","A7SEM Reverse","Gate 2"],control:"Vorfälle, Reklamationen, Aufsichtsanordnungen und Korrekturmaßnahmen mit Effect-Readback verknüpfen",test:"Simuliere Incident, Beschwerde oder Widerruf; prüfe, ob betroffene Wirkung gestoppt und der Fall nachvollziehbar eröffnet wird.",proof:"Incident-/Beschwerdeakte, Zuständigkeit, Meldungsquittung, Veto- und Wirksamkeitsprüfung"};
 if(a<=98)return {roles:["authority"],kind:"legal-change",lenses:["Provenance","Trusted Time","A7SEM Reverse"],control:"Aktualitätsmonitor mit Rechtsstand, Geltungsbeginn und Versionsänderung",test:"Bei Änderung des Rechtsstandes alle davon abhängigen Freigaben zur Neubewertung markieren.",proof:"Amtliche Änderung, Datum, betroffene Verfahren, Revision und Freigabeprotokoll"};
 if(a<=101)return {roles:["provider","deployer","authority"],kind:"sanction",lenses:["Final Release Control","Glassbox Evidence","Prior Insurability"],control:"Belegfähige Verantwortlichkeiten, Behebungsnachweise und Eskalationswege; keine Strafbemessung automatisieren",test:"Prüfe eine unvollständige Compliance-Behauptung: kein System darf einen Bußgeldfreiheits- oder Compliance-Status erfinden.",proof:"Entscheidungs-/Haftungsscope, Auditspur, Maßnahmenbeleg und juristische Freigabe"};
 return {roles:["provider","deployer","authority"],kind:"transition",lenses:["Provenance","Trusted Time","A7SEM Reverse"],control:"Übergangsfristen, Produktkategorien und Änderungen anderer Rechtsakte fallbezogen abgleichen",test:"Prüfe Alt-System, geänderte Version und abweichenden Fristbeginn gegen amtlichen aktuellen Wortlaut.",proof:"Geltungsdatums-Matrix, betroffene Produkt-/Sektorrechtsakte, Rechtsstandsbeleg"};
};
const EXPLICIT={
 "2":"Ermittle für den tatsächlichen geografischen, organisatorischen und sachlichen Einsatz, ob die Regelung greift.",
 "3":"Definiere System, Anbieter, Betreiber, Zweck, GPAI und betroffene Akteure ohne unbelegte Gleichsetzung.",
 "4":"Ordne jeder tatsächlich betroffenen Rolle eine angemessene KI-Kompetenz und einen belegbaren Lernnachweis zu.",
 "4a":"Sonderkategorien personenbezogener Daten nur unter den gesetzlichen Voraussetzungen und datenschutzrechtlicher Prüfung behandeln.",
 "5":"Unterscheide jede konkrete möglicherweise verbotene Praxis und dokumentiere die Negativentscheidung vor dem Modellaufruf.",
 "6":"Begründe Anhang-I/III-Bezug, Ausnahmen und Grenzen; die Selbsteinstufung ist keine Zulassung.",
 "9":"Binde Risiken, Minderungsmaßnahmen, Residualrisiken und die erneute Freigabe an die aktuelle Systemversion.",
 "10":"Belege Herkunft, Eignung, Qualität, Bias-Prüfung und datenschutzrechtliche Grundlage der verwendeten Daten.",
 "11":"Erstelle eine revisionssichere Systemakte mit Architektur, Version, Zweck, Kontrollen und Grenzen.",
 "12":"Prüfe, ob relevante Systemereignisse automatisch, vollständig und manipulationsgeschützt aufgezeichnet werden können.",
 "14":"Benenne Aufsichtspersonen, Übersteuerung, Veto, Widerruf und unabhängige Handlungsfreigaben.",
 "15":"Verbinde Genauigkeits-, Robustheits- und Cybertests mit Nachweisen statt bloßen Modellversprechen.",
 "17":"Verknüpfe Qualitätsmanagement, Material-Change-Reentry, Verantwortliche und kontinuierliche Verbesserung.",
 "20":"Lege klare Stop-/Rückruf-/Informationstrigger mit Rücklesung der tatsächlichen Wirkung fest.",
 "25":"Trenne Rollenwechsel und Pflichten bei Integration, Vertrieb, Änderung und Produkt-Weitergabe.",
 "26":"Binde reale Betreiberkontrollen an Personal, Betriebsbedingungen, Logging und Aufsicht.",
 "27":"Prüfe, ob eine FRIA erforderlich ist; dokumentiere Betroffenengruppen, Folgen und menschliche Freigabe.",
 "43":"Ordne den anwendbaren formellen Prüfpfad zu; PIGA-Vorabkontrollen ersetzen keine notifizierte Stelle.",
 "47":"Prüfe Herstellerverantwortung, Gültigkeit und formale Voraussetzungen der EU-Konformitätserklärung.",
 "49":"Bestimme Datenbankpflicht und relevante Ausnahmen; protokolliere Registrierung statt sie zu simulieren.",
 "50":"Teste sichtbare KI-Interaktions- und Medienkennzeichnung in jeder tatsächlichen Nutzeroberfläche.",
 "53":"Erstelle die einschlägige GPAI-Dokumentations-/Copyright-/Lieferketten-Matrix.",
 "55":"Prüfe Modell-Evaluation, systemische Risiken, Vorfälle und Cybersicherheitsmaßnahmen unabhängig.",
 "59":"Prüfe zulässige Datenweiterverarbeitung, Rechtsgrundlage und Schutzvorkehrungen im Reallabor.",
 "60":"Teste das Vorliegen aller Voraussetzungen für Realtests inklusive behördlicher Anzeige, Aufsicht und Stop-Möglichkeit.",
 "60a":"Berücksichtige die besondere Verknüpfung mit Produkt-Harmonisierungsrecht und den Realtest-Grenzen.",
 "61":"Stelle echte informierte Einwilligung und Widerruf im zulässigen Realtest-Scope sicher.",
 "71":"Gleiche vorgeschriebene Registrierungsdaten mit der aktuellen Systemakte und realen EU-Datenbank ab.",
 "72":"Lege risikogebundenen Post-Market-Monitoring-Plan mit Triggern, Verantwortlichen und Evidence-Readback fest.",
 "73":"Definiere meldepflichtige schwere Vorfälle samt Meldefrist, Eigentümer und bestätigter Zustellung.",
 "74":"Bereite einen fristgerechten, beweisfähigen Marktaufsichtsvorgang mit berechtigter Informationsfreigabe vor.",
 "78":"Kennzeichne Vertraulichkeit, Geschäftsgeheimnisse und Zugriffsrechte bei jeder Evidenzweitergabe.",
 "80":"Validiere strittige Nicht-Hochrisiko-Einstufung getrennt vom technischen Modellbetrieb.",
 "85":"Biete betroffenen Personen einen dokumentierten Beschwerde- und Antwortweg.",
 "86":"Bereite nachvollziehbare Erklärungsbelege für individuelle KI-gestützte Entscheidungen vor.",
 "87":"Schütze Hinweise, Meldeidentitäten und Datenzugriffe bei Verdachtsfällen.",
 "91":"Halte angeforderte GPAI-Unterlagen in gültiger Version für berechtigte Stellen verfügbar.",
 "92":"Bereite unabhängige, reproduzierbare Modellbewertungen vor und erhalte die Prüfungshistorie.",
 "93":"Führe angeordnete Maßnahmen nur mit überprüfter Zuständigkeit und bestätigter Wirkung aus.",
 "99":"Leite Sanktions- und Haftungsrisiken an qualifizierte Prüfer, nicht an ein automatisches ALLOW.",
 "111":"Unterscheide Bestands-KI, Umgestaltung, Behördenbetrieb und GPAI-Übergangsregeln nach Zeit und Rolle.",
 "113":"Geltungs- und Übergangsfristen aus aktueller konsolidierter Fassung für den Fall prüfen."
};
const invariant="Gate 1 vor Inferenz · Gate 2 vor Außenwirkung · Evidence → A7SEM Reverse → Reentry. Technischer Vorschlag, kein automatischer Rechtsnachweis.";
export const PIGA_ARTICLE_GUIDES=Object.freeze(IDS.map(article=>{
 const name=headings.get(article);if(!name)throw Error("Article title not mapped: "+article);
 const p=profile(article),focus=EXPLICIT[article]||("Prüfe den rechtlichen Bezug von »"+name+"« zum konkreten System und den verantwortlichen Rollen, bevor ein technischer Effekt behauptet wird.");
 const statutory=article.match(/^[0-9]+[a-z]$/)? "Geänderter/eingefügter Artikel: besondere Fassungs- und Anwendungsprüfung erforderlich." : "Amtlicher Wortlaut, Frist und konkrete Anwendbarkeit separat prüfen.";
 return Object.freeze({article,title:name,chapter:chapter(article),group:group(article),
  kind:p.kind,roles:p.roles,lenses:p.lenses,control:p.control,focus,
  test:p.test,proof:p.proof,statutory,invariant,implementationState:"CONTROL_BLUEPRINT_NOT_CUSTOMER_DEPLOYMENT",
  documentUrl:PIGA_AI_ACT_SOURCE.explorer+"#art_"+article,primarySource:PIGA_AI_ACT_SOURCE.law+"#art_"+article});
}));
export function validatePigaGuides(){
 const numbers=PIGA_ARTICLE_GUIDES.map(x=>x.article);
 const problems=[];
 if(numbers.length!==119||new Set(numbers).size!==119)problems.push("119_unique_articles_missing");
 for(const key of ["4a","60a","75a","75b","75c","75d"])if(!numbers.includes(key))problems.push("missing_"+key);
 for(const x of PIGA_ARTICLE_GUIDES)for(const name of ["title","group","control","focus","test","proof","primarySource"])if(!x[name])problems.push(x.article+":"+name);
 return {ok:problems.length===0,total:numbers.length,problems};
}
