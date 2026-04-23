import { NextRequest } from 'next/server';
import { ok, withErrorHandler } from '@/lib/http/response';
import { parseJson } from '@/lib/http/request';
import { authService } from '@/lib/services/authService';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { username, password, full_name } = await parseJson<{
    username: unknown;
    password: unknown;
    full_name: unknown;
  }>(req);
  const response = authService.register(username, password, full_name);
  return ok(response);
});
