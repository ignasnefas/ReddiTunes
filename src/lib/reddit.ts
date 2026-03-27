'use client';

import { RedditPost, Track, SortOption, TimeFilter, RedditComment } from '@/types';
import { extractYouTubeId, cleanTitle, generateId, getYouTubeThumbnail } from './utils';

const REDDIT_BASE_URL = 'https://www.reddit.com';
const IS_CLIENT = typeof window !== 'undefined';

// Bot usernames to filter out
const BOT_USERNAMES = new Set(['MusicMirrorMan', 'Listige']);

/**
 * Use client-side fetching when available to bypass Vercel IP blocks
 */
async function fetchRedditApi(url: string) {
  if (IS_CLIENT) {
    // Client-side: fetch directly from browser with user's IP
    try {
      const { fetchSubredditJsonClient, fetchCommentsJsonClient } = await import('./redditClientSide');
      
      // Parse URL to determine which client function to use
      if (url.includes('/comments/')) {
        // Extract subreddit and postId from URL
        const match = url.match(/\/api\/reddit\/([^/]+)\/comments\/([^/?]+)/);
        if (match) {
          const [, subreddit, postId] = match;
          return fetchCommentsJsonClient(subreddit, postId);
        }
      } else {
        // Extract subreddit and params from URL
        const match = url.match(/\/api\/reddit\/([^/?]+)\?(.+)/);
        if (match) {
          const [, subreddit, queryString] = match;
          const params = new URLSearchParams(queryString);
          return fetchSubredditJsonClient(
            subreddit,
            params.get('sort') || 'hot',
            params.get('t') || 'week',
            Number(params.get('limit') || '100'),
            params.get('after') || undefined
          );
        }
      }
    } catch (err) {
      console.error('[Reddit] Client-side fetch failed, falling back to API route:', err);
    }
  }
  
  // Server-side or fallback: use API route
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Failed to fetch: ${response.status} ${body}`);
  }
  return response.json();
}

export async function fetchSubredditPosts(
  subreddit: string,
  sort: SortOption = 'hot',
  timeFilter: TimeFilter = 'week',
  limit: number = 100,
  after?: string
): Promise<{ posts: RedditPost[]; after: string | null }> {
  const params = new URLSearchParams({
    sort,
    limit: limit.toString(),
    raw_json: '1',
  });
  
  if (after) params.set('after', after);
  if (sort === 'top') params.set('t', timeFilter);
  
  const apiUrl = `/api/reddit/${subreddit}?${params.toString()}${after ? `&after=${encodeURIComponent(after)}` : ''}`;

  try {
    const data = await fetchRedditApi(apiUrl);
    
    if (!data.data || !Array.isArray(data.data.children)) {
      throw new Error(`Invalid response structure from Reddit API`);
    }

    return {
      posts: data.data.children.map((child: { data: RedditPost }) => child.data),
      after: data.data.after,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch from r/${subreddit}: Unknown error`);
  }
}

export function filterYouTubePosts(posts: RedditPost[]): RedditPost[] {
  return posts.filter((post) => {
    const url = post.url.toLowerCase();
    return (
      url.includes('youtube.com') ||
      url.includes('youtu.be') ||
      url.includes('youtube.com/embed')
    );
  });
}

export function convertPostToTrack(post: RedditPost): Track | null {
  const youtubeId = extractYouTubeId(post.url);
  if (!youtubeId) return null;
  
  const { title, artist } = cleanTitle(post.title);
  
  return {
    id: generateId(),
    youtubeId,
    title,
    artist,
    redditUrl: `${REDDIT_BASE_URL}${post.permalink}`,
    thumbnail: getYouTubeThumbnail(youtubeId),
    addedAt: post.created_utc * 1000,
  };
}

export async function fetchPlaylistFromSubreddit(
  subreddit: string,
  sort: SortOption = 'hot',
  timeFilter: TimeFilter = 'week',
  maxTracks: number = 50,
  excludeIds: Set<string> = new Set()
): Promise<Track[]> {
  const tracks: Track[] = [];
  let after: string | undefined;
  let attempts = 0;
  const maxAttempts = 5;
  
  while (tracks.length < maxTracks && attempts < maxAttempts) {
    const { posts, after: nextAfter } = await fetchSubredditPosts(
      subreddit,
      sort,
      timeFilter,
      100,
      after
    );
    
    const youtubePosts = filterYouTubePosts(posts);
    
    for (const post of youtubePosts) {
      const track = convertPostToTrack(post);
      // Skip duplicates and any excluded youtube IDs (already queued)
      if (
        track &&
        !tracks.some((t) => t.youtubeId === track.youtubeId) &&
        !excludeIds.has(track.youtubeId)
      ) {
        tracks.push(track);
        if (tracks.length >= maxTracks) break;
      }
    }
    
    if (!nextAfter) break;
    after = nextAfter;
    attempts++;
  }
  
  return tracks;
}

export async function fetchComments(permalink: string): Promise<RedditComment[]> {
  // Extract subreddit and post ID from permalink
  // permalink format: /r/subreddit/comments/post_id/title/
  const match = permalink.match(/\/r\/([^\/]+)\/comments\/([^\/]+)\//);
  if (!match) throw new Error('Invalid permalink format');
  const [, subreddit, postId] = match;

  const apiUrl = `/api/reddit/${subreddit}/comments/${postId}`;
  
  try {
    const data = await fetchRedditApi(apiUrl);
    // Reddit API returns [post_data, comments_data]
    const commentsData = data[1]?.data?.children || [];

    return commentsData
      .filter((child: any) => child.kind === 't1') // Only comments, not more objects
      .filter((child: any) => !BOT_USERNAMES.has(child.data.author)) // Filter out bot comments
      .map((child: any) => parseComment(child.data));
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

function parseComment(commentData: any, depth: number = 0): RedditComment {
  const comment: RedditComment = {
    id: commentData.id,
    author: commentData.author,
    body: commentData.selftext || commentData.body || '',
    score: commentData.score,
    created_utc: commentData.created_utc,
    depth,
  };
  
  if (commentData.replies && commentData.replies.data && commentData.replies.data.children) {
    comment.replies = commentData.replies.data.children
      .filter((child: any) => child.kind === 't1')
      .filter((child: any) => !BOT_USERNAMES.has(child.data.author)) // Filter out bot replies
      .map((child: any) => parseComment(child.data, depth + 1));
  }
  
  return comment;
}
