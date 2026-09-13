const { neon } = require('@neondatabase/serverless');
const { requireSession } = require('../lib/auth');

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS sensor_readings (
      location VARCHAR(50) NOT NULL,
      warehouse_id INTEGER NOT NULL,
      sensor_id INTEGER NOT NULL,
      temperature DOUBLE PRECISION,
      humidity DOUBLE PRECISION,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (location, warehouse_id, sensor_id)
    )
  `;
}

function cleanLocation(value) {
  return String(value || '').trim().toLowerCase();
}

function validId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const sql = getDb();
  if (!sql) {
    return res.status(500).json({ ok: false, error: 'DATABASE_URL_NOT_CONFIGURED' });
  }

  try {
    await ensureTable(sql);

    if (req.method === 'POST') {
      const apiKey = String(req.headers['x-api-key'] || '');
      const expectedKey = String(process.env.SENSOR_API_KEY || '');

      if (!expectedKey || apiKey !== expectedKey) {
        return res.status(401).json({ ok: false, error: 'INVALID_API_KEY' });
      }

      const body = req.body || {};
      const location = cleanLocation(body.location);
      const warehouse = validId(body.warehouse);
      const sensor = validId(body.sensor);
      const temperature = body.temperature === null || body.temperature === undefined
        ? null : Number(body.temperature);
      const humidity = body.humidity === null || body.humidity === undefined
        ? null : Number(body.humidity);

      if (!location || !warehouse || !sensor) {
        return res.status(400).json({ ok: false, error: 'INVALID_SENSOR_IDENTITY' });
      }
      if (temperature !== null && !Number.isFinite(temperature)) {
        return res.status(400).json({ ok: false, error: 'INVALID_TEMPERATURE' });
      }
      if (humidity !== null && !Number.isFinite(humidity)) {
        return res.status(400).json({ ok: false, error: 'INVALID_HUMIDITY' });
      }
      if (temperature === null && humidity === null) {
        return res.status(400).json({ ok: false, error: 'NO_READING_PROVIDED' });
      }

      const rows = await sql`
        INSERT INTO sensor_readings
          (location, warehouse_id, sensor_id, temperature, humidity, updated_at)
        VALUES
          (${location}, ${warehouse}, ${sensor}, ${temperature}, ${humidity}, NOW())
        ON CONFLICT (location, warehouse_id, sensor_id)
        DO UPDATE SET
          temperature = EXCLUDED.temperature,
          humidity = EXCLUDED.humidity,
          updated_at = NOW()
        RETURNING location, warehouse_id, sensor_id, temperature, humidity, updated_at
      `;

      return res.status(200).json({ ok: true, reading: rows[0] });
    }

    if (req.method === 'GET') {
      if (!requireSession(req, res)) return;

      const location = cleanLocation(req.query.location || 'tikrit');
      const warehouse = validId(req.query.warehouse || 1);
      const sensor = validId(req.query.sensor || 1);

      if (!location || !warehouse || !sensor) {
        return res.status(400).json({ ok: false, error: 'INVALID_QUERY' });
      }

      const rows = await sql`
        SELECT location, warehouse_id, sensor_id, temperature, humidity, updated_at
        FROM sensor_readings
        WHERE location = ${location}
          AND warehouse_id = ${warehouse}
          AND sensor_id = ${sensor}
        LIMIT 1
      `;

      if (!rows.length) {
        return res.status(404).json({ ok: false, error: 'NO_READING' });
      }

      const reading = rows[0];
      const ageMs = Date.now() - new Date(reading.updated_at).getTime();

      return res.status(200).json({
        ok: true,
        reading: {
          location: reading.location,
          warehouse: reading.warehouse_id,
          sensor: reading.sensor_id,
          temperature: reading.temperature,
          humidity: reading.humidity,
          updatedAt: reading.updated_at,
          online: ageMs < 15000
        }
      });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  } catch (error) {
    console.error('sensor api error:', error);
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
};
