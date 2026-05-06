import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/db';
import { ok, withErrorHandler } from '@/lib/http/response';
import { parseJson } from '@/lib/http/request';
import { ensureRuntimeBootstrapped } from '@/lib/runtime/bootstrap';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async (req: NextRequest) => {
  ensureRuntimeBootstrapped();
  const db = getDatabase();
  const url = new URL(req.url);
  const cameraId = url.searchParams.get('camera_id');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  let rows;
  if (cameraId) {
    rows = db
      .prepare(
        'SELECT * FROM ai_detections WHERE camera_id = ? ORDER BY timestamp DESC LIMIT ?'
      )
      .all(parseInt(cameraId), limit);
  } else {
    rows = db
      .prepare('SELECT * FROM ai_detections ORDER BY timestamp DESC LIMIT ?')
      .all(limit);
  }

  return ok(rows);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  ensureRuntimeBootstrapped();
  const { camera_id, detected_objects, person_count, vehicle_count, confidence } =
    await parseJson<{
      camera_id: number;
      detected_objects: unknown[];
      person_count: number;
      vehicle_count: number;
      confidence: number;
    }>(req);

  const db = getDatabase();
  const result = db
    .prepare(
      'INSERT INTO ai_detections (camera_id, detected_objects, person_count, vehicle_count, confidence) VALUES (?, ?, ?, ?, ?)'
    )
    .run(
      camera_id,
      JSON.stringify(detected_objects),
      person_count ?? 0,
      vehicle_count ?? 0,
      confidence ?? 0
    );

  const inserted = db
    .prepare('SELECT * FROM ai_detections WHERE id = ?')
    .get(result.lastInsertRowid);

  return ok(inserted, 201);
});
