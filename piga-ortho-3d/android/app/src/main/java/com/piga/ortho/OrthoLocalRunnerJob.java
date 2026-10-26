package com.piga.ortho;

import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.os.SystemClock;
import org.json.JSONObject;

/**
 * Persisted, OS-scheduled native read-only technical checks with LOCAL SQLite.
 * Android JobScheduler is inexact, affected by power state and NOT a guaranteed 24/7 process.
 * Browser IndexedDB remains the WebView source of truth; native DB stores runner metadata only.
 * No patient data, no network, no device commands, no medical decisions.
 */
public final class OrthoLocalRunnerJob extends JobService {
  private static final int JOB_ID=713026;
  private static final long PERIOD=15*60*1000L;
  private static final String DB_NAME="piga_ortho_native_worker_v1.db";
  private static final String[] KINDS={"HEALTH_CHECK","DATA_INTEGRITY_AUDIT","IMPROVEMENT_BACKLOG"};
  static final class Ledger extends SQLiteOpenHelper {
    Ledger(Context c){super(c,DB_NAME,null,1);}
    @Override public void onCreate(SQLiteDatabase db){
      db.execSQL("CREATE TABLE IF NOT EXISTS worker_events (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, kind TEXT NOT NULL, status TEXT NOT NULL, note TEXT NOT NULL)");
      db.execSQL("CREATE TABLE IF NOT EXISTS worker_queue (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, kind TEXT NOT NULL, state TEXT NOT NULL)");
    }
    @Override public void onUpgrade(SQLiteDatabase db,int oldVersion,int newVersion){}
  }
  private static boolean allowed(String kind){
    for(String x:KINDS)if(x.equals(kind))return true;return false;
  }
  public static void schedule(Context ctx){
    try{
      JobScheduler js=(JobScheduler)ctx.getSystemService(Context.JOB_SCHEDULER_SERVICE);
      if(js==null)return;
      for(JobInfo item:js.getAllPendingJobs())if(item.getId()==JOB_ID)return;
      JobInfo info=new JobInfo.Builder(JOB_ID,new ComponentName(ctx,OrthoLocalRunnerJob.class))
        .setPeriodic(PERIOD).setPersisted(true).build();
      js.schedule(info);
    }catch(Exception ignored){}
  }
  public static boolean enqueueCheck(Context ctx,String kind){
    if(!allowed(kind))return false;
    try(Ledger helper=new Ledger(ctx)){
      SQLiteDatabase db=helper.getWritableDatabase();
      db.execSQL("INSERT INTO worker_queue(at,kind,state) VALUES(?,?,?)",
       new Object[]{System.currentTimeMillis(),kind,"QUEUED"});
      return true;
    }catch(Exception ignored){return false;}
  }
  public static String status(Context ctx){
    JSONObject out=new JSONObject();
    try(Ledger helper=new Ledger(ctx)){
      SQLiteDatabase db=helper.getReadableDatabase();
      long last=0;int queue=0;
      try(Cursor c=db.rawQuery("SELECT COALESCE(MAX(at),0) FROM worker_events",null)){if(c.moveToFirst())last=c.getLong(0);}
      try(Cursor c=db.rawQuery("SELECT COUNT(*) FROM worker_queue WHERE state='QUEUED'",null)){if(c.moveToFirst())queue=c.getInt(0);}
      out.put("mode","NATIVE_SQLITE_SCHEDULED");
      out.put("lastRun",last);out.put("queued",queue);out.put("periodicMinimumMinutes",15);
      out.put("guaranteed24x7",false);out.put("networkEffects",0);out.put("clinicalActions",0);
    }catch(Exception e){try{out.put("mode","LOCAL_UNKNOWN");out.put("error","native_storage_unavailable");}catch(Exception ignored){}}
    return out.toString();
  }
  @Override public boolean onStartJob(JobParameters params){
    final JobParameters job=params;
    new Thread(()->{
      try(Ledger helper=new Ledger(this)){
        SQLiteDatabase db=helper.getWritableDatabase();
        db.beginTransaction();
        try{
          final long now=System.currentTimeMillis();
          db.execSQL("INSERT INTO worker_events(at,kind,status,note) VALUES(?,?,?,?)",
            new Object[]{now,"DEVICE_HEARTBEAT","DONE","Native SQLite reachable; no cloud or patient data"});
          try(Cursor cursor=db.rawQuery("SELECT id,kind FROM worker_queue WHERE state='QUEUED' ORDER BY id LIMIT 5",null)){
            while(cursor.moveToNext()){
              long id=cursor.getLong(0);String kind=cursor.getString(1);
              // Technical readiness only. Browser medical data is NEVER accessed by the native scheduler.
              db.execSQL("UPDATE worker_queue SET state=? WHERE id=?",new Object[]{"DONE",id});
              db.execSQL("INSERT INTO worker_events(at,kind,status,note) VALUES(?,?,?,?)",
                new Object[]{now,kind,"DONE","Read-only native task receipt; browser IndexedDB not inspected"});
            }
          }
          db.execSQL("DELETE FROM worker_events WHERE id NOT IN (SELECT id FROM worker_events ORDER BY id DESC LIMIT 500)");
          db.execSQL("DELETE FROM worker_queue WHERE state='DONE' AND id NOT IN (SELECT id FROM worker_queue ORDER BY id DESC LIMIT 200)");
          db.setTransactionSuccessful();
        }finally{db.endTransaction();}
      }catch(Exception ignored){
        // Persisted jobs are rescheduled by JobScheduler; no busy retry loop.
      }finally{jobFinished(job,false);}
    },"piga-ortho-local-runner").start();
    return true;
  }
  @Override public boolean onStopJob(JobParameters params){return true;}
}
