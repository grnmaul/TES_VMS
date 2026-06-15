import { NextRequest } from 'next/server';
import { ok, withErrorHandler } from '@/lib/http/response';
import { parseParams } from '@/lib/http/request';
import { notificationService } from '@/lib/services/notificationService';
import { ensureRuntimeBootstrapped } from '@/lib/runtime/bootstrap';

export const dynamic = 'force-dynamic';

export const PUT = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  ensureRuntimeBootstrapped();
  const { id } = await parseParams(params);
  const notificationId = parseInt(id, 10);
  return ok(notificationService.markNotificationAsRead(notificationId));
});

export const DELETE = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  ensureRuntimeBootstrapped();
  const { id } = await parseParams(params);
  const notificationId = parseInt(id, 10);
  return ok(notificationService.deleteNotification(notificationId));
});
