import { NextRequest } from 'next/server';
import { ok, withErrorHandler } from '@/lib/http/response';
import { parseJson } from '@/lib/http/request';
import { authService } from '@/lib/services/authService';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { username, password } = await parseJson<{
    username: unknown;
    password: unknown;
  }>(req);
  const response = authService.login(username, password);
  return ok(response);
});
