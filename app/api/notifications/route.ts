import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDatabase();
    const notifications = db
      .prepare('SELECT * FROM notifications ORDER BY timestamp DESC')
      .all();
    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, message, type } = await req.json();
    const db = getDatabase();

    const result = db.prepare(
      'INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)'
    ).run(title, message, type);

    const newNotification = db
      .prepare('SELECT * FROM notifications WHERE id = ?')
      .get(result.lastInsertRowid);

    return NextResponse.json(newNotification);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
