const db = require('../database');

const listCalcHistory = async (userId, kind) => {
  const result = await db.query(
    'SELECT * FROM calculator_history WHERE user_id = $1 AND kind = $2 ORDER BY created_at DESC LIMIT 50',
    [userId, kind]
  );
  return result.rows;
};

const saveCalc = async (userId, data) => {
  const result = await db.query(
    `INSERT INTO calculator_history 
      (user_id, kind, label, inputs, outputs) 
    VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, data.kind, data.label || null, data.inputs, data.outputs]
  );
  return result.rows[0];
};

const deleteCalc = async (userId, id) => {
  await db.query('DELETE FROM calculator_history WHERE id = $1 AND user_id = $2', [id, userId]);
  return { ok: true };
};

module.exports = {
  listCalcHistory,
  saveCalc,
  deleteCalc
};
