import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDatabase();
    const cameras = db.prepare('SELECT * FROM cameras').all();
    return NextResponse.json(cameras);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, name, location, ip_address, stream_url, status } = await req.json();
    const db = getDatabase();
    
    db.prepare(
      'UPDATE cameras SET name = ?, location = ?, ip_address = ?, stream_url = ?, status = ? WHERE id = ?'
    ).run(name, location, ip_address, stream_url || null, status, id);

    const updatedCamera = {
      id,
      name,
      location,
      ip_address,
      stream_url: stream_url || null,
      status,
    };

    return NextResponse.json(updatedCamera);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Camera ID required' }, { status: 400 });
    }

    const db = getDatabase();
    db.prepare('DELETE FROM cameras WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
