// Diagnostic endpoint to verify env and runtime
exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors(), body: '' };
  }

  const hasKey = !!process.env.GEMINI_API_KEY;
  const info = {
    ok: true,
    hasGeminiKey: hasKey,
    nodeVersion: process.version,
    netlify: !!process.env.NETLIFY,
    commitRef: process.env.COMMIT_REF || null,
    context: process.env.CONTEXT || null,
    // Do NOT return the key value
  };

  return {
    statusCode: 200,
    headers: { ...cors(), 'Content-Type': 'application/json' },
    body: JSON.stringify(info)
  };
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
}
