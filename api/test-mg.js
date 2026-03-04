export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say hello in 5 words' }]
      })
    });

    const text = await response.text();
    return res.status(200).json({
      api_status: response.status,
      api_response: text,
      key_length: apiKey ? apiKey.length : 0,
      key_start: apiKey ? apiKey.substring(0, 10) : 'NONE'
    });
  } catch (err) {
    return res.status(200).json({ error: err.message });
  }
}
