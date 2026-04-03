package io.reddituunes.app;

import android.content.Intent;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onPause() {
        super.onPause();
        if (BackgroundAudioPlugin.isPlaying) {
            BackgroundAudioService.startService(this);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        BackgroundAudioService.stopService(this);
    }
}

