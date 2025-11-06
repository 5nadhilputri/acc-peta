// /api/unsubscribe.js
// Proxy: meneruskan unsubscribe (endpoint) ke Dicoding API + CORS preflight

const ALLOW_ORIGIN = '*'; // saat dev bisa '*', produksi bisa ganti ke domainmu

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  setCORS(res);

  // Preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  try {
    const payload =
      typeof req.body === 'object' && req.body !== null
        ? req.body
        : JSON.parse(req.body || '{}');

    const targets = [
      'https://story-api.dicoding.dev/v1/push-unsubscribe',
      'https://story-api.dicoding.dev/v1/push/unsubscribe',
    ];

    let lastStatus = 502;
    let lastText = 'No upstream response';

    for (const url of targets) {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), // { endpoint }
        });
        const text = await r.text();
        lastStatus = r.status;
        lastText = text;

        if (r.ok) {
          res.status(r.status);
          setCORS(res);
          res.setHeader('Content-Type', r.headers.get('content-type') || 'text/plain');
          try { res.send(JSON.parse(text)); } catch { res.send(text); }
          return;
        }
      } catch (e) {
        lastText = String(e);
      }
    }

    res.status(lastStatus);
    setCORS(res);
    res.json({ message: 'Upstream error', detail: lastText });
  } catch (e) {
    res.status(400);
    setCORS(res);
    res.json({ message: 'Bad payload', error: String(e) });
  }
};
