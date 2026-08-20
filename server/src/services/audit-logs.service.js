const db = require('../database');

const listAuditLogs = async (userId, filters) => {
  let queryText = `
    SELECT al.*, u.email as actor_email, p.display_name as actor_name
    FROM audit_logs al
    JOIN users u ON al.user_id = u.id
    LEFT JOIN profiles p ON p.id = u.id
    WHERE 1=1
  `;
  const params = [];

  // In a real scenario, we'd check if user is admin. For now, filter by userId
  queryText += ` AND al.user_id = $${params.length + 1}`;
  params.push(userId);

  if (filters.from) {
    queryText += ` AND al.created_at >= $${params.length + 1}`;
    params.push(filters.from);
  }
  if (filters.to) {
    queryText += ` AND al.created_at <= $${params.length + 1}`;
    params.push(filters.to);
  }

  queryText += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1}`;
  params.push(filters.limit || 200);

  const result = await db.query(queryText, params);
  return result.rows.map(r => ({
    ...r,
    actor_role: 'user' // Placeholder for role logic
  }));
};

const logAuditEvent = async (userId, data) => {
  const result = await db.query(
    'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [userId, data.action, data.entity_type || null, data.entity_id || null, data.metadata || {}]
  );
  return result.rows[0];
};

module.exports = {
  listAuditLogs,
  logAuditEvent
};
