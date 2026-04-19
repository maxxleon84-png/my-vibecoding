export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(500).json({ error: 'Server not configured' });

  const { name, phone, service, msg } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Missing name' });

  const clean = (s) => String(s || '—').slice(0, 500).replace(/[<>]/g, '');
  const text = [
    '🔔 Новая заявка с лендинга',
    '',
    '👤 Имя: ' + clean(name),
    '📞 Контакт: ' + clean(phone),
    '💼 Услуга: ' + clean(service),
    '💬 Сообщение: ' + clean(msg)
  ].join('\n');

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
    if (!r.ok) return res.status(502).json({ error: 'Telegram error' });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: 'Network error' });
  }
}
