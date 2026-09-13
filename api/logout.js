const { clearSessionCookie } = require('../lib/auth');

module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
};
