const db = require('../database');

// ============ DEMO SEED ============
const DATA_CENTERS = ['DC-East-01', 'DC-West-02', 'DC-EU-Frankfurt'];
const OS_TYPES = ['Ubuntu 22.04', 'RHEL 9', 'Windows Server 2022', 'Debian 12', 'Rocky Linux 9'];
const STATUSES = ['healthy', 'healthy', 'healthy', 'warning', 'critical', 'offline'];
const TEAMS = ['Payments', 'Identity', 'Platform', 'Data', 'Web', 'Mobile', 'DevOps', 'Analytics'];
const DEPLOYMENTS = ['Kubernetes', 'Docker', 'Bare Metal', 'VM'];
const ENVS = ['Production', 'UAT', 'Dev'];
const CRITICALITIES = ['Critical', 'High', 'Medium', 'Low'];
const APP_NAMES = ['Atlas', 'Helios', 'Orion', 'Vega', 'Nimbus', 'Quasar', 'Pulsar', 'Nova', 'Lumen', 'Cipher', 'Echo', 'Forge'];
const APP_KINDS = ['API', 'Service', 'Gateway', 'Worker'];

const INCIDENT_TEMPLATES = [
  { title: 'High CPU on {server}', severity: 'Critical', status: 'Investigating', downtimeMin: 12, notes: 'CPU sustained >95% for 8 minutes. Investigating runaway query.', hoursAgo: 3 },
  { title: 'Rack temperature spike', severity: 'High', status: 'Open', downtimeMin: 0, notes: 'Temp elevated. HVAC team paged.', hoursAgo: 9 },
  { title: '5xx error rate elevated on {server}', severity: 'High', status: 'Resolved', downtimeMin: 7, notes: 'Rolled back to previous release.', hoursAgo: 20 },
  { title: 'RAM saturation on {server}', severity: 'Medium', status: 'Resolved', downtimeMin: 0, notes: 'Memory leak patched.', hoursAgo: 30 },
  { title: 'Disk usage warning on {server}', severity: 'Low', status: 'Resolved', downtimeMin: 0, notes: 'Old logs purged.', hoursAgo: 44 },
  { title: 'Network latency spike', severity: 'Critical', status: 'Resolved', downtimeMin: 34, notes: 'ISP routing fix applied.', hoursAgo: 55 },
  { title: 'Pod crashloop on {server}', severity: 'High', status: 'Investigating', downtimeMin: 18, notes: 'OOMKilled repeatedly. Increasing memory limits.', hoursAgo: 60 },
  { title: 'SSL certificate expiring soon', severity: 'Medium', status: 'Open', downtimeMin: 0, notes: 'Cert expires in 5 days. Renewal scheduled.', hoursAgo: 68 },
  { title: 'Replication lag on {server}', severity: 'High', status: 'Investigating', downtimeMin: 0, notes: 'Replica behind primary. Investigating long-running transaction.', hoursAgo: 75 },
  { title: 'Backup job failed for {server}', severity: 'Medium', status: 'Resolved', downtimeMin: 0, notes: 'Bucket permissions restored; backup re-ran successfully.', hoursAgo: 90 },
  { title: 'Traffic spike on {server}', severity: 'Critical', status: 'Resolved', downtimeMin: 22, notes: 'Abnormal request volume. WAF rule deployed.', hoursAgo: 96 },
  { title: 'Storage volume degraded', severity: 'High', status: 'Investigating', downtimeMin: 0, notes: 'RAID rebuild in progress after disk failure. Hot spare engaged.', hoursAgo: 100 },
  { title: 'Auth service 401 spike', severity: 'Critical', status: 'Resolved', downtimeMin: 15, notes: 'Expired signing key. Rotated JWT keys and forced session refresh.', hoursAgo: 115 },
  { title: 'Cache miss rate elevated on {server}', severity: 'Low', status: 'Open', downtimeMin: 0, notes: 'Eviction rate up 3x since deploy. Reviewing TTL configuration.', hoursAgo: 128 },
  { title: 'Power redundancy alert', severity: 'Medium', status: 'Resolved', downtimeMin: 0, notes: 'Failover triggered. Utility power restored within 4 minutes.', hoursAgo: 140 },
  { title: 'Cron job stuck on {server}', severity: 'Low', status: 'Resolved', downtimeMin: 0, notes: 'Nightly job hung on DB lock. Killed and rescheduled.', hoursAgo: 150 },
  { title: 'Firewall rule misconfiguration', severity: 'High', status: 'Resolved', downtimeMin: 9, notes: 'Blocked internal service-to-service traffic. Rule reverted.', hoursAgo: 160 },
];

const seedDemoData = async (userId) => {
  const existing = await db.query(
    'SELECT 1 FROM racks WHERE user_id = $1 UNION ALL SELECT 1 FROM servers WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  if (existing.rows.length > 0) {
    return { seeded: false, reason: 'You already have data' };
  }

  // Racks
  const rackRows = [];
  for (let i = 0; i < 6; i++) {
    const dc = DATA_CENTERS[i % DATA_CENTERS.length];
    const name = `Rack ${String.fromCharCode(65 + Math.floor(i / 2))}${(i % 2) + 1}`;
    const temperature = 21 + ((i * 7) % 9) + (i % 3) * 0.7;
    const result = await db.query(
      'INSERT INTO racks (user_id, name, dc, capacity_u, temperature_c) VALUES ($1, $2, $3, 42, $4) RETURNING id',
      [userId, name, dc, temperature.toFixed(1)]
    );
    rackRows.push(result.rows[0]);
  }

  // Servers
  const serverRows = [];
  for (let i = 0; i < 36; i++) {
    const rack = rackRows[i % rackRows.length];
    const name = `srv-node-${i + 1}`;
    const hostname = `node${i + 1}.app2rack.io`;
    const ip = `10.0.${Math.floor(i / 6) + 1}.${(i % 6) + 10}`;
    const os = OS_TYPES[i % OS_TYPES.length];
    const cpu = 20 + ((i * 7) % 75);
    const ram = 30 + ((i * 11) % 65);
    const storage = 25 + ((i * 13) % 70);
    const status = STATUSES[(i * 3) % STATUSES.length];
    const slot = (i % 14) + 1;
    const result = await db.query(
      `INSERT INTO servers (user_id, name, hostname, ip, os, cpu, ram, storage, status, rack_id, slot)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, cpu`,
      [userId, name, hostname, ip, os, cpu, ram, storage, status, rack.id, slot]
    );
    serverRows.push(result.rows[0]);
  }

  // Applications
  for (let i = 0; i < 24; i++) {
    const server = serverRows[i % serverRows.length];
    const name = `${APP_NAMES[i % APP_NAMES.length]} ${APP_KINDS[i % APP_KINDS.length]}`;
    const owner = TEAMS[i % TEAMS.length];
    const env = ENVS[i % 3];
    const criticality = CRITICALITIES[i % 4];
    const deployment = DEPLOYMENTS[i % 4];
    const status = STATUSES[(i * 5) % STATUSES.length];
    await db.query(
      `INSERT INTO applications (user_id, name, owner, env, criticality, deployment, server_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, name, owner, env, criticality, deployment, server.id, status]
    );
  }

  // Incidents - spread over the last ~7 days so the trend chart has real shape
  for (let i = 0; i < INCIDENT_TEMPLATES.length; i++) {
    const t = INCIDENT_TEMPLATES[i];
    const server = serverRows[i % serverRows.length];
    const title = t.title.replace('{server}', `srv-node-${(i % serverRows.length) + 1}`);
    await db.query(
      `INSERT INTO incidents (user_id, title, severity, status, server_id, downtime_min, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - ($8 || ' hours')::interval, NOW() - ($8 || ' hours')::interval)`,
      [userId, title, t.severity, t.status, server.id, t.downtimeMin, t.notes, t.hoursAgo]
    );
  }

  // Metrics - one fleet-averaged sample per hour for the last 24h, so the
  // utilization chart has real shape immediately after seeding.
  for (let h = 23; h >= 0; h--) {
    const cpu = 40 + Math.round(20 * Math.sin((23 - h) / 3) + ((23 - h) % 5) * 3);
    const ram = 50 + Math.round(15 * Math.cos((23 - h) / 4) + ((23 - h) % 4) * 2);
    const network = 30 + Math.round(25 * Math.sin((23 - h) / 2));
    await db.query(
      `INSERT INTO metrics (user_id, captured_at, cpu, ram, network)
       VALUES ($1, NOW() - ($2 || ' hours')::interval, $3, $4, $5)`,
      [userId, h, cpu, ram, network]
    );
  }

  return {
    seeded: true,
    counts: { racks: rackRows.length, servers: serverRows.length, applications: 24, incidents: INCIDENT_TEMPLATES.length },
  };
};

// ============ RACKS ============
const listRacks = async (userId) => {
  const result = await db.query(
    'SELECT * FROM racks WHERE user_id = $1 AND archived_at IS NULL ORDER BY name',
    [userId]
  );
  return result.rows;
};

const upsertRack = async (userId, data) => {
  if (data.id) {
    const result = await db.query(
      'UPDATE racks SET name = $1, dc = $2, capacity_u = $3, temperature_c = $4, updated_at = NOW() WHERE id = $5 AND user_id = $6 RETURNING *',
      [data.name, data.dc, data.capacity_u, data.temperature_c, data.id, userId]
    );
    return result.rows[0];
  }
  
  const result = await db.query(
    'INSERT INTO racks (user_id, name, dc, capacity_u, temperature_c) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [userId, data.name, data.dc, data.capacity_u, data.temperature_c]
  );
  return result.rows[0];
};

const deleteRack = async (userId, id, archive = false) => {
  if (archive) {
    await db.query(
      'UPDATE racks SET archived_at = NOW() WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  } else {
    await db.query(
      'DELETE FROM racks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  }
  return { ok: true };
};

// ============ SERVERS ============
const listServers = async (userId) => {
  const result = await db.query(
    'SELECT * FROM servers WHERE user_id = $1 AND archived_at IS NULL ORDER BY name',
    [userId]
  );
  return result.rows;
};

const upsertServer = async (userId, data) => {
  const payload = [
    data.name, data.hostname || null, data.ip || null, data.os || null,
    data.cpu, data.ram, data.storage, data.status, data.rack_id || null, data.slot || null
  ];

  if (data.id) {
    const result = await db.query(
      `UPDATE servers SET 
        name = $1, hostname = $2, ip = $3, os = $4, 
        cpu = $5, ram = $6, storage = $7, status = $8, 
        rack_id = $9, slot = $10, updated_at = NOW() 
      WHERE id = $11 AND user_id = $12 RETURNING *`,
      [...payload, data.id, userId]
    );
    return result.rows[0];
  }

  const result = await db.query(
    `INSERT INTO servers 
      (name, hostname, ip, os, cpu, ram, storage, status, rack_id, slot, user_id) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [...payload, userId]
  );
  return result.rows[0];
};

const deleteServer = async (userId, id, archive = false) => {
  if (archive) {
    await db.query(
      'UPDATE servers SET archived_at = NOW() WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  } else {
    await db.query(
      'DELETE FROM servers WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  }
  return { ok: true };
};

// ============ APPLICATIONS ============
const listApplications = async (userId) => {
  const result = await db.query(
    'SELECT * FROM applications WHERE user_id = $1 AND archived_at IS NULL ORDER BY name',
    [userId]
  );
  return result.rows;
};

const upsertApplication = async (userId, data) => {
  const payload = [
    data.name, data.owner || null, data.env, data.criticality,
    data.deployment || null, data.server_id || null, data.status
  ];

  if (data.id) {
    const result = await db.query(
      `UPDATE applications SET 
        name = $1, owner = $2, env = $3, criticality = $4, 
        deployment = $5, server_id = $6, status = $7, updated_at = NOW() 
      WHERE id = $8 AND user_id = $9 RETURNING *`,
      [...payload, data.id, userId]
    );
    return result.rows[0];
  }

  const result = await db.query(
    `INSERT INTO applications 
      (name, owner, env, criticality, deployment, server_id, status, user_id) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [...payload, userId]
  );
  return result.rows[0];
};

const deleteApplication = async (userId, id, archive = false) => {
  if (archive) {
    await db.query(
      'UPDATE applications SET archived_at = NOW() WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  } else {
    await db.query(
      'DELETE FROM applications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  }
  return { ok: true };
};

// ============ METRICS ============
const listMetrics = async (userId) => {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const result = await db.query(
    'SELECT * FROM metrics WHERE user_id = $1 AND captured_at >= $2 ORDER BY captured_at ASC',
    [userId, since]
  );
  return result.rows;
};

module.exports = {
  listRacks, upsertRack, deleteRack,
  listServers, upsertServer, deleteServer,
  listApplications, upsertApplication, deleteApplication,
  listMetrics,
  seedDemoData
};
