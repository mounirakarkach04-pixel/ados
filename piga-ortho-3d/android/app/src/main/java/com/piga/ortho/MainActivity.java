package com.piga.ortho;

import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Build;
import android.provider.Settings;
import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import androidx.webkit.WebViewAssetLoader;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Offline first, strictly allowlisted local printer bridge. Not a medical device release. */
public final class MainActivity extends Activity {
  private static final String HOME = "https://appassets.androidplatform.net/assets/dashboard.html";
  private static final int CREATE_JSON=501;
  private static final int PICK_STL=502;
  private static final int BT_PERMISSION=503;
  private WebView web;
  private final ExecutorService jobs=Executors.newSingleThreadExecutor();
  private final Handler ui=new Handler(Looper.getMainLooper());
  private String pendingExport="";
  private ValueCallback<Uri[]> pendingStlSelection;
  private final PrinterBridge bridge=new PrinterBridge();

  @Override public void onCreate(Bundle savedInstanceState){
    super.onCreate(savedInstanceState);
    OrthoLocalRunnerJob.schedule(getApplicationContext());
    web=new WebView(this);
    WebSettings settings=web.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setAllowFileAccess(false);settings.setAllowContentAccess(true); // SAF-selected content:// only, not file://
    settings.setJavaScriptCanOpenWindowsAutomatically(false);
    settings.setDomStorageEnabled(true); // Required for sessionStorage-based authenticated dashboard; no patient data permitted
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    WebView.setWebContentsDebuggingEnabled(false);
    WebViewAssetLoader loader = new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
    web.setWebViewClient(new WebViewClient(){
      @Override public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest req){return loader.shouldInterceptRequest(req.getUrl());}
      @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest req){Uri url=req.getUrl();return !"appassets.androidplatform.net".equals(url.getHost()) || !url.getPath().startsWith("/assets/");}
    });
    web.setWebChromeClient(new WebChromeClient(){
      @Override public boolean onJsConfirm(WebView view,String url,String message,JsResult result){
        new AlertDialog.Builder(MainActivity.this).setTitle("PIGA - Bestätigung").setMessage(message)
          .setPositiveButton("Bestätigen",(d,w)->result.confirm())
          .setNegativeButton("Abbrechen",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();
        return true;
      }
      @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,WebChromeClient.FileChooserParams params){
        if(pendingStlSelection!=null)pendingStlSelection.onReceiveValue(null);
        pendingStlSelection=callback;
        Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.setType("*/*");i.addCategory(Intent.CATEGORY_OPENABLE);
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try{startActivityForResult(i,PICK_STL);return true;}
        catch(Exception e){pendingStlSelection=null;callback.onReceiveValue(null);return false;}
      }
    });
    web.addJavascriptInterface(bridge,"PigaNative");
    setContentView(web); web.loadUrl(HOME);
  }

  private static boolean privateIPv4(String addr){
    if(addr==null||!addr.matches("[0-9]{1,3}(\\.[0-9]{1,3}){3}"))return false;
    String[] t=addr.split("\\.");int[] p=new int[4];
    for(int i=0;i<4;i++){if(t[i].length()>1 && t[i].startsWith("0"))return false;p[i]=Integer.parseInt(t[i]);if(p[i]<0||p[i]>255)return false;}
    return p[0]==10 ||(p[0]==172&&p[1]>=16&&p[1]<=31) || (p[0]==192&&p[1]==168) ||p[0]==127;
  }
  private static final class Session {final String origin,key;Session(String u,String k){origin=u;key=k;}}
  private volatile Session session;
  final class PrinterBridge {
    /** Native runner ledger contains only technical metadata, never browser patient data. */
    @JavascriptInterface public String localRunnerStatus(){return OrthoLocalRunnerJob.status(getApplicationContext());}
    @JavascriptInterface public boolean enqueueLocalCheck(String kind){return OrthoLocalRunnerJob.enqueueCheck(getApplicationContext(),kind);}
    @JavascriptInterface public boolean configure(String rawUrl,String key){
      try{URL url=new URL(rawUrl);String proto=url.getProtocol();String path=url.getPath();if(!("http".equals(proto)||"https".equals(proto))||!privateIPv4(url.getHost())||url.getUserInfo()!=null||!(path.isEmpty()||"/".equals(path))||url.getQuery()!=null||url.getRef()!=null||key==null||key.length()<8||key.length()>200){session=null;return false;}
        session=new Session(url.getProtocol()+"://"+url.getAuthority(),key);return true;
      }catch(Exception ignored){session=null;return false;}
    }
    @JavascriptInterface public void request(String id,String method,String path,String body){
      if(id==null||id.length()>100||!id.matches("[0-9a-zA-Z-]+")){return;}
      if(!(("GET".equals(method)&&("/api/job".equals(path)||"/api/version".equals(path)))||("POST".equals(method)&&"/api/job".equals(path)))){deliver(id,false,null,"BLOCK: disallowed operation");return;}
      Session snap=session;if(snap==null){deliver(id,false,null,"BLOCK: no printer session");return;}
      String command="";
      if("POST".equals(method)){
        try{command=new JSONObject(body).getString("command");if(!("start".equals(command)||"pause".equals(command)||"cancel".equals(command)))throw new Exception("command");}
        catch(Exception e){deliver(id,false,null,"BLOCK: invalid command");return;}
        final String cmd=command;
        ui.post(()->new AlertDialog.Builder(MainActivity.this)
          .setTitle("PIGA Gate 2 – Gerätewirkung")
          .setMessage("Einmalige Aktion: "+cmd.toUpperCase()+" am Drucker "+snap.origin+". Nur nach überprüfter Freigabe ausführen.")
          .setNegativeButton("BLOCK",(d,w)->deliver(id,false,null,"BLOCK: operator declined"))
          .setPositiveButton("Einmal ausführen",(d,w)->jobs.execute(()->execute(snap,id,method,path,body)))
          .setOnCancelListener(d->deliver(id,false,null,"BLOCK: user cancelled"))
          .show());
      }else jobs.execute(()->execute(snap,id,method,path,body));
    }
    /**
     * Read-only transport information. Paired device names only; never MACs, scan results,
     * medical measurements, commands or device credentials.
     */
    @JavascriptInterface public String deviceSnapshot(){
      JSONObject data=new JSONObject();
      try{
        ConnectivityManager cm=(ConnectivityManager)getSystemService(Context.CONNECTIVITY_SERVICE);
        Network nw=cm==null?null:cm.getActiveNetwork();
        NetworkCapabilities caps=nw==null?null:cm.getNetworkCapabilities(nw);
        data.put("wifiConnected",caps!=null&&caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI));
        data.put("networkConnected",caps!=null);
        BluetoothAdapter bt=BluetoothAdapter.getDefaultAdapter();
        boolean available=bt!=null;
        boolean permission=Build.VERSION.SDK_INT<31 || checkSelfPermission(android.Manifest.permission.BLUETOOTH_CONNECT)==PackageManager.PERMISSION_GRANTED;
        data.put("bluetoothAvailable",available);
        data.put("bluetoothPermission",permission);
        data.put("bluetoothEnabled",available&&permission&&bt.isEnabled());
        org.json.JSONArray paired=new org.json.JSONArray();
        if(available&&permission){
          java.util.Set<BluetoothDevice> devices=bt.getBondedDevices();
          if(devices!=null){int count=0;for(BluetoothDevice device:devices){
            if(++count>20)break;
            JSONObject item=new JSONObject();item.put("name",device.getName()==null?"Gekoppeltes Gerät":device.getName());
            paired.put(item);
          }}
        }
        data.put("pairedDevices",paired);
      }catch(Exception ignored){
        try{data.put("error","device_status_unavailable");}catch(Exception ignoredAgain){}
      }
      return data.toString();
    }
    @JavascriptInterface public void requestBluetoothPermission(){
      ui.post(()->{
        if(Build.VERSION.SDK_INT>=31&&checkSelfPermission(android.Manifest.permission.BLUETOOTH_CONNECT)!=PackageManager.PERMISSION_GRANTED){
          requestPermissions(new String[]{android.Manifest.permission.BLUETOOTH_CONNECT},BT_PERMISSION);
        }else{
          web.evaluateJavascript("window.pigaDeviceRefresh&&window.pigaDeviceRefresh()",null);
        }
      });
    }
    @JavascriptInterface public void openWirelessSettings(String kind){
      if(!("wifi".equals(kind)||"bluetooth".equals(kind)))return;
      ui.post(()->{
        try{
          Intent i=new Intent("wifi".equals(kind)?Settings.ACTION_WIFI_SETTINGS:Settings.ACTION_BLUETOOTH_SETTINGS);
          startActivity(i);
        }catch(Exception ignored){}
      });
    }
    /** Compose only; never send automatically or attach patient/health data. */
    @JavascriptInterface public void composeOwnerEmail(String subject,String body){
      if(subject==null||body==null||subject.length()>180||body.length()>2500
          ||!subject.startsWith("PIGA ORTHO 3D")||!body.contains("keine Patienten- oder Gesundheitsdaten"))return;
      ui.post(()->{
        try{
          Intent intent=new Intent(Intent.ACTION_SENDTO);
          intent.setData(Uri.parse("mailto:dr.akarkach@gmx.de"));
          intent.putExtra(Intent.EXTRA_SUBJECT,subject);
          intent.putExtra(Intent.EXTRA_TEXT,body);
          startActivity(Intent.createChooser(intent,"Statusbericht per E-Mail"));
        }catch(Exception ignored){}
      });
    }
    /** Explicit user-initiated Android PrintManager dialog; never a 3D printer operation. */
    @JavascriptInterface public void printReport(){
      ui.post(()->{
        if(web==null || !"https://appassets.androidplatform.net/assets/report.html".equals(web.getUrl()))return;
        PrintManager pm=(PrintManager)getSystemService(Context.PRINT_SERVICE);
        if(pm==null)return;
        pm.print("PIGA_ORTHO_3D_PRUEFAKTE",
          web.createPrintDocumentAdapter("PIGA_ORTHO_3D_PRUEFAKTE"),
          new PrintAttributes.Builder().build());
      });
    }
    @JavascriptInterface public void exportJson(String json){
      if(json==null||json.length()>4_000_000)return;
      ui.post(()->{pendingExport=json;Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("application/json");i.putExtra(Intent.EXTRA_TITLE,"PIGA_ORTHO_GLASSBOX.json");startActivityForResult(i,CREATE_JSON);
      });
    }
  }
  private void execute(Session snap,String id,String method,String path,String body){
    HttpURLConnection c=null;
    try{
      // No DNS, hostname aliases or remote address authority; RFC1918 IPv4 validated again.
      URL u=new URL(snap.origin+path);if(!privateIPv4(u.getHost()))throw new Exception("external target blocked");
      c=(HttpURLConnection)u.openConnection();c.setInstanceFollowRedirects(false);
      c.setConnectTimeout(6500);c.setReadTimeout(6500);c.setRequestMethod(method);c.setRequestProperty("X-Api-Key",snap.key);c.setRequestProperty("Accept","application/json");
      if("POST".equals(method)){c.setDoOutput(true);c.setRequestProperty("Content-Type","application/json");byte[] bytes=body.getBytes(StandardCharsets.UTF_8);if(bytes.length>512)throw new Exception("request too large");try(OutputStream o=c.getOutputStream()){o.write(bytes);}}
      int status=c.getResponseCode();if(status>=300&&status<400)throw new Exception("redirect blocked");
      if(status<200||status>=300)throw new Exception("HTTP "+status);
      if(status==204){deliver(id,true,null,null);return;}
      byte[] b;try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){
        byte[] buf=new byte[2048];int n;while((n=in.read(buf))>0){out.write(buf,0,n);if(out.size()>180_000)throw new Exception("response too large");}b=out.toByteArray();}
      deliver(id,true,new JSONObject(new String(b,StandardCharsets.UTF_8)),null);
    }catch(Exception e){deliver(id,false,null,"UNKNOWN: " + e.getClass().getSimpleName() + " / " + e.getMessage());}
    finally{if(c!=null)c.disconnect();}
  }
  private void deliver(String id,boolean ok,JSONObject data,String error){
    ui.post(()->{try{JSONObject result=new JSONObject().put("ok",ok);if(data!=null)result.put("data",data);if(error!=null)result.put("error",error);
      String js="window.__pigaBridgeReceive && window.__pigaBridgeReceive("+JSONObject.quote(id)+","+JSONObject.quote(result.toString())+");";
      web.evaluateJavascript(js,null);
    }catch(Exception ignored){}});
  }
  @Override protected void onActivityResult(int request,int resultCode,Intent data){
    super.onActivityResult(request,resultCode,data);
    if(request==PICK_STL){
      ValueCallback<Uri[]> callback=pendingStlSelection;pendingStlSelection=null;
      if(callback!=null)callback.onReceiveValue(resultCode==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null);
      return;
    }
    if(request==CREATE_JSON){try{if(resultCode==RESULT_OK&&data!=null&&data.getData()!=null){try(OutputStreamWriter out=new OutputStreamWriter(getContentResolver().openOutputStream(data.getData()),StandardCharsets.UTF_8)){out.write(pendingExport);}}}catch(Exception ignored){}finally{pendingExport="";}}
  }
  @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] grantResults){
    super.onRequestPermissionsResult(requestCode,permissions,grantResults);
    if(requestCode==BT_PERMISSION&&web!=null){
      web.evaluateJavascript("window.pigaDeviceRefresh&&window.pigaDeviceRefresh()",null);
    }
  }
  @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
  @Override protected void onDestroy(){if(pendingStlSelection!=null){pendingStlSelection.onReceiveValue(null);pendingStlSelection=null;}session=null;jobs.shutdownNow();if(web!=null)web.destroy();super.onDestroy();}
}
