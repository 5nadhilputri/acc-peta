// api/subscribe.js
const ALLOW_ORIGIN = '*';

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
  setCORS(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  try {
    const payload = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
    const endpoints = [
      'https://story-api.dicoding.dev/v1/push/subscribe',
      'https://story-api.dicoding.dev/v1/push-subscribe',
    ];

    for (const url of endpoints) {
      try {
        const f = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const text = await f.text();
        if (f.ok) {
          setCORS(res);
          try {
            res.status(f.status).json(JSON.parse(text));
          } catch {
            res.status(f.status).send(text);
          }
          return;
        }
      } catch (e) {
        console.warn('[api] Failed proxy to', url, e);
      }
    }

    res.status(502).json({ message: 'Upstream failed to respond' });
  } catch (err) {
    res.status(400).json({ message: 'Bad payload', error: String(err) });
  }
}
