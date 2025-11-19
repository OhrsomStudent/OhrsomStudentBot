// Netlify Function: ask.js
// Handles chat requests and calls Gemini API with FAQ context.

const fs = require("fs");
const path = require("path");

// Load FAQ content (synchronously at cold start)
let faqContent = "";
try {
  // Try multiple possible paths
  const possiblePaths = [
    path.join(__dirname, "..", "..", "faq.txt"),
    path.join(process.cwd(), "faq.txt"),
    "/var/task/faq.txt"
  ];
  
  for (const faqPath of possiblePaths) {
    if (fs.existsSync(faqPath)) {
      faqContent = fs.readFileSync(faqPath, "utf-8");
      break;
    }
  }
  
  if (!faqContent) {
    faqContent = "[FAQ content could not be loaded - file not found]";
  }
} catch (e) {
  faqContent = `[FAQ content could not be loaded: ${e.message}]`;
}

const SYSTEM_PROMPT = `You are the Ohrsom Gap Year FAQ assistant. Answer ONLY using the information in the FAQ below. If the FAQ does not contain the answer, say you don't have that information and suggest contacting programme support. Do not invent details.\n\nSTYLE:\n- Respond directly with the answer only.\n- Do NOT say phrases like "According to the FAQ", "Here's", "Answer:", or mention the FAQ/source.\n- Use a concise, professional tone.\n- Use bullet points for multi-part answers.\n- Keep replies under 160 words.\n- If dates are asked, state them clearly.\n- If discussing medical, visa, or travel policies, highlight key requirements.\n\nFAQ:\n${faqContent}\n`;

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
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}