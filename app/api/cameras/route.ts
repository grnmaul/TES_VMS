import { NextRequest } from 'next/server';
import { cameraService } from '@/lib/services/cameraService';
import { ok, withErrorHandler } from '@/lib/http/response';
import { parseJson } from '@/lib/http/request';
import { ensureRuntimeBootstrapped } from '@/lib/runtime/bootstrap';

export const GET = withErrorHandler(async (req: NextRequest) => {
  ensureRuntimeBootstrapped();
  const cameras = cameraService.listCameras();
  return ok(cameras);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  ensureRuntimeBootstrapped();
  const { name, location, ip_address, stream_url, status } = await parseJson<{
    name: unknown;
    location: unknown;
    ip_address: unknown;
    stream_url?: unknown;
    status: unknown;
  }>(req);
  const newCamera = cameraService.createCamera({
    name,
    location,
    ip_address,
    stream_url,
    status,
  });
  return ok(newCamera, 201);
});
