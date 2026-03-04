export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'No API key' });
  }

  try {
    const today = new Date().toLocaleDateString('en-SG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      timeZone: 'Asia/Singapore'
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: `Today is ${today}. You are Morning General, a macro strategist giving a daily briefing to a hedge fund trader in Singapore focused on FX (especially USD/MYR, USD/SGD, DXY). Give a concise morning briefing covering: overnight summary, Asia outlook, FX levels, rates, key events today, and one trade idea. Keep it under 400 words. Be direct like a Goldman morning note. Use approximate levels if unsure.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('API err:', response.status, errText);
      return res.status(502).json({ error: 'API error ' + response.status });
    }

    const data = await response.json();
    const briefing = data.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('');

    return res.status(200).json({ briefing: briefing });
  } catch (err) {
    console.error('MG error:', err);
    return res.status(500).json({ error: err.message });
  }
}
