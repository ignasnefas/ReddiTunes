/**
 * Client-side Reddit fetcher
 * Makes requests directly from the browser to use client IP instead of Vercel server IP
 * Helps avoid Reddit rate-limiting/blocking of Vercel IPs
 */
'use client';

const REDDIT_BASE = 'https://www.reddit.com';

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// Client-side in-memory cache with TTL
const clientCache = new Map<string, { data: any; expiry: number }>();

/**
 * Fetch from Reddit directly from client
 * Retries with backoff, respects rate limit headers
 */
async function fetchRedditDirect(
  url: string,
  maxAttempts = 4
): Promise<any> {
  const cacheKey = url;
  
  // Check cache
  const cached = clientCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for client

      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const waitMs = retryAfter ? Math.min(Number(retryAfter) * 1000, 5000) : 1000;
        
        if (attempt < maxAttempts) {
          await sleep(waitMs);
          continue;
        }
        throw new Error(`Rate limited after ${attempt} attempts`);
      }

      // Handle server errors
      if (response.status >= 500) {
        const backoff = Math.min(5000, (2 ** (attempt - 1)) * 250);
        
        if (attempt < maxAttempts) {
          await sleep(backoff);
          continue;
        }
        throw new Error(`Server error ${response.status} after ${attempt} attempts`);
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const json = await response.json();

      // Parse rate limit headers
      const remaining = Number(response.headers.get('x-ratelimit-remaining') || '60');
      const resetSec = Number(response.headers.get('x-ratelimit-reset') || '0');

      // Log rate limit status if getting low
      if (remaining < 10) {
        console.warn(`[Reddit] Rate limit: ${remaining} requests remaining, resets in ${resetSec}s`);
      }

      // Cache for 30 seconds
      clientCache.set(cacheKey, {
        data: json,
        expiry: Date.now() + 30000,
      });

      console.log(`[Reddit] Fetched ${url.split('?')[0]} (attempt ${attempt})`);
      return json;
    } catch (err) {
      if (attempt >= maxAttempts) {
        console.error(`[Reddit] Failed after ${maxAttempts} attempts:`, err);
        throw err;
      }

      const backoff = Math.min(5000, (2 ** (attempt - 1)) * 250) + Math.random() * 200;
      console.warn(`[Reddit] Attempt ${attempt} failed, retrying in ${backoff.toFixed(0)}ms:`, err);
      await sleep(backoff);
    }
  }

  throw new Error('All retry attempts failed');
}

export async function fetchSubredditJsonClient(
  subreddit: string,
  sort: string = 'hot',
  timeFilter: string = 'week',
  limit: number = 100,
  after?: string
): Promise<any> {
  const params = new URLSearchParams({
    limit: Math.min(limit, 100).toString(),
    raw_json: '1',
  });

  if (after) params.set('after', after);
  if (sort === 'top') params.set('t', timeFilter);

  const url = `${REDDIT_BASE}/r/${subreddit}/${sort}.json?${params.toString()}`;

  return fetchRedditDirect(url);
}

export async function fetchCommentsJsonClient(
  subreddit: string,
  postId: string
): Promise<any> {
  const url = `${REDDIT_BASE}/r/${subreddit}/comments/${postId}.json`;
  return fetchRedditDirect(url, 3);
}

/**
 * Clear client cache (useful for manual refresh)
 */
export function clearRedditCache() {
  clientCache.clear();
  console.log('[Reddit] Cache cleared');
}

/**
 * Get cache stats
 */
export function getRedditCacheStats() {
  return {
    size: clientCache.size,
    entries: Array.from(clientCache.entries()).map(([key, value]) => ({
      url: key,
      expiresIn: Math.max(0, value.expiry - Date.now()),
    })),
  };
}
