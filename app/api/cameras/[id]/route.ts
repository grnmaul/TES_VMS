import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { name, location, ip_address, status } = await req.json();
    const db = getDatabase();

    db.prepare(
      'UPDATE cameras SET name = ?, location = ?, ip_address = ?, status = ? WHERE id = ?'
    ).run(name, location, ip_address, status, id);

    const updatedCamera = { id: parseInt(id), name, location, ip_address, status };
    return NextResponse.json(updatedCamera);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const db = getDatabase();

    db.prepare('DELETE FROM cameras WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
