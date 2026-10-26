#!/usr/bin/env node
/**
 * Device-local 24/7-capable PC process while computer is powered and process stays running.
 * SQLite-based bounded, zero-network technical runner. Not a sync endpoint or patient database.
 * Requires Node 22+ with built-in node:sqlite; no dependencies / subscriptions.
 *
 * node scripts/piga-ortho-pc-runner.mjs --once [--db /private/path/worker.sqlite]
 * node scripts/piga-ortho-pc-runner.mjs --daemon [--db /private/path/worker.sqlite]
 * node scripts/piga-ortho-pc-runner.mjs --status [--db ...]
 */
import {DatabaseSync} from 'node:sqlite';
import {createHash,randomUUID} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const args=process.argv.slice(2);
const val=(flag,defaultValue)=>{const i=args.indexOf(flag);return i>=0&&i<args.length-1?args[i+1]:defaultValue};
const root=path.join(os.homedir(),'.piga','ortho');
const file=path.resolve(val('--db',path.join(root,'runner.sqlite')));
if(!['--once','--daemon','--status'].some(f=>args.includes(f))) {
 console.error('Use --once, --daemon or --status. No online service starts automatically.');process.exit(2);
}
if(file.length>500)throw Error('Invalid database path');
fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
if(fs.existsSync(file)&&fs.lstatSync(file).isSymbolicLink())throw Error('Refusing symlink database');
const db=new DatabaseSync(file,{timeout:3000});
try{fs.chmodSync(file,0o600)}catch{}
db.exec('PRAGMA busy_timeout=3000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;');
db.exec(`CREATE TABLE IF NOT EXISTS run_receipts(
 id TEXT PRIMARY KEY,slot INTEGER NOT NULL,kind TEXT NOT NULL,at TEXT NOT NULL,
 status TEXT NOT NULL,summary TEXT NOT NULL,previous_sha TEXT NOT NULL,sha TEXT NOT NULL,
 UNIQUE(slot,kind));
CREATE TABLE IF NOT EXISTS process_lock(
 id INTEGER PRIMARY KEY CHECK(id=1),owner TEXT NOT NULL,expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
`);
const KINDS=['LOCAL_DB_HEALTH','DATA_RESILIENCE_REVIEW','IMPROVEMENT_BACKLOG'];
const PERIOD=15*60*1000;
const owner=randomUUID();
const hash=value=>createHash('sha256').update(value).digest('hex');
const safe=error=>String(error?.message||error).slice(0,140);
function status(){
 const count=db.prepare('SELECT COUNT(*) count FROM run_receipts').get().count;
 const rows=db.prepare('SELECT kind,at,status,summary FROM run_receipts ORDER BY rowid DESC LIMIT 4').all();
 const report={schema:'piga-ortho-pc-runner.v1',mode:'LOCAL_SQLITE',database:file,
  nativeRunner:true,cloudRequired:false,supabaseRequired:false,pid:process.pid,
  receipts:count,recent:rows,externalEffects:0,clinicalAuthority:false,
  guaranteed24x7:false,requirement:'powered desktop and running process; user-managed autostart'};
 console.log(JSON.stringify(report,null,2));
}
function claim(){
 const now=Date.now();
 db.exec('BEGIN IMMEDIATE');
 try{
  const lock=db.prepare('SELECT owner,expires FROM process_lock WHERE id=1').get();
  if(lock?.expires>now&&lock?.owner!==owner){db.exec('ROLLBACK');return false}
  db.prepare('INSERT OR REPLACE INTO process_lock(id,owner,expires) VALUES(1,?,?)').run(owner,now+30000);
  db.exec('COMMIT');return true;
 }catch(error){db.exec('ROLLBACK');throw error}
}
function release(){
 db.prepare('DELETE FROM process_lock WHERE id=1 AND owner=?').run(owner);
}
function task(kind){
 switch(kind){
 case 'LOCAL_DB_HEALTH':return {dbOpen:true,localSQLite:true,networkRequired:false};
 case 'DATA_RESILIENCE_REVIEW':return {plan:'Local-first IndexedDB/SQLite; encrypt backups; do not claim real-time cloud sync',
  limitations:['Browser storage and native SQLite are independent until an authorized bridge exists']};
 case 'IMPROVEMENT_BACKLOG':return {proposals:[
  'Verify actual Android background scheduling under Doze',
  'Complete owner/tenant authorization before clinical data',
  'Use validated intraoral STL for medical measurement',
  'Review encrypted backup and explicit conflict resolution',
  'Recheck release gates before enabling paid model calls'
 ],changeApplied:false,ownerReviewRequired:true};
 default:throw Error('Unsupported job');
 }
}
function tick(){
 if(!claim())return 0;
 let completed=0;
 try{
  const slot=Math.floor(Date.now()/PERIOD);
  for(const kind of KINDS){
   if(db.prepare('SELECT id FROM run_receipts WHERE slot=? AND kind=?').get(slot,kind))continue;
   const at=new Date().toISOString(),result=task(kind),status='OBSERVED';
   const payload=JSON.stringify(result);
   const previous=db.prepare('SELECT sha FROM run_receipts ORDER BY rowid DESC LIMIT 1').get()?.sha||'GENESIS';
   const id=randomUUID(),sha=hash(JSON.stringify({id,slot,kind,at,status,payload,previous}));
   db.prepare('INSERT INTO run_receipts(id,slot,kind,at,status,summary,previous_sha,sha) VALUES(?,?,?,?,?,?,?,?)')
    .run(id,slot,kind,at,status,payload,previous,sha);
   completed++;
  }
  // Bound retained evidence (metadata only) while preserving latest chain checkpoint.
  db.prepare('DELETE FROM run_receipts WHERE rowid NOT IN (SELECT rowid FROM run_receipts ORDER BY rowid DESC LIMIT 2000)').run();
 }finally{release();}
 return completed;
}
if(args.includes('--status')){status();db.close();}
else if(args.includes('--once')){const n=tick();console.log('LOCAL PIGA PC RUNNER: '+n+' bounded checks, no external effects');db.close();}
else{
 let running=true,processing=false;
 console.log('PIGA PC RUNNER online locally; no cloud or patient access; stop with Ctrl+C');
 const run=()=>{
  if(!running||processing)return;processing=true;
  try{const n=tick();console.log(new Date().toISOString()+' checks='+n+' sqlite='+file);}
  catch(error){console.error('PIGA runner: '+safe(error))}
  finally{processing=false;}
 };
 run();
 const timer=setInterval(run,PERIOD);
 const stop=()=>{if(!running)return;running=false;clearInterval(timer);try{release()}catch{}db.close();process.exit(0)};
 process.on('SIGINT',stop);process.on('SIGTERM',stop);
}
