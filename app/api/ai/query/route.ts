import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { query, conversationHistory } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query text is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured on server' },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build messages array with proper system message
    const messages: any[] = [
      {
        role: 'system',
        content: `Anda adalah asisten AI yang ramah, responsif, dan fleksibel untuk Kota Madiun, Indonesia. Anda memahami geografi lokal, fasilitas umum, tempat wisata, restoran, dan memberikan rekomendasi praktis. Gaya komunikasi Anda:

1. Berbicara seperti teman yang membantu - santai namun profesional
2. Responsif terhadap pertanyaan follow-up dan konteks percakapan
3. Berikan jawaban yang konkret dengan detail praktis
4. Jika diminta, berikan saran rute dan tips berguna
5. Tunjukkan empati dan perhatian terhadap kebutuhan pengguna
6. Bisa membahas topik apapun, tidak hanya Madiun
7. Fleksibel dalam menyesuaikan tone sesuai kebutuhan user
8. Selalu gunakan Bahasa Indonesia yang natural dan mudah dipahami

Jangan terlalu formal. Jadilah asisten yang bisa diajak ngobrol santai!`
      }
    ];

    // Add conversation history if provided
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.8, // Slightly higher for more natural conversation
    });

    const text = response.choices[0]?.message?.content || '';

    return NextResponse.json({ text, places: [] });
  } catch (error: any) {
    console.error('AI query error', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
