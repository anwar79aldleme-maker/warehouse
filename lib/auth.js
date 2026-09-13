const crypto = require('crypto');

const COOKIE_NAME = 'warehouse_session';
const SESSION_SECONDS = 60 * 60 * 12;

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function createToken(username, secret) {
  const payload = b64url(JSON.stringify({
    u: username,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS
  }));
  return `${payload}.${sign(payload, secret)}`;
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return Object.fromEntries(raw.split(';').map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf('=');
    return i === -1 ? [v, ''] : [v.slice(0, i), decodeURIComponent(v.slice(i + 1))];
  }));
}

function verifyToken(token, secret) {
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = sign(payload, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

function getSession(req) {
  const secret = process.env.AUTH_SECRET;
  const cookies = parseCookies(req);
  return verifyToken(cookies[COOKIE_NAME], secret);
}

function setSessionCookie(res, username) {
  const secret = process.env.AUTH_SECRET;
  const token = createToken(username, secret);
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

function requireSession(req, res) {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    return null;
  }
  return session;
}

module.exports = {
  getSession,
  setSessionCookie,
  clearSessionCookie,
  requireSession
};
