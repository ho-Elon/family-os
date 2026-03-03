// Vercel serverless function: Morning General - Daily FX/Macro Briefing
// POST /api/morning-general

const https = require('https');

function postJSON(url, headers, body) {
  return new Promise(function (resolve, reject) {
    var parsed = new URL(url);
    var options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers)
    };
    var req = https.request(options, function (res) {
      var chunks = [];
      res.on('data', function (c) { chunks.push(c); });
      res.on('end', function () {
        var text = Buffer.concat(chunks).toString();
        resolve({ status: res.statusCode, text: text });
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing API key' });
  }

  var today = new Date();
  var dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
  var dateStr = today.toLocaleDateString('en-SG', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Singapore' });

  var prompt = 'You are Morning General, a senior macro strategist delivering a daily pre-market briefing to a veteran hedge fund trader based in Singapore. Today is ' + dayOfWeek + ', ' + dateStr + '.\n\nDeliver a concise, punchy morning briefing covering:\n\n1. **OVERNIGHT SUMMARY** (2-3 sentences): What moved overnight in US/Europe. Key headlines.\n\n2. **ASIA OPEN OUTLOOK** (2-3 sentences): What to expect for Asia session. Key levels.\n\n3. **FX FOCUS** (the main section):\n   - USD/MYR: current range, key levels, directional bias\n   - USD/SGD: current range, key levels\n   - DXY: trend, key support/resistance\n   - USD/JPY, EUR/USD: notable moves\n   - Any EM FX stress\n\n4. **RATES & BONDS** (2-3 sentences): US Treasuries, Fed expectations, Asia rates.\n\n5. **KEY EVENTS TODAY** (bullet list): Economic data releases, central bank speakers, auctions.\n\n6. **TRADE IDEA** (1 paragraph): One actionable trade idea with entry, stop, target. Be specific.\n\nStyle: Direct, no fluff, like a Goldman morning note. Use technical levels. Assume the reader is an experienced macro trader who knows the jargon. Keep total length under 500 words.\n\nIMPORTANT: Use your best knowledge of current market conditions. If you are uncertain about exact current levels, provide reasonable estimates based on recent trends and clearly note them as approximate.';

  try {
    var result = await postJSON('https://api.anthropic.com/v1/messages', {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }, {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    });

    if (result.status !== 200) {
      console.error('Anthropic API error:', result.status, result.text);
      return res.status(502).json({ error: 'AI API error: ' + result.status });
    }

    var data = JSON.parse(result.text);
    var briefing = '';
    if (data.content && data.content.length > 0) {
      briefing = data.content[0].text;
    }

    return res.status(200).json({
      briefing: briefing,
      date: dateStr,
      day: dayOfWeek,
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Morning General error:', err);
    return res.status(500).json({ error: 'Failed to generate briefing: ' + err.message });
  }
};
