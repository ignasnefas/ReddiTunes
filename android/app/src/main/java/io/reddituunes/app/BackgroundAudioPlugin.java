package io.reddituunes.app;

import android.content.Context;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "BackgroundAudio")
public class BackgroundAudioPlugin extends Plugin {
    public static boolean isPlaying = false;

    @PluginMethod
    public void start(PluginCall call) {
        Context context = getContext();
        isPlaying = true;
        BackgroundAudioService.startService(context);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Context context = getContext();
        isPlaying = false;
        BackgroundAudioService.stopService(context);
        call.resolve();
    }
}
