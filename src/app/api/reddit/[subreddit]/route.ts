import { NextRequest, NextResponse } from 'next/server';
import { fetchSubredditJson } from '@/lib/redditClient';

// Set Vercel timeout limits
export const maxDuration = 30;

// Next.js static export mode support
export const dynamic = 'force-static';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subreddit: string }> }
) {
  const { subreddit } = await params;
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'hot';
  const timeFilter = searchParams.get('t') || 'week';
  const limit = Math.min(Number(searchParams.get('limit') || '100'), 100); // Cap at 100 for Vercel
  const after = searchParams.get('after') || undefined;

  try {
    const data = await fetchSubredditJson(subreddit, sort, timeFilter, limit, after);
    
    // Add cache headers for production
    const response = NextResponse.json(data);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    console.error('Error fetching from Reddit via client:', error);
    
    // Determine appropriate status code
    let status = 500;
    let message = 'Internal server error';
    
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        status = 429;
        message = 'Rate limited - please try again in a moment';
      } else if (error.message.includes('timeout') || error.message.includes('AbortError')) {
        status = 504;
        message = 'Request timeout';
      } else if (error.message.includes('404')) {
        status = 404;
        message = 'Subreddit not found';
      }
    }
    
    return NextResponse.json({ error: message }, { status });
  }
}