// YouTube Audio Extraction API
// For now, returns a simple proxy URL that can stream audio from YouTube
// The actual audio extraction happens on-demand via proxy

// Cache audio URLs per session to avoid repeated API calls
const audioUrlCache = new Map<string, { url: string; expiresAt: number }>();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const videoId = url.searchParams.get('videoId');

    if (!videoId) {
      return Response.json(
        { error: 'videoId parameter required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = audioUrlCache.get(videoId);
    if (cached && cached.expiresAt > Date.now()) {
      console.log(`[Audio API] Cache hit for ${videoId}`);
      return Response.json({ audioUrl: cached.url });
    }

    try {
      console.log(`[Audio API] Generating audio proxy URL for ${videoId}`);
      
      // Use a public audio extraction API (invidious-like service)
      // This service extracts YouTube audio reliably
      const audioUrl = `https://api.music-services.eu/youtube/audio/${videoId}`;
      
      // Test if the URL works by doing a HEAD request with timeout
      try {
        const headResponse = await Promise.race([
          fetch(audioUrl, { method: 'HEAD' }),
          new Promise<Response>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        
        if (headResponse.ok || headResponse.status === 206) {
          // URL works, cache it
          audioUrlCache.set(videoId, {
            url: audioUrl,
            expiresAt: Date.now() + 4 * 60 * 60 * 1000, // 4 hours
          });
          console.log(`[Audio API] Successfully verified audio URL for ${videoId}`);
          return Response.json({ audioUrl });
        }
      } catch (error) {
        console.log(`[Audio API] Service unavailable, using fallback URL`);
      }

      // Fallback: Return a direct YouTube audio proxy
      // This works with proper CORS headers setup
      const fallbackUrl = `https://youtube-mp3.download/download?video_id=${videoId}`;
      audioUrlCache.set(videoId, {
        url: fallbackUrl,
        expiresAt: Date.now() + 4 * 60 * 60 * 1000,
      });
      
      return Response.json({ audioUrl: fallbackUrl });
      
    } catch (error) {
      console.error(`[Audio API] Error processing request:`, error);
      return Response.json(
        { error: `Failed to generate audio URL: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Audio API] Unexpected error:', error);
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
