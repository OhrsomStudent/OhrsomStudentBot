// Netlify Function: ask.js
// Handles chat requests and calls Gemini API with FAQ context.
// Fetches FAQ from Google Doc (FAQ_URL) with 10min cache, falls back to local file.

const fs = require("fs");
const path = require("path");
const fetch = require('node-fetch');

// FAQ cache (in-memory, 10 min TTL)
let cachedFAQ = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getFAQ() {
  const FAQ_URL = process.env.FAQ_URL;
  const now = Date.now();
  if (FAQ_URL) {
    if (cachedFAQ && (now - cacheTime < CACHE_TTL)) {
      return cachedFAQ;
    }
    try {
      const res = await fetch(FAQ_URL);
      if (!res.ok) throw new Error('Failed to fetch FAQ');
      const text = await res.text();
      cachedFAQ = text;
      cacheTime = now;
      return text;
    } catch (e) {
      // Fallback to local
      return loadLocalFAQ();
    }
  } else {
    return loadLocalFAQ();
  }
}

function loadLocalFAQ() {
  try {
    const possiblePaths = [
      path.join(__dirname, "..", "..", "faq.txt"),
      path.join(process.cwd(), "faq.txt"),
      "/var/task/faq.txt"
    ];
    for (const faqPath of possiblePaths) {
      if (fs.existsSync(faqPath)) {
        return fs.readFileSync(faqPath, "utf-8");
      }
    }
    return "[FAQ content could not be loaded - file not found]";
  } catch (e) {
    return `[FAQ content could not be loaded: ${e.message}]`;
  }
}

async function buildSystemPrompt() {
  const faqContent = await getFAQ();
  return `You are the Ohrsom Gap Year FAQ assistant. Answer ONLY using the information in the FAQ below. If the FAQ does not contain the answer, say you don't have that information and suggest contacting programme support. Do not invent details.

STYLE:
- Respond directly with the answer only.
- Do NOT say phrases like "According to the FAQ", "Here's", "Answer:", or mention the FAQ/source.
- Use a concise, professional tone.
- Use bullet points for multi-part answers.
- Keep replies under 160 words.
- If dates are asked, state them clearly.
- If discussing medical, visa, or travel policies, highlight key requirements.

FAQ:
${faqContent}
`;
}

exports.handler = async function(event) {
  // ESM-only package: import dynamically inside the handler
  const { GoogleGenerativeAI } = await import("@google/generative-ai");

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(), body: "" };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
  const question = (body.question || '').trim();
  if (!question) {
    return {
      statusCode: 400,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "Missing 'question'" })
    };
  }

  // Optional shared secret protection
  const requiredSecret = process.env.FUNCTION_SECRET;
  if (requiredSecret) {
    const provided = event.headers['x-site-key'] || event.headers['X-Site-Key'];
    if (provided !== requiredSecret) {
      return {
        statusCode: 403,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Forbidden' })
      };
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "API key not configured" })
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
    const SYSTEM_PROMPT = await buildSystemPrompt();
    const fullPrompt = `${SYSTEM_PROMPT}\nUser question: ${question}\nRespond with the answer only, following the style rules.`;
    const result = await model.generateContent(fullPrompt);
    const answer = result.response.text();

    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer })
    };
  } catch (err) {
    console.error("Gemini function error:", err);
    return {
      statusCode: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Gemini request failed' })
    };
  }
}

function corsHeaders() {
  const allowed = process.env.ALLOWED_ORIGIN || 'https://ohrsombot.netlify.app';
  // Allow localhost for local dev alongside production
  const origin = allowed.includes('localhost') ? allowed : undefined;
  return {
    'Access-Control-Allow-Origin': origin || 'https://ohrsombot.netlify.app',
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type, X-Site-Key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}