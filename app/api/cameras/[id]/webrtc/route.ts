import { NextRequest, NextResponse } from 'next/server';
import { ensureRuntimeBootstrapped } from '@/lib/runtime/bootstrap';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cameras/[id]/webrtc
 * Proxy WebRTC SDP signaling ke go2rtc.
 * Browser tidak bisa langsung fetch ke go2rtc:1984 karena CORS,
 * tapi server-to-server (Next.js → go2rtc) tidak ada CORS.
 * Data video WebRTC mengalir langsung peer-to-peer setelah signaling selesai.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  ensureRuntimeBootstrapped();
  const { id } = await params;
  const sdpOffer = await req.text();

  const go2rtcHost = process.env.GO2RTC_HOST || 'localhost';
  const go2rtcPort = process.env.GO2RTC_PORT || '1984';
  const url = `http://${go2rtcHost}:${go2rtcPort}/api/webrtc?src=camera-${id}`;

  try {
      const upstream = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: sdpOffer,
        signal: AbortSignal.timeout(3000),
      });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      console.error(`[webrtc-proxy] go2rtc error (${upstream.status}): ${errorText}`);
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
    console.error('[webrtc-proxy] Proxy request failed:', err.message);
    return NextResponse.json(
      { error: err?.message ?? 'WebRTC proxy failed' },
      { status: 502 }
    );
  }
}
