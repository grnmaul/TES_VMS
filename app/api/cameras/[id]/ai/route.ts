import { NextRequest } from 'next/server';
import { ok, withErrorHandler } from '@/lib/http/response';
import { parseJson, parseParams } from '@/lib/http/request';
import { ensureRuntimeBootstrapped } from '@/lib/runtime/bootstrap';
import { CameraRepository } from '@/lib/repositories/cameraRepository';
import { wsHub } from '@/lib/realtime/wsHub';

export const dynamic = 'force-dynamic';

const cameraRepository = new CameraRepository();

export const PATCH = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  ensureRuntimeBootstrapped();
  const { id } = await parseParams(params);
  const { ai_enabled } = await parseJson<{ ai_enabled: boolean }>(req);

  const updated = cameraRepository.updateAiEnabled(Number(id), ai_enabled);
  if (!updated) {
    return new Response(JSON.stringify({ error: 'Camera not found' }), { status: 404 });
  }

  wsHub.broadcast({ type: 'camera:updated', payload: updated });
  return ok(updated);
});
