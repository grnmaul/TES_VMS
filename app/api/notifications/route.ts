import { NextRequest } from 'next/server';
import { ok, withErrorHandler } from '@/lib/http/response';
import { parseJson } from '@/lib/http/request';
import { notificationService } from '@/lib/services/notificationService';
import { ensureRuntimeBootstrapped } from '@/lib/runtime/bootstrap';
import { wsHub } from '@/lib/realtime/wsHub';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async (req: NextRequest) => {
  ensureRuntimeBootstrapped();
  const searchParams = req.nextUrl.searchParams;
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');
  
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;
  const offset = offsetParam ? parseInt(offsetParam, 10) : undefined;

  const notifications = notificationService.listNotifications(limit, offset);
  return ok(notifications);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  ensureRuntimeBootstrapped();
  const { title, message, type } = await parseJson<{
    title: unknown;
    message: unknown;
    type: unknown;
  }>(req);
  const newNotification = notificationService.createNotification(title, message, type);
  wsHub.broadcast({ type: 'notification:new', payload: newNotification });
  return ok(newNotification);
});

export const PUT = withErrorHandler(async () => {
  ensureRuntimeBootstrapped();
  return ok(notificationService.markAllAsRead());
});

export const DELETE = withErrorHandler(async () => {
  ensureRuntimeBootstrapped();
  return ok(notificationService.clearAll());
});
