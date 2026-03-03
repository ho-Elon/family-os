// Vercel serverless function: Fetch and parse iCal feeds
// GET /api/ical?url=ENCODED_WEBCAL_URL

const https = require('https');
const http = require('http');

function fetchURL(url) {
  return new Promise(function (resolve, reject) {
    var mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'LengFamilyOS/1.0' } }, function (res) {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchURL(res.headers.location).then(resolve).catch(reject);
      }
      var chunks = [];
      res.on('data', function (c) { chunks.push(c); });
      res.on('end', function () {
        resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString() });
      });
    }).on('error', reject);
  });
}

module.exports = async function (req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  var url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Convert webcal:// to https://
  url = url.replace(/^webcal:\/\//, 'https://');

  try {
    var result = await fetchURL(url);

    if (result.status !== 200) {
      return res.status(502).json({ error: 'Failed to fetch calendar: ' + result.status });
    }

    var icsText = result.text;
    var events = parseICS(icsText);

    // Filter to events within -30 days to +90 days
    var now = new Date();
    var minDate = new Date(now);
    minDate.setDate(minDate.getDate() - 30);
    var maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + 90);

    var filtered = events.filter(function (ev) {
      var d = new Date(ev.start);
      return d >= minDate && d <= maxDate;
    });

    return res.status(200).json({ events: filtered });
  } catch (err) {
    console.error('iCal fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch calendar: ' + err.message });
  }
};

function parseICS(text) {
  var events = [];
  var lines = unfoldLines(text.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));
  var inEvent = false;
  var ev = {};

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      ev = {};
      continue;
    }

    if (line === 'END:VEVENT') {
      inEvent = false;
      if (ev.summary && ev.dtstart) {
        events.push({
          title: ev.summary,
          start: ev.dtstart,
          end: ev.dtend || ev.dtstart,
          location: ev.location || '',
          description: ev.description || '',
          allDay: ev.allDay || false,
          uid: ev.uid || ''
        });

        // Handle basic RRULE for recurring events
        if (ev.rrule) {
          var recurring = expandRRule(ev, 90);
          events = events.concat(recurring);
        }
      }
      continue;
    }

    if (!inEvent) continue;

    // Parse key:value, handling parameters like DTSTART;VALUE=DATE:20260301
    var colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    var keyPart = line.substring(0, colonIdx);
    var value = line.substring(colonIdx + 1);
    var key = keyPart.split(';')[0].toUpperCase();

    switch (key) {
      case 'SUMMARY':
        ev.summary = unescapeICS(value);
        break;
      case 'DTSTART':
        ev.dtstart = parseICSDate(value, keyPart);
        ev.allDay = keyPart.indexOf('VALUE=DATE') > -1 && value.length === 8;
        break;
      case 'DTEND':
        ev.dtend = parseICSDate(value, keyPart);
        break;
      case 'LOCATION':
        ev.location = unescapeICS(value);
        break;
      case 'DESCRIPTION':
        ev.description = unescapeICS(value).substring(0, 200);
        break;
      case 'UID':
        ev.uid = value;
        break;
      case 'RRULE':
        ev.rrule = value;
        break;
    }
  }

  return events;
}

function unfoldLines(text) {
  // iCal spec: lines beginning with space or tab are continuations
  return text.replace(/\n[ \t]/g, '').split('\n');
}

function parseICSDate(value, keyPart) {
  // Format: 20260301 (date only) or 20260301T150000 or 20260301T150000Z
  value = value.trim();
  if (value.length === 8) {
    // Date only: YYYYMMDD
    return value.substring(0, 4) + '-' + value.substring(4, 6) + '-' + value.substring(6, 8);
  }
  // DateTime: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  var y = value.substring(0, 4);
  var m = value.substring(4, 6);
  var d = value.substring(6, 8);
  var hh = value.substring(9, 11) || '00';
  var mm = value.substring(11, 13) || '00';

  // Check for TZID
  var hasTZID = keyPart && keyPart.indexOf('TZID') > -1;
  var isUTC = value.endsWith('Z');

  // Return ISO string
  if (isUTC) {
    return y + '-' + m + '-' + d + 'T' + hh + ':' + mm + ':00Z';
  }
  // Assume local time (Singapore UTC+8)
  return y + '-' + m + '-' + d + 'T' + hh + ':' + mm + ':00+08:00';
}

function unescapeICS(str) {
  return str.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\\\/g, '\\').replace(/\\;/g, ';');
}

function expandRRule(ev, daysAhead) {
  // Very basic RRULE support: FREQ=WEEKLY/MONTHLY/YEARLY with COUNT or UNTIL
  var extras = [];
  var rule = {};
  ev.rrule.split(';').forEach(function (part) {
    var kv = part.split('=');
    rule[kv[0]] = kv[1];
  });

  if (!rule.FREQ) return extras;

  var start = new Date(ev.dtstart);
  if (isNaN(start.getTime())) return extras;

  var maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + daysAhead);

  var count = rule.COUNT ? parseInt(rule.COUNT) : 52;
  var until = rule.UNTIL ? new Date(parseICSDate(rule.UNTIL, '')) : maxDate;

  var interval = rule.INTERVAL ? parseInt(rule.INTERVAL) : 1;
  var freq = rule.FREQ;

  for (var i = 1; i < count && i < 200; i++) {
    var next = new Date(start);
    switch (freq) {
      case 'DAILY':
        next.setDate(next.getDate() + interval * i);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7 * interval * i);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + interval * i);
        break;
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + interval * i);
        break;
      default:
        return extras;
    }

    if (next > maxDate || next > until) break;

    var dur = 0;
    if (ev.dtend) {
      dur = new Date(ev.dtend).getTime() - new Date(ev.dtstart).getTime();
    }
    var endDate = new Date(next.getTime() + dur);

    extras.push({
      title: ev.summary,
      start: next.toISOString(),
      end: endDate.toISOString(),
      location: ev.location || '',
      description: ev.description || '',
      allDay: ev.allDay || false,
      uid: (ev.uid || '') + '_r' + i
    });
  }

  return extras;
}
