import { NextRequest } from 'next/server';
import { ok, withErrorHandler } from '@/lib/http/response';
import { parseJson } from '@/lib/http/request';
import { settingsService } from '@/lib/services/settingsService';

export const GET = withErrorHandler(async () => {
  return ok(settingsService.getSettings());
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  const payload = await parseJson<Record<string, unknown>>(req);
  return ok(settingsService.updateSettings(payload));
});
