'use client';

import { RedditPost, Track, SortOption, TimeFilter, RedditComment } from '@/types';
import { extractYouTubeId, cleanTitle, generateId, getYouTubeThumbnail } from './utils';

const REDDIT_BASE_URL = 'https://www.reddit.com';

// Bot usernames to filter out
const BOT_USERNAMES = new Set(['MusicMirrorMan', 'Listige']);

async function fetchRedditApi(url: string) {
  // Always use the local API route in the browser.
  // Reddit blocks browser-origin fetches with CORS, so direct client-side calls are not reliable.
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Failed to fetch: ${response.status} ${body}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(
      `Invalid JSON response from ${url}: ${err instanceof Error ? err.message : String(err)}\n${text.slice(0, 200)}`
    );
  }
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

export async function fetchComments(permalink: string): Promise<{ post: RedditPost | null; comments: RedditComment[] }> {
  // Extract subreddit and post ID from permalink
  // permalink format: /r/subreddit/comments/post_id/title/
  const match = permalink.match(/\/r\/([^\/]+)\/comments\/([^\/]+)\//);
  if (!match) throw new Error('Invalid permalink format');
  const [, subreddit, postId] = match;

  const apiUrl = `/api/reddit/${subreddit}/comments/${postId}`;
  
  try {
    const data = await fetchRedditApi(apiUrl);
    // Reddit API returns [post_data, comments_data]
    const postData = data[0]?.data?.children?.[0]?.data;
    const commentsData = data[1]?.data?.children || [];

    const post: RedditPost | null = postData
      ? {
          id: postData.id,
          title: postData.title,
          url: postData.url,
          permalink: postData.permalink,
          score: postData.score,
          created_utc: postData.created_utc,
          author: postData.author,
          num_comments: postData.num_comments,
          selftext: postData.selftext || '',
        }
      : null;

    const comments = commentsData
      .filter((child: any) => child.kind === 't1') // Only comments, not more objects
      .filter((child: any) => !BOT_USERNAMES.has(child.data.author)) // Filter out bot comments
      .map((child: any) => parseComment(child.data));

    return { post, comments };
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
