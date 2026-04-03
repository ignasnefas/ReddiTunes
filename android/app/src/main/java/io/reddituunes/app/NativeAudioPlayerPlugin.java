package io.reddituunes.app;

import android.app.Activity;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.MediaPlayer;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeAudioPlayer")
public class NativeAudioPlayerPlugin extends Plugin {
  private MediaPlayer mediaPlayer;
  private MediaSession mediaSession;
  private AudioManager audioManager;
  private Handler progressHandler;
  private static final int PROGRESS_UPDATE_INTERVAL = 1000; // 1 second
  private String currentAudioUrl;
  private boolean isPlaying = false;
  private float volumeLevel = 1.0f;

  @Override
  public void load() {
    audioManager = (AudioManager) getActivity().getSystemService(Context.AUDIO_SERVICE);
    progressHandler = new Handler(Looper.getMainLooper());
  }

  private void initMediaPlayer() {
    if (mediaPlayer != null) {
      mediaPlayer.release();
    }
    mediaPlayer = new MediaPlayer();
    mediaPlayer.setOnCompletionListener(mp -> {
      isPlaying = false;
      notifyListeners("audioEnded", new JSObject());
    });
    mediaPlayer.setOnErrorListener((mp, what, extra) -> {
      isPlaying = false;
      JSObject error = new JSObject();
      error.put("what", what);
      error.put("extra", extra);
      notifyListeners("audioError", error);
      return true;
    });
  }

  private void initMediaSession() {
    if (mediaSession == null) {
      mediaSession = new MediaSession(getActivity(), "ReddiTunesAudioPlayer");
      mediaSession.setCallback(
        new MediaSession.Callback() {
          @Override
          public void onPlay() {
            try {
              mediaPlayer.start();
              isPlaying = true;
              notifyListeners("audioPlaying", new JSObject());
              updateMediaSession();
              startProgressTracker();
            } catch (Exception e) {
              notifyError(e);
            }
          }

          @Override
          public void onPause() {
            mediaPlayer.pause();
            isPlaying = false;
            notifyListeners("audioPaused", new JSObject());
            updateMediaSession();
            stopProgressTracker();
          }

          @Override
          public void onStop() {
            mediaPlayer.stop();
            mediaPlayer.release();
            mediaPlayer = null;
            isPlaying = false;
            mediaSession.release();
            mediaSession = null;
            notifyListeners("audioStopped", new JSObject());
            stopProgressTracker();
          }

          @Override
          public void onSeekTo(long pos) {
            mediaPlayer.seekTo((int) pos);
            JSObject data = new JSObject();
            data.put("position", pos);
            notifyListeners("audioSeeked", data);
          }
        }
      );
    }
    mediaSession.setActive(true);
  }

  @PluginMethod
  public void loadAudio(PluginCall call) {
    String url = call.getString("url");
    if (url == null) {
      call.reject("URL is required");
      return;
    }

    try {
      initMediaPlayer();
      initMediaSession();
      mediaPlayer.setAudioAttributes(
        new AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_MEDIA)
          .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
          .build()
      );
      mediaPlayer.setDataSource(url);
      mediaPlayer.prepare();
      currentAudioUrl = url;
      notifyListeners("audioLoaded", new JSObject());
      call.resolve(new JSObject().put("success", true));
    } catch (Exception e) {
      call.reject(e.getMessage());
      notifyError(e);
    }
  }

  @PluginMethod
  public void play(PluginCall call) {
    try {
      if (mediaPlayer != null && !isPlaying) {
        requestAudioFocus();
        mediaPlayer.start();
        isPlaying = true;
        notifyListeners("audioPlaying", new JSObject());
        updateMediaSession();
        startProgressTracker();
      }
      call.resolve();
    } catch (Exception e) {
      call.reject(e.getMessage());
      notifyError(e);
    }
  }

  @PluginMethod
  public void pause(PluginCall call) {
    try {
      if (mediaPlayer != null && mediaPlayer.isPlaying()) {
        mediaPlayer.pause();
        isPlaying = false;
        notifyListeners("audioPaused", new JSObject());
        updateMediaSession();
        stopProgressTracker();
      }
      call.resolve();
    } catch (Exception e) {
      call.reject(e.getMessage());
      notifyError(e);
    }
  }

  @PluginMethod
  public void stop(PluginCall call) {
    try {
      if (mediaPlayer != null) {
        mediaPlayer.stop();
        mediaPlayer.release();
        mediaPlayer = null;
        isPlaying = false;
        notifyListeners("audioStopped", new JSObject());
        stopProgressTracker();
        releaseAudioFocus();
      }
      call.resolve();
    } catch (Exception e) {
      call.reject(e.getMessage());
      notifyError(e);
    }
  }

  @PluginMethod
  public void seek(PluginCall call) {
    int position = call.getInt("position", 0);
    try {
      if (mediaPlayer != null) {
        mediaPlayer.seekTo(position);
        JSObject data = new JSObject();
        data.put("position", position);
        notifyListeners("audioSeeked", data);
      }
      call.resolve();
    } catch (Exception e) {
      call.reject(e.getMessage());
      notifyError(e);
    }
  }

  @PluginMethod
  public void setVolume(PluginCall call) {
    float volume = call.getFloat("volume", 1.0f);
    volume = Math.min(1.0f, Math.max(0.0f, volume));
    try {
      if (mediaPlayer != null) {
        volumeLevel = volume;
        mediaPlayer.setVolume(volume, volume);
      }
      call.resolve();
    } catch (Exception e) {
      call.reject(e.getMessage());
      notifyError(e);
    }
  }

  @PluginMethod
  public void getDuration(PluginCall call) {
    try {
      int duration = mediaPlayer != null ? mediaPlayer.getDuration() : 0;
      JSObject result = new JSObject();
      result.put("duration", duration);
      call.resolve(result);
    } catch (Exception e) {
      call.reject(e.getMessage());
      notifyError(e);
    }
  }

  @PluginMethod
  public void getCurrentPosition(PluginCall call) {
    try {
      int position = mediaPlayer != null ? mediaPlayer.getCurrentPosition() : 0;
      JSObject result = new JSObject();
      result.put("position", position);
      call.resolve(result);
    } catch (Exception e) {
      call.reject(e.getMessage());
      notifyError(e);
    }
  }

  @PluginMethod
  public void release(PluginCall call) {
    try {
      if (mediaPlayer != null) {
        mediaPlayer.release();
        mediaPlayer = null;
      }
      if (mediaSession != null) {
        mediaSession.release();
        mediaSession = null;
      }
      releaseAudioFocus();
      stopProgressTracker();
      call.resolve();
    } catch (Exception e) {
      call.reject(e.getMessage());
      notifyError(e);
    }
  }

  private void requestAudioFocus() {
    if (audioManager != null) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_MEDIA)
          .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
          .build();
        AudioFocusRequest focusRequest = new AudioFocusRequest.Builder(
          AudioManager.AUDIOFOCUS_GAIN
        )
          .setAudioAttributes(audioAttributes)
          .build();
        audioManager.requestAudioFocus(focusRequest);
      } else {
        audioManager.requestAudioFocus(
          null,
          AudioManager.STREAM_MUSIC,
          AudioManager.AUDIOFOCUS_GAIN
        );
      }
    }
  }

  private void releaseAudioFocus() {
    if (audioManager != null) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        audioManager.abandonAudioFocusRequest(new AudioFocusRequest.Builder(0).build());
      } else {
        audioManager.abandonAudioFocus(null);
      }
    }
  }

  private void updateMediaSession() {
    if (mediaSession == null || mediaPlayer == null) return;

    PlaybackState.Builder stateBuilder = new PlaybackState.Builder()
      .setActions(
        PlaybackState.ACTION_PLAY |
        PlaybackState.ACTION_PAUSE |
        PlaybackState.ACTION_SEEK_TO |
        PlaybackState.ACTION_PLAY_PAUSE
      )
      .setState(
        isPlaying ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED,
        mediaPlayer.getCurrentPosition(),
        1.0f
      );

    mediaSession.setPlaybackState(stateBuilder.build());

    MediaMetadata.Builder metadataBuilder = new MediaMetadata.Builder()
      .putLong(MediaMetadata.METADATA_KEY_DURATION, mediaPlayer.getDuration())
      .putString(MediaMetadata.METADATA_KEY_TITLE, "Playing...")
      .putString(MediaMetadata.METADATA_KEY_ARTIST, "ReddiTunes");

    mediaSession.setMetadata(metadataBuilder.build());
  }

  private void startProgressTracker() {
    stopProgressTracker();
    progressHandler.postDelayed(new Runnable() {
      @Override
      public void run() {
        if (isPlaying && mediaPlayer != null) {
          JSObject data = new JSObject();
          data.put("position", mediaPlayer.getCurrentPosition());
          data.put("duration", mediaPlayer.getDuration());
          notifyListeners("audioProgress", data);
          progressHandler.postDelayed(this, PROGRESS_UPDATE_INTERVAL);
        }
      }
    }, PROGRESS_UPDATE_INTERVAL);
  }

  private void stopProgressTracker() {
    progressHandler.removeCallbacksAndMessages(null);
  }

  private void notifyError(Exception e) {
    JSObject error = new JSObject();
    error.put("message", e.getMessage());
    error.put("type", e.getClass().getSimpleName());
    notifyListeners("audioError", error);
  }
}
