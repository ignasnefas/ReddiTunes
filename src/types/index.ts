// Core types for the YouTube Terminal Player

export interface Track {
  id: string;
  youtubeId: string;
  title: string;
  artist?: string;
  duration?: number;
  redditUrl?: string;
  thumbnail?: string;
  addedAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  genre: string;
  subreddit: string;
  tracks: Track[];
  createdAt: number;
  lastUpdated: number;
}

export interface Genre {
  id: string;
  name: string;
  subreddit: string;
  description: string;
  icon: string;
  color: string;
  category?: string;
}

export interface RedditPost {
  id: string;
  title: string;
  url: string;
  permalink: string;
  score: number;
  created_utc: number;
  author: string;
  num_comments: number;
  selftext?: string;
}

export interface RedditComment {
  id: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
  replies?: RedditComment[];
  depth: number;
}

export interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
    after: string | null;
    before: string | null;
  };
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  isLoading: boolean;
  isMuted: boolean;
  repeatMode: 'off' | 'one' | 'all';
  isShuffled: boolean;
}

export interface PlaylistState {
  playlists: Playlist[];
  activePlaylist: Playlist | null;
  queue: Track[];
  queueIndex: number;
  isLoading: boolean;
  error: string | null;
}

export type Theme = 'dark' | 'light';

export interface ThemeConfig {
  name: string;
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  border: string;
}

export type SortOption = 'hot' | 'new' | 'top' | 'rising';
export type TimeFilter = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
