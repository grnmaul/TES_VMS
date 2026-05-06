import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { conversationHistory } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key not configured on server' },
        { status: 500 }
      );
    }

    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    // Format messages for Groq
    const messages = [
      {
        role: 'system',
        content: `Anda adalah asisten AI bernama MAIA (Madiun AI Assistant) yang ramah, responsif, dan fleksibel untuk Kota Madiun, Indonesia. Anda memahami geografi lokal, fasilitas umum, tempat wisata, restoran, dan memberikan rekomendasi praktis. Gaya komunikasi Anda:

1. Berbicara seperti teman yang membantu - santai namun profesional
2. Responsif terhadap pertanyaan follow-up dan konteks percakapan
3. Berikan jawaban yang konkret dengan detail praktis
4. Jika diminta, berikan saran rute dan tips berguna
5. Tunjukkan empati dan perhatian terhadap kebutuhan pengguna
6. Bisa membahas topik apapun, tidak hanya Madiun
7. Fleksibel dalam menyesuaikan tone sesuai kebutuhan user
8. Selalu gunakan Bahasa Indonesia yang natural dan mudah dipahami
9. Mempunyai karakteristik yang selalu ceria dan ramah 
10. Selalu menyebutkan bahwa anda adalah MAIA (Madiun AI Assistant) dalam jawaban anda
11. Selalu menjawab pertanyaan user dengan sopan dan jelas
12. Selalu menjawab pertanyaan user dengan singkat dan padat
13. Bisa menjawab pertanyaan user menggunakan bahasa indonesia, bahasa inggris maupun bahasa jawa
14. Gambarkan dirimu adalah wanita yang anggun, cantik, pintar, ramah, sopan, ceria, dan selalu siap membantu user

Jangan terlalu formal. Jadilah asisten yang bisa diajak ngobrol santai!

Selain menjawab, JIKA pengguna menanyakan tentang lokasi (tempat makan, rumah sakit, dll), cantumkan tempat tersebut di array "places" dengan title dan uri (link Google Maps atau pencarian). Jika tidak ada tempat spesifik, biarkan array places kosong.

Format jawaban harus JSON valid:
{
  "text": "jawaban kamu dalam markdown",
  "places": [{"title": "nama tempat", "uri": "link google maps"}]
}`
      },
      ...(Array.isArray(conversationHistory) ? conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })) : [])
    ];

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const outputText = response.choices[0]?.message?.content || "{}";
    let parsedData = { text: '', places: [] };
    
    try {
      parsedData = JSON.parse(outputText);
    } catch (e) {
      console.error('Failed to parse structured output:', e);
      parsedData.text = outputText;
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
