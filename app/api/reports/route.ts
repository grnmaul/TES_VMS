import { NextRequest } from 'next/server';
import { ok, withErrorHandler } from '@/lib/http/response';
import { parseJson } from '@/lib/http/request';
import { getDatabase } from '@/lib/db';
import { notificationService } from '@/lib/services/notificationService';
import { ensureRuntimeBootstrapped } from '@/lib/runtime/bootstrap';
import { wsHub } from '@/lib/realtime/wsHub';
import { getAuthUser } from '@/lib/auth/utils';
import { AppError } from '@/lib/errors/appError';

export const dynamic = 'force-dynamic';

const CATEGORY_LABELS: Record<string, string> = {
  camera_offline: 'Kamera Mati',
  stream_error: 'Stream Error',
  feature_bug: 'Fitur Tidak Berfungsi',
  other: 'Masalah Lainnya',
};

export const POST = withErrorHandler(async (req: NextRequest) => {
  ensureRuntimeBootstrapped();

  const user = getAuthUser(req);
  if (!user) throw new AppError('Unauthorized', 401);

  const { camera_id, camera_name, category, description, urgency } = await parseJson<{
    camera_id: number;
    camera_name: string;
    category: string;
    description: string;
    urgency?: string;
  }>(req);

  if (!description || String(description).trim().length === 0) {
    throw new AppError('Deskripsi laporan wajib diisi', 400);
  }

  const db = getDatabase();

  // Insert report record
  const result = db.prepare(`
    INSERT INTO reports (user_id, user_name, camera_id, camera_name, category, description, urgency)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    user.username,
    camera_id || null,
    camera_name || null,
    category || 'other',
    String(description).trim(),
    urgency === 'urgent' ? 'urgent' : 'normal',
  );

  const reportId = result.lastInsertRowid;
  const categoryLabel = CATEGORY_LABELS[category] || 'Masalah Lainnya';
  const urgencyTag = urgency === 'urgent' ? ' 🔴 MENDESAK' : '';
  const cameraTag = camera_name ? ` pada kamera ${camera_name}` : '';

  // Create notification for admin
  const notifTitle = `${urgencyTag}[Laporan Masuk] ${categoryLabel}${cameraTag}`;
  const notifMessage = `Dilaporkan oleh: ${user.username}. Keterangan: ${String(description).trim()}`;

  const notif = notificationService.createNotification(
    notifTitle,
    notifMessage,
    urgency === 'urgent' ? 'error' : 'warning',
    'admin',
  );

  // Broadcast notification to admin in real-time
  wsHub.broadcast({ type: 'notification:new', payload: notif });

  return ok({ id: reportId, message: 'Laporan berhasil dikirim' }, 201);
});
