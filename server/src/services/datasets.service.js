const db = require('../database');
const importEngine = require('./import-engine.service');

const importAndSave = async (userId, { filename, kind, target_entity, mapping, rows }) => {
  const { imported, errors } = await importEngine.importRows(userId, { target_entity, mapping, rows });

  return createDataset(userId, {
    filename,
    kind,
    target_entity,
    row_count: rows.length,
    imported_count: imported,
    error_count: errors.length,
    status: errors.length === 0 ? 'imported' : imported > 0 ? 'imported' : 'failed',
    mapping,
    preview: rows.slice(0, 10),
    errors: errors.length ? errors.slice(0, 50) : null,
  });
};

const listDatasets = async (userId) => {
  const result = await db.query(
    'SELECT * FROM uploaded_datasets WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

const createDataset = async (userId, data) => {
  // node-postgres only auto-serializes plain objects for jsonb columns - a
  // bare JS array is instead formatted as a Postgres array literal and fails
  // with "invalid input syntax for type json". preview/errors are arrays, so
  // they must be stringified explicitly.
  const result = await db.query(
    `INSERT INTO uploaded_datasets
      (user_id, filename, kind, target_entity, row_count, imported_count, error_count, status, mapping, preview, errors)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      userId, data.filename, data.kind, data.target_entity, data.row_count,
      data.imported_count, data.error_count, data.status, data.mapping,
      data.preview ? JSON.stringify(data.preview) : null,
      data.errors ? JSON.stringify(data.errors) : null,
    ]
  );
  return result.rows[0];
};

const deleteDataset = async (userId, id) => {
  await db.query('DELETE FROM uploaded_datasets WHERE id = $1 AND user_id = $2', [id, userId]);
  return { ok: true };
};

module.exports = {
  listDatasets,
  createDataset,
  deleteDataset,
  importAndSave
};
