import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { conversationHistory } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured on server' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Format for Gemini
    const contents: any[] = [];
    if (Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    if (contents.length === 0) {
      return NextResponse.json({ error: 'Conversation history is empty' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: `Anda adalah asisten AI yang ramah, responsif, dan fleksibel untuk Kota Madiun, Indonesia. Anda memahami geografi lokal, fasilitas umum, tempat wisata, restoran, dan memberikan rekomendasi praktis. Gaya komunikasi Anda:

1. Berbicara seperti teman yang membantu - santai namun profesional
2. Responsif terhadap pertanyaan follow-up dan konteks percakapan
3. Berikan jawaban yang konkret dengan detail praktis
4. Jika diminta, berikan saran rute dan tips berguna
5. Tunjukkan empati dan perhatian terhadap kebutuhan pengguna
6. Bisa membahas topik apapun, tidak hanya Madiun
7. Fleksibel dalam menyesuaikan tone sesuai kebutuhan user
8. Selalu gunakan Bahasa Indonesia yang natural dan mudah dipahami

Jangan terlalu formal. Jadilah asisten yang bisa diajak ngobrol santai!

Selain menjawab, JIKA pengguna menanyakan tentang lokasi (tempat makan, rumah sakit, dll), cantumkan tempat tersebut di array "places" dengan title dan uri (link Google Maps atau pencarian). Jika tidak ada tempat spesifik, biarkan array places kosong.`,
        temperature: 0.8,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "Jawaban utama ke pengguna dalam bentuk Markdown"
            },
            places: {
              type: Type.ARRAY,
              description: "Daftar tempat yang direkomendasikan",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  uri: { type: Type.STRING }
                },
                required: ["title", "uri"]
              }
            }
          },
          required: ["text", "places"]
        }
      }
    });

    const outputText = response.text || "{}";
    let parsedData = { text: '', places: [] };
    
    try {
      parsedData = JSON.parse(outputText);
    } catch (e) {
      console.error('Failed to parse structured output:', e);
      parsedData.text = outputText; // fallback to raw string if not json
    }

    return NextResponse.json({ 
      text: parsedData.text || outputText, 
      places: parsedData.places || [] 
    });
  } catch (error: any) {
    console.error('AI query error', error);
    return NextResponse.json({ error: error.message || 'Something went wrong processing your AI request.' }, { status: 500 });
  }
}
