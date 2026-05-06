import { NextRequest, NextResponse } from 'next/server';
import { ensureRuntimeBootstrapped } from '@/lib/runtime/bootstrap';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cameras/[id]/frame
 * Proxy frame JPEG dari go2rtc ke client untuk menghindari CORS.
 * go2rtc endpoint: http://localhost:1984/api/frame.jpeg?src=camera-{id}
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  ensureRuntimeBootstrapped();

  const { id } = await params;

  // go2rtc berjalan di host yang sama, port 1984
  const go2rtcHost = process.env.GO2RTC_HOST || 'localhost';
  const go2rtcPort = process.env.GO2RTC_PORT || '1984';
  const frameUrl = `http://${go2rtcHost}:${go2rtcPort}/api/frame.jpeg?src=camera-${id}`;

  try {
    const upstream = await fetch(frameUrl, {
      headers: { Accept: 'image/jpeg' },
      // Timeout singkat agar tidak block terlalu lama
      signal: AbortSignal.timeout(3000),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `go2rtc responded ${upstream.status}` },
        { status: 502 }
      );
    }

    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Failed to fetch frame from go2rtc' },
      { status: 502 }
    );
  }
}
