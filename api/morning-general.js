export const config = {
  maxDuration: 30
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const today = new Date();
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
  const dateStr = today.toLocaleDateString('en-SG', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Singapore' });

  const prompt = `You are Morning General, a senior macro strategist delivering a daily pre-market briefing to a veteran hedge fund trader based in Singapore. Today is ${dayOfWeek}, ${dateStr}.

Deliver a concise, punchy morning briefing covering:

1. **OVERNIGHT SUMMARY** (2-3 sentences): What moved overnight in US/Europe. Key headlines.

2. **ASIA OPEN OUTLOOK** (2-3 sentences): What to expect for Asia session. Key levels.

3. **FX FOCUS** (the main section):
   - USD/MYR: current range, key levels, directional bias
   - USD/SGD: current range, key levels
   - DXY: trend, key support/resistance
   - USD/JPY, EUR/USD: notable moves
   - Any EM FX stress

4. **RATES & BONDS** (2-3 sentences): US Treasuries, Fed expectations, Asia rates.

5. **KEY EVENTS TODAY** (bullet list): Economic data releases, central bank speakers, auctions.

6. **TRADE IDEA** (1 paragraph): One actionable trade idea with entry, stop, target. Be specific.

Style: Direct, no fluff, like a Goldman morning note. Use technical levels. Assume the reader is an experienced macro trader who knows the jargon. Keep total length under 400 words.

IMPORTANT: Use your best knowledge of current market conditions. If uncertain about exact levels, provide reasonable estimates and note as approximate.`;

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
        max_tokens: 800,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return res.status(502).json({ error: 'AI API error ' + response.status, details: errText });
    }

    const data = await response.json();
    const briefing = data.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('');

    return res.status(200).json({
      briefing: briefing,
      date: dateStr,
      day: dayOfWeek,
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Morning General error:', err);
    return res.status(500).json({ error: 'Failed: ' + err.message });
  }
}
