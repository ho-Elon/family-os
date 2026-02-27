export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured in Vercel env vars' });
  }

  try {
    const { family, members } = req.body || {};
    const familyName = family || 'Leng';
    const memberList = Array.isArray(members) ? members.join(', ') : 'the family';

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
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
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: `Today is ${today}. Generate an inspiring quote for the ${familyName} family (members: ${memberList}), based in Singapore.

The quote should be great for teenagers and the whole family — about family, love, perseverance, growth, or togetherness.

Respond ONLY in this exact JSON format, no markdown, no backticks, just raw JSON:
{"quote": "the quote text", "author": "Author Name or empty string if original", "meaning": "2 sentence explanation of why this quote matters for a family"}`
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return res.status(502).json({ error: 'Claude API error', details: response.status });
    }

    const data = await response.json();
    const text = data.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('');

    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json({
      quote: parsed.quote || 'Family is not an important thing. It is everything.',
      author: parsed.author || 'Michael J. Fox',
      meaning: parsed.meaning || 'Family is the foundation of everything we do.'
    });
  } catch (err) {
    console.error('Quote generation error:', err);
    return res.status(200).json({
      quote: 'The love of a family is life\'s greatest blessing.',
      author: 'Eva Burrows',
      meaning: 'No matter what happens in the world, family love is the foundation that keeps us strong.'
    });
  }
}
