const config = require('../data/cameras.json');
const { requireSession } = require('../lib/auth');

function normalizeBaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  if (!requireSession(req, res)) return;

  const location = String(req.query.location || 'tikrit');
  const warehouse = Number(req.query.warehouse || 1);
  const site = config[location];

  if (!site || !Number.isInteger(warehouse) || warehouse < 1 || warehouse > site.warehouses) {
    return res.status(400).json({ ok: false, error: 'INVALID_LOCATION_OR_WAREHOUSE' });
  }

  const baseUrl = normalizeBaseUrl(process.env.CAMERA_SERVER_BASE_URL);
  const linked = site.linked[String(warehouse)] || {};
  const cameras = [];

  for (let i = 1; i <= site.camerasPerWarehouse; i++) {
    const item = linked[String(i) || i] || linked[i] || null;
    const enabled = Boolean(item && item.enabled);
    const configured = Boolean(enabled && baseUrl && item.path);
    cameras.push({
      id: i,
      name: item?.name || `كاميرا ${i}`,
      linked: enabled,
      online: configured,
      streamUrl: configured ? `${baseUrl}/${encodeURIComponent(item.path)}/` : null,
      path: item?.path || null
    });
  }

  return res.status(200).json({
    ok: true,
    location,
    warehouse,
    cameraServerConfigured: Boolean(baseUrl),
    cameras
  });
};
