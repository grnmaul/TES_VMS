import { NextRequest } from 'next/server';
import { authService } from '@/lib/services/authService';
import { ok, withErrorHandler } from '@/lib/http/response';
import { parseJson } from '@/lib/http/request';
import { getAuthUser } from '@/lib/auth/utils';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) throw new Error('Unauthorized');

  const { oldPassword, newPassword } = await parseJson<{oldPassword: string, newPassword: string}>(req);
  
  const result = authService.changePassword(user.id, oldPassword, newPassword);
  return ok(result);
});
