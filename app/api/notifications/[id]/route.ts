import { NextRequest } from 'next/server';
import { ok, withErrorHandler } from '@/lib/http/response';
import { notificationService } from '@/lib/services/notificationService';
import { ensureRuntimeBootstrapped } from '@/lib/runtime/bootstrap';

export const dynamic = 'force-dynamic';

export const PUT = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  ensureRuntimeBootstrapped();
  const id = parseInt(params.id, 10);
  return ok(notificationService.markNotificationAsRead(id));
});

export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  ensureRuntimeBootstrapped();
  const id = parseInt(params.id, 10);
  return ok(notificationService.deleteNotification(id));
});
