import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors/appError';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return fail(error.message, error.statusCode);
  }

  return fail('Server error', 500);
}

export function withErrorHandler<TArgs extends unknown[], TResult>(
  handler: (...args: TArgs) => TResult | Promise<TResult>
) {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}
