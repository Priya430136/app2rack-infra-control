const db = require('../database');

const getIncidents = async (userId) => {
  const result = await db.query(
    'SELECT * FROM incidents WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

const createIncident = async (userId, data) => {
  const result = await db.query(
    `INSERT INTO incidents 
      (user_id, title, severity, status, server_id, downtime_min, notes) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, data.title, data.severity, 'Open', data.serverId, data.downtimeMin, data.notes || null]
  );
  return result.rows[0];
};

const updateIncidentStatus = async (userId, id, status) => {
  const result = await db.query(
    'UPDATE incidents SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
    [status, id, userId]
  );
  return result.rows[0];
};

module.exports = {
  getIncidents,
  createIncident,
  updateIncidentStatus,
};
