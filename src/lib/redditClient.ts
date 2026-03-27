import Bottleneck from 'bottleneck';
import { LRUCache } from 'lru-cache';

const REDDIT_BASE = 'https://www.reddit.com';

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// In-memory cache (fallback). TTL in ms.
// Note: In Vercel serverless, this cache is per-invocation, not shared across requests
const cache = new LRUCache({ max: 1000, ttl: 30_000 });
const inFlight = new Map<string, Promise<any>>();

// Bottleneck limiter: configurable via env vars
// Reduced defaults for Vercel serverless environment
const limiter = new Bottleneck({
  maxConcurrent: Number(process.env.REDDIT_MAX_CONCURRENCY || 1),
  minTime: Number(process.env.REDDIT_MIN_TIME_MS || 200),
});

// Pause until timestamp when we need to respect rate limits
// WARNING: This is per-invocation state. Set to 0 initially to avoid stale pausedUntil from previous invocations
let pausedUntil = 0;

async function fetchWithRetries(url: string, opts: RequestInit = {}, ttl = 30_000) {
  const key = url + JSON.stringify(opts || {});
  if (cache.has(key)) return cache.get(key);
  if (inFlight.has(key)) return inFlight.get(key);

  const job = limiter.schedule(async () => {
    const maxAttempts = 4; // Reduced from 6 for Vercel timeout constraints
    let attempt = 0;

    while (true) {
      attempt++;

      // If we're currently paused due to rate limits, wait
      if (pausedUntil > Date.now()) {
        const waitMs = pausedUntil - Date.now();
        // Cap the wait time to 5 seconds to avoid Vercel timeouts
        const cappedWait = Math.min(5000, waitMs);
        await sleep(cappedWait);
        if (pausedUntil > Date.now()) {
          // Still paused, continue to next iteration
          continue;
        }
      }

      try {
        // Add timeout to fetch requests (30 seconds for Vercel)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        let res: Response;
        try {
          res = await fetch(url, {
            ...opts,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        // If 429 or server errors, handle backoff
        if (res.status === 429 || res.status >= 500) {
          const retryAfterHeader = res.headers.get('retry-after');
          const retryAfter = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 0;
          const backoff = Math.min(10_000, (2 ** (attempt - 1)) * 250) + Math.floor(Math.random() * 100);
          const wait = Math.max(retryAfter, backoff);

          if (attempt >= maxAttempts) {
            const text = await res.text().catch(() => '');
            throw new Error(`Failed after ${attempt} attempts: ${res.status} ${text}`);
          }

          // If server told us to retry later, set a pause (capped to 5 seconds)
          if (retryAfter > 0) {
            pausedUntil = Date.now() + Math.min(retryAfter, 5000);
          }

          await sleep(Math.min(wait, 5000));
          continue; // retry
        }

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`HTTP error ${res.status}: ${text}`);
        }

        // Respect rate limit headers if present
        const remaining = Number(res.headers.get('x-ratelimit-remaining') || '0');
        const resetSec = Number(res.headers.get('x-ratelimit-reset') || '0');
        if (!Number.isNaN(remaining) && !Number.isNaN(resetSec)) {
          // If we're about to run out, pause until reset (capped to 5 seconds)
          if (remaining <= 1 && resetSec > 0) {
            pausedUntil = Date.now() + Math.min(resetSec * 1000, 5000);
          }
        }

        const json = await res.json();

        // Cache result
        cache.set(key, json, { ttl });
        return json;
      } catch (err) {
        if (attempt >= maxAttempts) throw err;
        // On network errors, backoff and retry
        const backoff = Math.min(5000, (2 ** (attempt - 1)) * 250) + Math.floor(Math.random() * 100);
        await sleep(backoff);
        continue;
      }
    }
  });

  inFlight.set(key, job);
  try {
    return await job;
  } finally {
    inFlight.delete(key);
  }
}

export async function fetchSubredditJson(subreddit: string, sort = 'hot', timeFilter = 'week', limit = 100, after?: string) {
  const params = new URLSearchParams({ limit: String(limit), raw_json: '1' });
  if (after) params.set('after', after);
  if (sort === 'top') params.set('t', timeFilter);

  const url = `${REDDIT_BASE}/r/${subreddit}/${sort}.json?${params.toString()}`;

  // Use a slightly longer TTL for subreddit listings
  return fetchWithRetries(
    url,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ReddiTunes/1.0',
      },
    },
    30_000
  );
}

export async function fetchCommentsJson(subreddit: string, postId: string) {
  const url = `${REDDIT_BASE}/r/${subreddit}/comments/${postId}.json`;
  return fetchWithRetries(url, {}, 60_000);
}
