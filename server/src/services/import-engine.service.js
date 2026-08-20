// Validates and imports uploaded rows (from the CSV/XLSX/JSON import page)
// into the real racks/servers/applications tables, based on the column
// mapping the user configured in the UI. Returns per-row success/error counts
// instead of the earlier placeholder that always claimed 100% success.
const db = require('../database');

const SERVER_STATUSES = new Set(['healthy', 'warning', 'critical', 'offline']);
const APP_ENVS = new Set(['Production', 'UAT', 'Dev']);
const APP_CRITICALITIES = new Set(['Critical', 'High', 'Medium', 'Low']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pick(row, mapping, field) {
  const header = mapping[field];
  if (!header) return undefined;
  const v = row[header];
  return v === '' || v === undefined ? undefined : v;
}

function toInt(v, fallback) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toFloat(v, fallback) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

async function importRows(userId, { target_entity, mapping, rows }) {
  let imported = 0;
  const errors = [];

  if (target_entity === 'racks') {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const name = pick(row, mapping, 'name');
        if (!name) throw new Error('Missing required field: name');
        const dc = pick(row, mapping, 'dc') || 'Unassigned';
        const capacity_u = toInt(pick(row, mapping, 'capacity_u'), 42);
        const temperature_c = toFloat(pick(row, mapping, 'temperature_c'), 22);
        await db.query(
          'INSERT INTO racks (user_id, name, dc, capacity_u, temperature_c) VALUES ($1, $2, $3, $4, $5)',
          [userId, String(name), String(dc), capacity_u, temperature_c]
        );
        imported++;
      } catch (err) {
        errors.push({ row: i + 1, error: err.message });
      }
    }
    return { imported, errors };
  }

  if (target_entity === 'servers') {
    const racksRes = await db.query('SELECT id, name FROM racks WHERE user_id = $1', [userId]);
    const rackByName = new Map(racksRes.rows.map((r) => [r.name.toLowerCase(), r.id]));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const name = pick(row, mapping, 'name');
        if (!name) throw new Error('Missing required field: name');
        const hostname = pick(row, mapping, 'hostname') || null;
        const ip = pick(row, mapping, 'ip') || null;
        const os = pick(row, mapping, 'os') || null;
        const cpu = Math.max(0, Math.min(100, toInt(pick(row, mapping, 'cpu_usage'), 0)));
        const ram = Math.max(0, Math.min(100, toInt(pick(row, mapping, 'memory_usage'), 0)));
        const storage = Math.max(0, Math.min(100, toInt(pick(row, mapping, 'storage_tb'), 0)));
        const rawStatus = pick(row, mapping, 'status');
        const status = SERVER_STATUSES.has(rawStatus) ? rawStatus : 'healthy';
        const rawRack = pick(row, mapping, 'rack_id');
        let rack_id = null;
        if (rawRack) {
          rack_id = UUID_RE.test(String(rawRack)) ? String(rawRack) : rackByName.get(String(rawRack).toLowerCase()) || null;
        }
        const slot = pick(row, mapping, 'slot') != null ? toInt(pick(row, mapping, 'slot'), null) : null;

        await db.query(
          `INSERT INTO servers (user_id, name, hostname, ip, os, cpu, ram, storage, status, rack_id, slot)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [userId, String(name), hostname, ip, os, cpu, ram, storage, status, rack_id, slot]
        );
        imported++;
      } catch (err) {
        errors.push({ row: i + 1, error: err.message });
      }
    }
    return { imported, errors };
  }

  if (target_entity === 'applications') {
    const serversRes = await db.query('SELECT id, name FROM servers WHERE user_id = $1', [userId]);
    const serverByName = new Map(serversRes.rows.map((s) => [s.name.toLowerCase(), s.id]));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const name = pick(row, mapping, 'name');
        if (!name) throw new Error('Missing required field: name');
        const owner = pick(row, mapping, 'owner') || null;
        const rawEnv = pick(row, mapping, 'env');
        const env = APP_ENVS.has(rawEnv) ? rawEnv : 'Production';
        const rawCrit = pick(row, mapping, 'criticality');
        const criticality = APP_CRITICALITIES.has(rawCrit) ? rawCrit : 'Medium';
        const deployment = pick(row, mapping, 'deployment') || null;
        const rawStatus = pick(row, mapping, 'status');
        const status = SERVER_STATUSES.has(rawStatus) ? rawStatus : 'healthy';
        const rawServer = pick(row, mapping, 'server_id');
        let server_id = null;
        if (rawServer) {
          server_id = UUID_RE.test(String(rawServer)) ? String(rawServer) : serverByName.get(String(rawServer).toLowerCase()) || null;
        }

        await db.query(
          `INSERT INTO applications (user_id, name, owner, env, criticality, deployment, server_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [userId, String(name), owner, env, criticality, deployment, server_id, status]
        );
        imported++;
      } catch (err) {
        errors.push({ row: i + 1, error: err.message });
      }
    }
    return { imported, errors };
  }

  throw new Error(`Unknown target_entity: ${target_entity}`);
}

module.exports = { importRows };
