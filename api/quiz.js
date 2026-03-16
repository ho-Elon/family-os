export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'No API key' });
  }

  const { subject } = req.body || {};
  if (!subject) {
    return res.status(400).json({ error: 'Missing subject' });
  }

  const topicMap = {
    'Chemistry': 'Introductory Chemistry, Structure and Bonding, Organic Chemistry, Quantitative and Analytical Chemistry',
    'Physics': 'Heat Transfers, Waves, Forces and Motion, Circuit Electricity',
    'Biology': 'Fundamental Biology, Digestive System, Plant Biology, Ecology and Environment',
    'Maths': 'IGCSE Higher Maths Units 1-8 (algebra, geometry, trigonometry, statistics, probability)',
    'English Language': 'Composition writing: descriptive, narrative, and discursive writing techniques',
    'English Literature': 'Of Mice and Men by John Steinbeck - characters, themes, quotes, context',
    'Economics': 'Basic economic problem, Allocation of resources, Money and banking, Households, Workers, Firms',
    'Business': 'Business objectives, Types of organisations, Classification, Location decisions, What makes a business successful, Business finance sources, Cash flow forecasting, Costs and break-even analysis, Financial documents, Accounts analysis, Market research',
    'Latin': 'Latin grammar and vocabulary - declensions, conjugations, translation skills',
    'PE': 'Muscular and skeletal systems, Respiratory and CV systems, Exercise effects, Levers planes and axis, Health fitness well-being, Fitness testing, Training methods, Components of fitness, Warm up cool down, Injuries, PEDs'
  };

  const topics = topicMap[subject] || subject;

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
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: `You are a friendly IGCSE tutor helping a 16-year-old student revise for her mid-course exams. Generate exactly 3 revision questions for ${subject}.

Topics to cover: ${topics}

Rules:
- Mix difficulty: 1 easy recall, 1 medium application, 1 harder analysis
- Keep questions concise (1-2 sentences each)
- Keep answers concise (1-3 sentences each)
- For Maths, include a specific calculation or problem
- Be encouraging in tone

Respond ONLY in this JSON format, no markdown, no backticks:
[{"q":"question text","a":"answer text"},{"q":"question text","a":"answer text"},{"q":"question text","a":"answer text"}]`
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Quiz API error:', response.status, errText);
      return res.status(502).json({ error: 'API error ' + response.status });
    }

    const data = await response.json();
    const text = data.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('');

    const clean = text.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(clean);

    return res.status(200).json({ questions: questions, subject: subject });
  } catch (err) {
    console.error('Quiz error:', err);
    return res.status(500).json({ error: err.message });
  }
}
