// Vercel Serverless Function — проксирует заявку в Telegram
// Env vars: TG_BOT_TOKEN, TG_CHAT_ID (задать в Vercel Dashboard)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const BOT_TOKEN = process.env.TG_BOT_TOKEN;
  const CHAT_ID = process.env.TG_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: 'Missing server configuration' });
  }

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text' });

    const tgRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text }),
      }
    );

    if (!tgRes.ok) {
      const err = await tgRes.text();
      throw new Error(err);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Telegram send error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
