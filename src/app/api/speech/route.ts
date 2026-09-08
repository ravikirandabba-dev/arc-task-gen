import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, speaker = "peak", modelId = "mistv2" } = body;

    const rimeApiKey = process.env.RIME_API_KEY;

    if (!rimeApiKey) {
      return new Response(JSON.stringify({ error: "Missing RIME_API_KEY" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const rimeReqBody = JSON.stringify({
      text,
      speaker,
      modelId,
    });

    const response = await fetch("https://users.rime.ai/v1/rime-tts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${rimeApiKey}`,
        "Content-Type": "application/json",
        "Accept": "audio/mp3",
      },
      body: rimeReqBody,
      signal: req.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Rime API Error:", errorText);
      return new Response(JSON.stringify({ error: "Rime API returned an error" }), { status: response.status, headers: { "Content-Type": "application/json" } });
    }

    // Return the response stream directly as a proxy
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "audio/mp3",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Speech API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
