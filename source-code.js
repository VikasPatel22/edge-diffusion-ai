// ✅ CORS headers (reuse everywhere)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 📦 Helper for JSON responses
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

export default {
  async fetch(request, env) {
    const API_KEY = env.API_KEY;
    const url = new URL(request.url);

    // ✅ Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // 🚫 Only allow POST to root path
    if (request.method !== "POST" || url.pathname !== "/") {
      return json({ error: "Not allowed" }, 405);
    }

    // 🔐 API key check
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${API_KEY}`) {
      return json({ error: "Unauthorized" }, 401);
    }

    try {
      const body = await request.json();
      const prompt = body?.prompt;

      if (!prompt) {
        return json({ error: "Prompt is required" }, 400);
      }

      // 🧠 Generate image
      const result = await env.AI.run(
        "@cf/stabilityai/stable-diffusion-xl-base-1.0",
        { prompt }
      );

      // ✅ Return image WITH CORS
      return new Response(result, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          ...corsHeaders,
        },
      });

    } catch (err) {
      return json(
        { error: "Failed to generate image", details: err.message },
        500
      );
    }
  },
};
