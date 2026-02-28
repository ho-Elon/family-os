export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { family_size, notes } = req.body || {};

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [
          {
            role: 'user',
            content: `Suggest a week of meals (lunch and dinner, Mon-Sun) for a Singapore family of ${family_size || 7}. ${notes || ''}

Keep it practical — mix of easy weekday meals and nicer weekend ones. Include local Singapore dishes and some Western options.

Format as a simple readable list:
Mon Lunch: [dish]
Mon Dinner: [dish]
Tue Lunch: [dish]
...etc.

Add a short shopping list at the end with key ingredients to buy.`
          }
        ]
      })
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Claude API error' });
    }

    const data = await response.json();
    const text = data.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('');

    return res.status(200).json({ suggestions: text });
  } catch (err) {
    console.error('Meals AI error:', err);
    return res.status(500).json({ error: 'Failed to generate suggestions' });
  }
}
