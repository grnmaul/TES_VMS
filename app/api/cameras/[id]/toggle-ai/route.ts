import { NextRequest, NextResponse } from 'next/server';
import { cameraService } from '@/lib/services/cameraService';
import { AppError } from '@/lib/errors/appError';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { enabled } = await req.json();
    const updated = cameraService.toggleAI(id, enabled);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
