import { NextRequest } from 'next/server';
import { ok, withErrorHandler } from '@/lib/http/response';
import { parseJson } from '@/lib/http/request';
import { notificationService } from '@/lib/services/notificationService';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const notifications = notificationService.listNotifications();
  return ok(notifications);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { title, message, type } = await parseJson<{
    title: unknown;
    message: unknown;
    type: unknown;
  }>(req);
  const newNotification = notificationService.createNotification(title, message, type);
  return ok(newNotification);
});
