const db = require('../database');
const engine = require('./infrabot-engine.service');

const getFleetContext = async (userId) => {
  const [serversRes, racksRes, appsRes, incidentsRes] = await Promise.all([
    db.query(`SELECT count(*)::int AS total, count(*) FILTER (WHERE status IN ('critical','offline'))::int AS unhealthy FROM servers WHERE user_id = $1 AND archived_at IS NULL`, [userId]),
    db.query('SELECT count(*)::int AS total FROM racks WHERE user_id = $1 AND archived_at IS NULL', [userId]),
    db.query('SELECT count(*)::int AS total FROM applications WHERE user_id = $1 AND archived_at IS NULL', [userId]),
    db.query(`SELECT count(*)::int AS open FROM incidents WHERE user_id = $1 AND status != 'Resolved'`, [userId]),
  ]);
  return {
    servers: serversRes.rows[0].total,
    unhealthy_servers: serversRes.rows[0].unhealthy,
    racks: racksRes.rows[0].total,
    applications: appsRes.rows[0].total,
    open_incidents: incidentsRes.rows[0].open,
  };
};

const chat = async (userId, messages) => {
  const ctx = await getFleetContext(userId);
  return engine.answer(messages, ctx);
};

module.exports = { chat };
