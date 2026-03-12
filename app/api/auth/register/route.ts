import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDatabase } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { username, password, full_name } = await req.json();
    const db = getDatabase();
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare(
      'INSERT INTO users (username, password, full_name) VALUES (?, ?, ?)'
    ).run(username, hashedPassword, full_name);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
