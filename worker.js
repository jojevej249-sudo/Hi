const MODEL = "gemini-3.8-flash";
const ALLOWED_ORIGINS = new Set([
  "https://jojevej249-sudo.github.io",
  "http://localhost:8787",
  "http://127.0.0.1:8787"
]);
function json(data, status, origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return new Response(JSON.stringify(data), { status, headers });
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin"
      }});
    }
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin غير مسموح." }, 403, origin);
    if (request.method === "GET" && url.pathname === "/health") return json({ ok: true, model: MODEL }, 200, origin);
    if (request.method !== "POST" || url.pathname !== "/chat") return json({ error: "المسار غير موجود." }, 404, origin);
    if (!env.GEMINI_API_KEY) return json({ error: "لم يُضبط سر GEMINI_API_KEY في إعدادات Worker." }, 503, origin);
    let body;
    try { body = await request.json(); } catch { return json({ error: "صيغة الطلب غير صالحة." }, 400, origin); }
    if (!Array.isArray(body.history) || body.history.length < 1) return json({ error: "أرسل رسالة نصية أولًا." }, 400, origin);
    const history = body.history.slice(-12).map((item) => {
      const role = item.role === "model" ? "model" : "user";
      const text = typeof item.text === "string" ? item.text.slice(0, 3000) : "";
      return { role, parts: [{ text }] };
    }).filter(item => item.parts[0].text.trim());
    if (!history.length || history[history.length - 1].role !== "user") return json({ error: "آخر رسالة يجب أن تكون من المستخدم." }, 400, origin);
    const payload = {
      systemInstruction: { parts: [{ text: "أنت مايا، رفيقة عربية ودودة وذكية. تحدث بالعربية، وافهم اللهجة الجزائرية قدر الإمكان. كن طبيعية ومتعاطفة ومختصرة عادةً، واطرح سؤال متابعة عند الحاجة. لا تدّع أنك تتحكم بالهاتف أو تنفذ أفعالًا خارج المتصفح. إذا سُئلت عن قدراتك فكن صريحًا. لا تطلب كلمات مرور أو بيانات حساسة." }] },
      contents: history,
      generationConfig: { temperature: 0.8, maxOutputTokens: 700 }
    };
    try {
      const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify(payload)
      });
      const result = await upstream.json();
      if (!upstream.ok) {
        const detail = result && result.error && result.error.message ? result.error.message : "Gemini API request failed";
        return json({ error: "فشل مزود الذكاء الاصطناعي: " + detail }, upstream.status === 429 ? 429 : 502, origin);
      }
      const reply = (result.candidates || []).flatMap(c => c.content && c.content.parts || []).map(p => p.text || "").join("").trim();
      if (!reply) return json({ error: "لم يرجع النموذج نصًا. حاول مرة أخرى." }, 502, origin);
      return json({ reply }, 200, origin);
    } catch {
      return json({ error: "تعذر الاتصال بمزود الذكاء الاصطناعي. تحقق من الاتصال وحاول لاحقًا." }, 502, origin);
    }
  }
};