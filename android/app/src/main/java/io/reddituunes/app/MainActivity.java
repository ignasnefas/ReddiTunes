package io.reddituunes.app;

import android.os.Build;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onPause() {
        super.onPause();
        // BridgeActivity.onPause() calls webView.onPause() which freezes JS timers and
        // pauses media. Counter this immediately so background audio keeps playing.
        getBridge().getWebView().onResume();
        getBridge().getWebView().resumeTimers();
        android.util.Log.d("MainActivity", "onPause: resumed WebView for background audio");
    }

    @Override
    public void onStop() {
        super.onStop();
        // Same treatment for onStop to prevent a second WebView suspension
        getBridge().getWebView().onResume();
        getBridge().getWebView().resumeTimers();
        android.util.Log.d("MainActivity", "onStop: resumed WebView for background audio");
    }

    @Override
    public void onResume() {
        super.onResume();
        // Ensure timers are running now that we're foregrounded
        getBridge().getWebView().resumeTimers();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }
}

