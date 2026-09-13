const { setSessionCookie } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const expectedUser = process.env.APP_USERNAME;
  const expectedPassword = process.env.APP_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (!expectedUser || !expectedPassword || !secret) {
    return res.status(503).json({ ok: false, error: 'SERVER_NOT_CONFIGURED' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const username = String(body.username || '');
  const password = String(body.password || '');

  const userOk = username === expectedUser;
  const passOk = password === expectedPassword;

  if (!userOk || !passOk) {
    return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
  }

  setSessionCookie(res, username);
  return res.status(200).json({ ok: true });
};
