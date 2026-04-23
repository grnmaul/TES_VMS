import { ok, withErrorHandler } from '@/lib/http/response';
import { ensureRuntimeBootstrapped } from '@/lib/runtime/bootstrap';
import { wsHub } from '@/lib/realtime/wsHub';

export const GET = withErrorHandler(async () => {
  ensureRuntimeBootstrapped();
  return ok({ url: wsHub.getWebSocketUrl() });
});
