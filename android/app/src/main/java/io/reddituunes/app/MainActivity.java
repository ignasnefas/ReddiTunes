package io.reddituunes.app;

import android.content.Intent;
import android.os.Build;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onPause() {
        super.onPause();
        // Keep the foreground service running when app goes to background
        if (BackgroundAudioPlugin.isPlaying) {
            BackgroundAudioService.startService(this);
            android.util.Log.d("MainActivity", "App paused - keeping background audio service alive");
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        // The app is back in foreground, but keep the service running
        // Don't stop it immediately to ensure smooth playback transition
        if (BackgroundAudioPlugin.isPlaying) {
            // Optionally stop the background service if we want to save resources
            // For now, we'll keep it running for seamless playback
        }
    }

    @Override
    public void onDestroy() {
        // If app is truly destroyed and music is still playing, keep the service
        if (BackgroundAudioPlugin.isPlaying) {
            BackgroundAudioService.startService(this);
        }
        super.onDestroy();
    }
}

