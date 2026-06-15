import { NextRequest, NextResponse } from 'next/server';
import { ensureRuntimeBootstrapped } from '@/lib/runtime/bootstrap';
import { parseParams } from '@/lib/http/request';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cameras/[id]/playback/webrtc
 * Proxy WebRTC SDP signaling ke go2rtc untuk stream playback.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  ensureRuntimeBootstrapped();
  const { id } = await parseParams(params);
  const sdpOffer = await req.text();

  const go2rtcHost = process.env.GO2RTC_HOST || '127.0.0.1';
  const go2rtcPort = process.env.GO2RTC_PORT || '1984';
  const url = `http://${go2rtcHost}:${go2rtcPort}/api/webrtc?src=playback-${id}`;

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: sdpOffer,
      signal: AbortSignal.timeout(5000),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      console.error(`[webrtc-playback-proxy] go2rtc error (${upstream.status}): ${errorText}`);
      return NextResponse.json(
        { error: `go2rtc responded ${upstream.status}: ${errorText}` },
        { status: 502 }
      );
    }

    const answerSdp = await upstream.text();
    return new NextResponse(answerSdp, {
      status: 200,
      headers: {
        'Content-Type': 'application/sdp',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('[webrtc-playback-proxy] Proxy request failed:', err.message);
    return NextResponse.json(
      { error: err?.message ?? 'WebRTC proxy failed' },
      { status: 502 }
    );
  }
}
