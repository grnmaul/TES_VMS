import { NextRequest } from 'next/server';
import { ok, fail, withErrorHandler } from '@/lib/http/response';
import { parseJson, parseParams } from '@/lib/http/request';
import { CameraRepository } from '@/lib/repositories/cameraRepository';
import { ensureRuntimeBootstrapped } from '@/lib/runtime/bootstrap';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getPlaybackUrl(streamUrl: string, starttime: string): string {
  let base = streamUrl.trim();
  if (base.endsWith('/')) {
    base = base.substring(0, base.length - 1);
  }

  // Hikvision specific playback Channels format
  // standard stream path: /Streaming/Channels/102
  // standard playback path: /Streaming/Channels/101?starttime=YYYYMMDDTHHmmssZ
  const channelsRegex = /\/Streaming\/Channels\/\d+/i;
  if (channelsRegex.test(base)) {
    return base.replace(channelsRegex, `/Streaming/Channels/101?starttime=${starttime}`);
  } else {
    return `${base}/Streaming/Channels/101?starttime=${starttime}`;
  }
}

export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  ensureRuntimeBootstrapped();
  const { id } = await parseParams(params);
  const { datetime } = await parseJson<{ datetime: string }>(req);

  if (!datetime) {
    return fail('Datetime is required', 400);
  }

  const cameraRepo = new CameraRepository();
  const camera = cameraRepo.findById(Number(id));

  if (!camera) {
    return fail('Camera not found', 404);
  }

  if (!camera.stream_url) {
    return fail('Camera stream URL is not configured', 400);
  }

  // Format datetime to Hikvision starttime format: YYYYMMDDTHHmmssZ
  // Using direct string manipulation of local digits to avoid timezone offsets
  const cleanDatetime = datetime.replace(/[-:]/g, ''); // "20260520T1000"
  const localDigits = cleanDatetime.length === 13 ? `${cleanDatetime}00` : cleanDatetime; // "20260520T100000"
  const starttime = `${localDigits}Z`; // "20260520T100000Z"

  // Check if central NVR/DVR routing is configured in nvr_config.json
  let playbackUrl = '';
  try {
    const configPath = path.join(process.cwd(), 'nvr_config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.enabled && config.nvr_ip) {
        const nvrIp = config.nvr_ip;
        const nvrUser = config.nvr_user || 'admin';
        const nvrPass = config.nvr_password || 'Dishub2024';
        
        // Track ID format: Channel N main stream is channel N01 (e.g. id=50 -> 5001)
        const trackId = `${id}01`;
        playbackUrl = `rtsp://${nvrUser}:${nvrPass}@${nvrIp}:554/Streaming/Channels/${trackId}?starttime=${starttime}`;
        console.log(`[playback-api] Central NVR Routing Active! URL: ${playbackUrl}`);
      }
    }
  } catch (err: any) {
    console.warn('[playback-api] Failed to read nvr_config.json, falling back:', err.message);
  }

  if (!playbackUrl) {
    playbackUrl = getPlaybackUrl(camera.stream_url, starttime);
  }

  const go2rtcHost = process.env.GO2RTC_HOST || '127.0.0.1';
  const go2rtcPort = process.env.GO2RTC_PORT || '1984';
  const streamName = `playback-${id}`;

  const putUrl = `http://${go2rtcHost}:${go2rtcPort}/api/streams?name=${streamName}&src=${encodeURIComponent(playbackUrl)}`;

  try {
    console.log(`[playback-api] Registering stream: ${streamName} with URL: ${playbackUrl}`);
    const upstream = await fetch(putUrl, {
      method: 'PUT',
      signal: AbortSignal.timeout(5000),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      console.error(`[playback-api] go2rtc error (${upstream.status}): ${errorText}`);
      return fail(`go2rtc failed to register stream: ${errorText}`, 502);
    }

    return ok({
      success: true,
      stream_name: streamName,
      playback_url: playbackUrl,
    });
  } catch (err: any) {
    console.error('[playback-api] Request failed:', err.message);
    return fail(err?.message ?? 'Failed to register stream in go2rtc', 502);
  }
});

export const DELETE = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  ensureRuntimeBootstrapped();
  const { id } = await parseParams(params);

  const go2rtcHost = process.env.GO2RTC_HOST || '127.0.0.1';
  const go2rtcPort = process.env.GO2RTC_PORT || '1984';
  const streamName = `playback-${id}`;

  const deleteUrl = `http://${go2rtcHost}:${go2rtcPort}/api/streams?src=${streamName}`;

  try {
    console.log(`[playback-api] Deleting stream: ${streamName}`);
    const upstream = await fetch(deleteUrl, {
      method: 'DELETE',
      signal: AbortSignal.timeout(5000),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      console.warn(`[playback-api] go2rtc delete stream warning (${upstream.status}): ${errorText}`);
    }

    return ok({ success: true });
  } catch (err: any) {
    console.error('[playback-api] Delete request failed:', err.message);
    return fail(err?.message ?? 'Failed to delete stream in go2rtc', 502);
  }
});
