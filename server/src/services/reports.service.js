const db = require('../database');

const listReports = async (userId) => {
  const result = await db.query(
    'SELECT * FROM reports WHERE user_id = $1 ORDER BY generated_at DESC LIMIT 100',
    [userId]
  );
  return result.rows;
};

const createReport = async (userId, data) => {
  const result = await db.query(
    `INSERT INTO reports 
      (user_id, name, type, params, summary) 
    VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, data.name, data.type, data.params || {}, data.summary || {}]
  );
  return result.rows[0];
};

const deleteReport = async (userId, id) => {
  await db.query('DELETE FROM reports WHERE id = $1 AND user_id = $2', [id, userId]);
  return { ok: true };
};

module.exports = {
  listReports,
  createReport,
  deleteReport
};
