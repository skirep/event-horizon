package cat.skirep.eventhorizon;
import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.*;
import android.net.Uri;
import android.content.Intent;
import android.hardware.*;
import android.view.View;
import androidx.webkit.WebViewAssetLoader;
public class MainActivity extends Activity implements SensorEventListener {
 private WebView web;
 private SensorManager sensors;
 private boolean requested=false;
 private long last=0;
 private final Handler ui=new Handler(Looper.getMainLooper());
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  if(BuildConfig.FLAVOR.equals("quest")){
   Uri url=Uri.parse("https://skirep.github.io/event-horizon/?quest=1");
   Intent browser=new Intent(Intent.ACTION_VIEW,url);browser.setPackage("com.oculus.browser");
   try { startActivity(browser); finish(); return; }
   catch(Exception e){browser.setPackage(null);try{startActivity(browser);finish();return;}catch(Exception ignored){}}
  }
  getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
  web=new WebView(this);setContentView(web);
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setMediaPlaybackRequiresUserGesture(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);
  final WebViewAssetLoader loader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest req){return loader.shouldInterceptRequest(req.getUrl());}
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest req){return !"appassets.androidplatform.net".equals(req.getUrl().getHost());}
  });
  web.setWebChromeClient(new WebChromeClient());
  sensors=(SensorManager)getSystemService(SENSOR_SERVICE);
  web.addJavascriptInterface(new Object(){@JavascriptInterface public void start(){ui.post(()->{requested=true;registerSensors();});}},"AndroidSensors");
  web.loadUrl("https://appassets.androidplatform.net/assets/index.html");
 }
 private void registerSensors(){Sensor sensor=sensors.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);if(sensor!=null)sensors.registerListener(this,sensor,SensorManager.SENSOR_DELAY_GAME);}
 @Override public void onSensorChanged(SensorEvent e){long now=System.currentTimeMillis();if(now-last<30||web==null)return;last=now;float[] r=new float[9],v=new float[3];SensorManager.getRotationMatrixFromVector(r,e.values);SensorManager.getOrientation(r,v);double a=-Math.toDegrees(v[0]),b=-Math.toDegrees(v[1]),g=Math.toDegrees(v[2]);web.evaluateJavascript("window.dispatchEvent(new CustomEvent('nativeorientation',{detail:{alpha:"+a+",beta:"+b+",gamma:"+g+"}}))",null);}
 @Override public void onAccuracyChanged(Sensor s,int a){}
 @Override public void onPause(){super.onPause();if(web!=null)web.onPause();if(sensors!=null)sensors.unregisterListener(this);}
 @Override public void onResume(){super.onResume();if(web!=null)web.onResume();if(sensors!=null&&requested)registerSensors();}
 @Override public void onDestroy(){if(web!=null){web.removeJavascriptInterface("AndroidSensors");web.destroy();}super.onDestroy();}
 @Override public void onBackPressed(){if(web!=null)web.evaluateJavascript("document.getElementById('back').click()",null);else super.onBackPressed();}
}
