import { NextRequest } from 'next/server';
import { AppError } from '@/lib/errors/appError';

export async function parseJson<T>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new AppError('Invalid JSON body', 400);
  }
}

export async function parseParams<TParams extends Record<string, string>>(
  params: Promise<TParams>
): Promise<TParams> {
  try {
    return await params;
  } catch {
    throw new AppError('Invalid route params', 400);
  }
}
