const { getSession } = require('../lib/auth');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }
  const session = getSession(req);
  if (!session) return res.status(401).json({ ok: false, authenticated: false });
  return res.status(200).json({ ok: true, authenticated: true, username: session.u });
};
