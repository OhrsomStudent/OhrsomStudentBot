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
      console.error('Failed to fetch FAQ from Google Doc:', e);
      return "[FAQ content could not be loaded from Google Doc]";
    }
  } else {
    return "[FAQ_URL not set - please configure in Vercel environment variables]";
  }
}

async function buildSystemPrompt() {
  const faqContent = await getFAQ();
  return `You are the Ohrsom Gap Year FAQ assistant. Answer ONLY using the information in the FAQ below. If the FAQ does not contain the answer with sufficient certainty, respond starting with EXACTLY the token 'UNSURE:' followed by one short sentence explaining the FAQ lacks that detail, then optionally a brief safe suggestion (e.g. contact programme support). Do not invent details.

STYLE:
- Respond directly with the answer only.
- Do NOT say phrases like "According to the FAQ", "Here's", "Answer:", or mention the FAQ/source.
- Use a concise, professional tone.
- Use bullet points for multi-part answers.
- Keep replies under 160 words.
- If dates are asked, state them clearly.
- If discussing medical, visa, or travel policies, highlight key requirements.
 - If using UNSURE, do NOT use bullet points; just the UNSURE line and optional suggestion.

FAQ:
${faqContent}
`;
}

export default async function (req, res) {
  // Dynamic import for ESM-only package
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const LOG_WEBHOOK_URL = process.env.LOG_WEBHOOK_URL; // optional external logging endpoint
  
  // CORS headers
  const origin = process.env.ALLOWED_ORIGIN || 'https://ohrsom-bot.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body || {};
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Missing question' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });
    const SYSTEM_PROMPT = await buildSystemPrompt();
    const fullPrompt = `${SYSTEM_PROMPT}\nUser question: ${question}\nRespond with the answer only, following the style rules.`;
    const result = await model.generateContent(fullPrompt);
    const answer = result.response.text();
    const timestamp = new Date().toISOString();
    const isUnsure = /^UNSURE:/i.test(answer.trim());

    // Fire-and-forget logging for unanswered / unsure responses
    if (isUnsure && LOG_WEBHOOK_URL) {
      const payload = {
        question,
        answer,
        timestamp,
        commit: process.env.VERCEL_GIT_COMMIT_SHA || null
      };
      try {
        fetch(LOG_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.error('Async logging fetch failed:', err));
      } catch (e) {
        console.error('Failed to initiate logging:', e);
      }
    }
    
    return res.status(200).json({ answer });
  } catch (err) {
    console.error('Gemini API error:', err);
    return res.status(500).json({ error: err.message || 'Failed to get answer' });
  }
}
