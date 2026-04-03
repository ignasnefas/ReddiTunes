'use client';

import { useState, useEffect } from 'react';
import { RedditComment, RedditPost } from '@/types';
import { fetchComments } from '@/lib/reddit';
import { X, MessageCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface CommentsModalProps {
  permalink: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsModal({ permalink, title, isOpen, onClose }: CommentsModalProps) {
  const [post, setPost] = useState<RedditPost | null>(null);
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && permalink) {
      loadComments();
    }
  }, [isOpen, permalink]);

  const loadComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const { post: fetchedPost, comments: fetchedComments } = await fetchComments(permalink);
      setPost(fetchedPost);
      setComments(fetchedComments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderComment = (comment: RedditComment, isReply: boolean = false) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedComments.has(comment.id);

    return (
      <div key={comment.id} className={`${isReply ? 'ml-4 border-l border-terminal-border/30 pl-2' : 'mb-2'}`}>
        <div className="flex items-start gap-2 text-[11px] font-mono">
          <div className="text-terminal-accent font-bold">{comment.author}</div>
          <div className="text-terminal-muted">{formatTime(comment.created_utc)}</div>
          <div className="text-terminal-muted">↑{comment.score}</div>
        </div>
        <div className="text-terminal-text text-[11px] font-mono mt-1 whitespace-pre-wrap">
          {comment.body}
        </div>
        {hasReplies && (
          <button
            onClick={() => toggleExpanded(comment.id)}
            className="flex items-center gap-1 text-terminal-accent text-[10px] font-mono mt-1 hover:text-terminal-accent/80"
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
          </button>
        )}
        {hasReplies && isExpanded && (
          <div className="mt-2">
            {comment.replies!.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-terminal-bg border border-terminal-border rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-terminal-border">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-terminal-accent" />
            <h2 className="text-terminal-text font-mono text-sm truncate">
              <span className="sr-only">Comments for </span>{title}
            </h2>
          </div>
          <button onClick={onClose} className="text-terminal-muted hover:text-terminal-text">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="text-terminal-muted text-center py-8">Loading comments...</div>
          )}
          
          {error && (
            <div className="text-red-400 text-center py-8">{error}</div>
          )}

          {!loading && !error && post && post.selftext && (
            <div className="mb-4 p-3 border border-terminal-border rounded bg-terminal-surface">
              <div className="text-terminal-accent text-[10px] font-mono mb-1">Original post by {post.author}</div>
              <div className="text-terminal-text text-[11px] font-mono whitespace-pre-wrap">{post.selftext}</div>
            </div>
          )}
          
          {!loading && !error && comments.length === 0 && (
            <div className="text-terminal-muted text-center py-8">No comments yet</div>
          )}
          
          {!loading && !error && comments.map(comment => renderComment(comment))}
        </div>
      </div>
    </div>
  );
}