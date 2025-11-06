// /api/subscribe.js
// Proxy: meneruskan subscription dari browser ke API Dicoding (menghindari CORS)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const payload =
      typeof req.body === 'object' && req.body !== null
        ? req.body
        : JSON.parse(req.body || '{}');

    // Beberapa cohort memakai path berbeda — coba semua.
    const targets = [
      'https://story-api.dicoding.dev/v1/push-subscribe',
      'https://story-api.dicoding.dev/v1/push/subscribe',
    ];

    let lastStatus = 502;
    let lastText = 'No upstream';

    for (const url of targets) {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const text = await r.text();
        lastStatus = r.status;
        lastText = text;

        if (r.ok) {
          try {
            return res.status(r.status).json(JSON.parse(text));
          } catch {
            return res.status(r.status).send(text);
          }
        }
      } catch (e) {
        lastText = String(e);
      }
    }

    return res.status(lastStatus).json({ message: 'Upstream error', detail: lastText });
  } catch (e) {
    return res.status(400).json({ message: 'Bad payload', error: String(e) });
  }
}
