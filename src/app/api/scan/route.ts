import { NextRequest, NextResponse } from 'next/server';
import { crawlerEngine } from '@/crawler/CrawlerEngine';
import type { ScanRequest } from '@/utils/types';
import { ScanError } from '@/utils/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: ScanRequest = await request.json();

    // Validate request
    if (!body.url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Convert timestamp string to Date and attach abort signal
    const scanRequest: ScanRequest = {
      ...body,
      timestamp: new Date(body.timestamp),
      abortSignal: request.signal, // Pass the request's abort signal
    };

    // Perform scan
    const result = await crawlerEngine.scan(scanRequest);

    // Close browser after scan
    await crawlerEngine.close();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scan API error:', error);

    // Ensure browser is closed on error
    try {
      await crawlerEngine.close();
    } catch (closeError) {
      console.error('Failed to close browser:', closeError);
    }

    if (error instanceof ScanError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage, details: String(error) },
      { status: 500 }
    );
  }
}
