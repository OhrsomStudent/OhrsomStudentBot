// List available models for your API key
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: cors(), body: '' };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { ...cors(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "API key not configured" })
    };
  }

  try {
    // Test the API key directly with a REST call
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        statusCode: 200,
        headers: { ...cors(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: "API key issue",
          status: response.status,
          details: data,
          keyPrefix: apiKey.slice(0, 10) + "..."
        })
      };
    }

    const availableModels = data.models
      ? data.models
          .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
          .map(m => ({ name: m.name, displayName: m.displayName }))
      : [];

    return {
      statusCode: 200,
      headers: { ...cors(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        availableModels,
        count: availableModels.length
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...cors(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
}
