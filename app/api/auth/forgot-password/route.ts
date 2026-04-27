import { NextRequest } from 'next/server';
import { ok, withErrorHandler } from '@/lib/http/response';
import { parseJson } from '@/lib/http/request';
import { authService } from '@/lib/services/authService';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { username } = await parseJson<{ username: unknown }>(req);
  const response = await Promise.resolve(authService.forgotPassword(username));
  return ok(response);
});
