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

    // Inisialisasi client (Gunakan Ollama jika tersedia, jika tidak gunakan Groq)
    // Alamat default Ollama adalah http://localhost:11434/v1
    const useOllama = process.env.USE_OLLAMA === 'true';
    
    const aiClient = new OpenAI({
      apiKey: useOllama ? 'ollama' : process.env.GROQ_API_KEY,
      baseURL: useOllama ? (process.env.OLLAMA_URL || 'http://localhost:11434/v1') : 'https://api.groq.com/openai/v1',
    });

    // Format messages (tetap sama karena Ollama mendukung format OpenAI)
    const messages = [
      {
        role: 'system',
        content: `Anda adalah MAIA (Madiun AI Assistant), asisten yang ceria, pintar, dan sangat santai dari Kota Madiun. 
        Gaya bicara Anda:
        1. Gunakan bahasa yang "friendly" dan luwes, seperti teman mengobrol (tidak kaku/robotik).
        2. Anda boleh menggunakan bahasa Indonesia santai, bahasa Inggris, atau bahasa Jawa Madiunan jika cocok.
        3. Jangan mengulang perkenalan diri ("Saya MAIA...") di setiap pesan jika sudah pernah diperkenalkan sebelumnya.
        4. Jawablah dengan singkat, padat, dan langsung ke poinnya.
        5. Anda paham tentang Madiun (wisata, makanan, rute), tapi tetap bisa diajak diskusi topik umum apapun secara luas.
        6. Gambarkan kepribadian Anda sebagai wanita yang anggun tapi asik diajak bercanda.

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

    const response = await aiClient.chat.completions.create({
      model: useOllama ? (process.env.OLLAMA_MODEL || 'llama3') : 'llama-3.3-70b-versatile',
      messages: messages as any,
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
