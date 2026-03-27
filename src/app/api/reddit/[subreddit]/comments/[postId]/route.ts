import { NextRequest, NextResponse } from 'next/server';
import { fetchCommentsJson } from '@/lib/redditClient';

// Set Vercel timeout limits
export const maxDuration = 30;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ subreddit: string; postId: string }> }
) {
  const { subreddit, postId } = await params;

  try {
    const data = await fetchCommentsJson(subreddit, postId);
    
    // Add cache headers
    const response = NextResponse.json(data);
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    return response;
  } catch (error) {
    console.error('Error fetching comments via reddit client:', error);
    
    let status = 500;
    let message = 'Internal server error';
    
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        status = 429;
        message = 'Rate limited';
      } else if (error.message.includes('timeout') || error.message.includes('AbortError')) {
        status = 504;
        message = 'Request timeout';
      } else if (error.message.includes('404')) {
        status = 404;
        message = 'Post not found';
      }
    }
    
    return NextResponse.json({ error: message }, { status });
  }
}
