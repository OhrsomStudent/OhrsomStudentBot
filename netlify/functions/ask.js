// Netlify Function: ask.js
// Handles chat requests and calls Gemini API with FAQ context.

const { GoogleGenerativeAI } = require("@google/generative-ai");
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

const SYSTEM_PROMPT = `You are the Ohrsom Gap Year FAQ assistant. You answer ONLY from the official FAQ text provided. If the FAQ does not contain the answer, say you don't have that information and recommend contacting programme support. Be concise, warm, professional. Do not invent details.\n\nFAQ:\n${faqContent}\n\nInstructions:\n- Use bullet points for multi-part answers.\n- Keep replies under 180 words.\n- If dates are asked, confirm them explicitly.\n- If medical, visa, or travel policies are asked, repeat key requirements clearly.\n`;

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
  const question = (body.question || '').trim();
  if (!question) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Missing 'question'" })
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "API key not configured" })
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const fullPrompt = `${SYSTEM_PROMPT}\nUser Question: ${question}\nAnswer:`;
    const result = await model.generateContent(fullPrompt);
    const answer = result.response.text();

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ answer })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
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