#!/usr/bin/env node
'use strict';
// Nadia v28 source regression test. No network, AI, login, email or browser.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve('nadias-bloom');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const checks=[];
function check(label,condition){assert(condition,label);checks.push(label)}
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
check('HTML contains inline application logic',scripts.length>0);
for(const script of scripts) new vm.Script(script,{filename:'nadias-bloom/index.html'});
check('All inline application scripts parse',true);
function extract(name){
  const p=html.indexOf('function '+name+'(');
  if(p<0)throw Error('Function not found: '+name);
  const b=html.indexOf('{',p);
  let depth=0,quote='',escape=false;
  for(let i=b;i<html.length;i++){
    const ch=html[i];
    if(quote){
      if(escape){escape=false;continue}
      if(ch==='\\'){escape=true;continue}
      if(ch===quote)quote='';
      continue
    }
    if(ch==="'"||ch==='"'||ch.charCodeAt(0)===96){quote=ch;continue}
    if(ch==='{')depth++;
    else if(ch==='}'){depth--;if(depth===0)return html.slice(p,i+1)}
  }
  throw Error('Unclosed function: '+name)
}
const bundle='const NB_ISLAM_YEAR_CACHE=new Map();\n'+['nbIsoUTC','nbDayShift','nbEaster','nbHolidayDates','nbIslamicEvents','nbMonthDetails'].map(extract).join('\n');
const sandbox={state:{members:[{name:'Test-Geburtstag',birthday:'2020-10-14'}],settings:{nbLocale:{lang:'de',country:'DE'}}},NB_SCHOOL:[['2026-10-05','2026-10-17','Herbstferien Hessen']],NB_ISLAM:[['2027-03-09','Eid al-Fitr']],fmt:x=>x,nbLocalizedIslam:x=>x};
sandbox.nbInGermany=()=>sandbox.state.settings.nbLocale.country==='DE';
vm.runInNewContext(bundle+';globalThis.__qa={nbHolidayDates,nbMonthDetails,nbIslamicEvents}',sandbox,{timeout:1000});
const {nbHolidayDates,nbMonthDetails,nbIslamicEvents}=sandbox.__qa;
const oct=nbMonthDetails(2026,10),nov=nbMonthDetails(2026,11);
check('October 2026 contains annual birthday',oct.some(e=>e.title==='Geburtstag: Test-Geburtstag'&&e.date==='2026-10-14'));
check('November excludes October birthday',!nov.some(e=>e.title.includes('Test-Geburtstag')));
check('May 2031 public holiday',nbMonthDetails(2031,5).some(e=>e.date==='2031-05-01'&&e.title==='Tag der Arbeit'));
check('October 2026 German Unity Day',oct.some(e=>e.date==='2026-10-03'&&e.title==='Tag der Deutschen Einheit'));
check('2027 Easter dates',nbHolidayDates(2027).some(e=>e[0]==='2027-03-26'&&e[1]==='Karfreitag')&&nbHolidayDates(2027).some(e=>e[0]==='2027-03-29'&&e[1]==='Ostermontag'));
check('Germany includes Hessen vacation',nbMonthDetails(2026,10).some(e=>e.type==='vacation'));
sandbox.state.settings.nbLocale.country='NL';
check('Netherlands removes German holidays and school vacation',!nbMonthDetails(2026,10).some(e=>e.type==='holiday'||e.type==='vacation'));
check('Netherlands keeps Islamic occasions',nbMonthDetails(2027,3).some(e=>e.type==='islam'));
check('Netherlands retains birthday',nbMonthDetails(2026,10).some(e=>e.type==='birthday'));
check('Islamic dates continue after published book years',nbIslamicEvents(2028).some(e=>e[1].includes('Eid al-Fitr'))&&nbIslamicEvents(2031).some(e=>e[1].includes('Ramadan')));
sandbox.state.settings.nbLocale.country='DE';
for(const f of ['manifest.webmanifest','sw.js','icon.svg','icon-192.png','icon-512.png']) check('Static asset '+f,fs.statSync(path.join(root,f)).size>0);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
check('PWA launch scope',manifest.display==='standalone'&&manifest.start_url==='./'&&manifest.scope==='./');
check('Happy and portraits safely withdrawn',!html.includes('id="view-happy"')&&!html.includes('happy-live-token')&&!html.includes('happy-avatar-rose.png'));
check('New botanical design without face',html.includes('v28-i18n-15-lang-no-happy'));check('Fifteen language labels included',html.includes('NB_LANGS=')&&html.includes('"nl":"Nederlands"')&&html.includes('"ar":"العربية"'));
check('Civil holidays require Germany',html.includes('if(nbInGermany())for(const [date,title] of nbHolidayDates(y))'));
check('Birthdays remain country-independent',html.includes('member.birthday.slice(5,7)===mon.slice(5,7)'));
check('PWA standalone install mode',manifest.display==='standalone');
check('No credential-consuming voice integration',!html.includes('happy-live-token')&&!html.includes('LIVE_URL'));
check('No admin credential in browser source',!html.includes('service_role')&&!html.includes('sb_secret_'));
console.log(JSON.stringify({verdict:'PASS_LOCAL_SOURCE_INVARIANTS',checks:checks.length,failures:0,aiCalls:0,emailsSent:0,details:checks},null,2));
