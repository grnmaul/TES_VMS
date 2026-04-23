import { NextRequest } from 'next/server';
import { cameraService } from '@/lib/services/cameraService';
import { ok, withErrorHandler } from '@/lib/http/response';
import { parseJson, parseParams } from '@/lib/http/request';
import { ensureRuntimeBootstrapped } from '@/lib/runtime/bootstrap';

export const PUT = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
 ) => {
  ensureRuntimeBootstrapped();
  const { id } = await parseParams(params);
  const { name, location, ip_address, stream_url, status } = await parseJson<{
    name: unknown;
    location: unknown;
    ip_address: unknown;
    stream_url?: unknown;
    status: unknown;
  }>(req);
  const updatedCamera = cameraService.updateCamera(id, {
    name,
    location,
    ip_address,
    stream_url,
    status,
  });
  return ok(updatedCamera);
});

export const DELETE = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
 ) => {
  ensureRuntimeBootstrapped();
  const { id } = await parseParams(params);
  const response = cameraService.deleteCamera(id);
  return ok(response);
});
