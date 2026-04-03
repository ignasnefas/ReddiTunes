package io.reddituunes.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class BackgroundAudioService extends Service {
    public static final String CHANNEL_ID = "REDDITUNES_BACKGROUND_AUDIO";
    public static final int NOTIFICATION_ID = 1001;
    
    private static final String ACTION_UPDATE_TRACK = "io.reddituunes.app.UPDATE_TRACK";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_ARTIST = "artist";
    public static final String EXTRA_THUMBNAIL = "thumbnail";
    
    private String currentTitle = "ReddiTunes";
    private String currentArtist = "Now Playing";
    private String currentThumbnail = null;
    private final IBinder binder = new LocalBinder();

    public class LocalBinder extends Binder {
        BackgroundAudioService getService() {
            return BackgroundAudioService.this;
        }
    }

    public static void startService(Context context) {
        Intent serviceIntent = new Intent(context, BackgroundAudioService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }

    public static void stopService(Context context) {
        Intent stopIntent = new Intent(context, BackgroundAudioService.class);
        context.stopService(stopIntent);
    }

    public static void updateTrack(Context context, String title, String artist) {
        Intent updateIntent = new Intent(context, BackgroundAudioService.class);
        updateIntent.setAction(ACTION_UPDATE_TRACK);
        updateIntent.putExtra(EXTRA_TITLE, title);
        updateIntent.putExtra(EXTRA_ARTIST, artist);
        context.startService(updateIntent);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        updateNotification();
        startForeground(NOTIFICATION_ID, buildNotification());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_UPDATE_TRACK.equals(intent.getAction())) {
            String title = intent.getStringExtra(EXTRA_TITLE);
            String artist = intent.getStringExtra(EXTRA_ARTIST);
            if (title != null) {
                currentTitle = title;
            }
            if (artist != null) {
                currentArtist = artist;
            }
            updateNotification();
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        stopForeground(true);
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    private void updateNotification() {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotification());
        }
    }

    private Notification buildNotification() {
        int appIcon = getApplicationContext().getResources()
            .getIdentifier("ic_launcher", "mipmap", getPackageName());
        if (appIcon == 0) {
            appIcon = android.R.drawable.ic_media_play;
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setSmallIcon(appIcon)
            .setOngoing(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_SERVICE);

        return builder.build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "ReddiTunes Background Audio",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Background audio playback for ReddiTunes");
                channel.enableVibration(false);
                channel.setSound(null, null);
                manager.createNotificationChannel(channel);
            }
        }
    }
}
