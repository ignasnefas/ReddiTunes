package io.reddituunes.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "BackgroundAudio")
public class BackgroundAudioPlugin extends Plugin {
    public static boolean isPlaying = false;
    private static AudioFocusRequest audioFocusRequest = null;
    private static AudioManager audioManager = null;

    @PluginMethod
    public void start(PluginCall call) {
        Context context = getContext();
        isPlaying = true;
        
        // Request audio focus to prevent other apps from ducking our audio
        requestAudioFocus(context);
        
        // Start the foreground service to keep the app alive
        BackgroundAudioService.startService(context);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Context context = getContext();
        isPlaying = false;
        
        // Abandon audio focus when stopping
        abandonAudioFocus(context);
        
        BackgroundAudioService.stopService(context);
        call.resolve();
    }

    @PluginMethod
    public void updateTrack(PluginCall call) {
        String title = call.getString("title", "ReddiTunes");
        String artist = call.getString("artist", "Now Playing");
        
        Context context = getContext();
        BackgroundAudioService.updateTrack(context, title, artist);
        
        call.resolve();
    }

    private static void requestAudioFocus(Context context) {
        if (audioManager == null) {
            audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        }
        
        if (audioManager == null) {
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();

            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                .setAudioAttributes(audioAttributes)
                .setAcceptsDelayedFocusGain(true)
                .build();

            int result = audioManager.requestAudioFocus(audioFocusRequest);
            android.util.Log.d("BackgroundAudio", "Audio focus request result: " + result);
        } else {
            int result = audioManager.requestAudioFocus(
                null,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
            );
            android.util.Log.d("BackgroundAudio", "Audio focus request result: " + result);
        }
    }

    private static void abandonAudioFocus(Context context) {
        if (audioManager == null) {
            audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        }

        if (audioManager == null) {
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
            audioFocusRequest = null;
        } else {
            audioManager.abandonAudioFocus(null);
        }
    }
}
