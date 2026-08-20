const db = require('../database');
const ai = require('./ai-provider.service');
const engine = require('./rca-engine.service');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const gatherContext = async (userId, { incidentId, serverId }) => {
  let incident = null;
  if (incidentId) {
    const r = await db.query('SELECT * FROM incidents WHERE id = $1 AND user_id = $2', [incidentId, userId]);
    incident = r.rows[0] || null;
  }

  const resolvedServerId = serverId || (incident && UUID_RE.test(incident.server_id) ? incident.server_id : null);

  let server = null;
  if (resolvedServerId) {
    const r = await db.query('SELECT * FROM servers WHERE id = $1 AND user_id = $2', [resolvedServerId, userId]);
    server = r.rows[0] || null;
  }

  let rack = null;
  if (server?.rack_id) {
    const r = await db.query('SELECT * FROM racks WHERE id = $1 AND user_id = $2', [server.rack_id, userId]);
    rack = r.rows[0] || null;
  }

  let linkedApplications = [];
  if (server) {
    const r = await db.query('SELECT id, name, env, criticality, status FROM applications WHERE server_id = $1 AND user_id = $2', [server.id, userId]);
    linkedApplications = r.rows;
  }

  let recentMetrics = [];
  if (server) {
    const r = await db.query(
      'SELECT cpu, ram, network, storage, captured_at FROM metrics WHERE server_id = $1 AND user_id = $2 ORDER BY captured_at DESC LIMIT 24',
      [server.id, userId]
    );
    recentMetrics = r.rows;
  }

  let similarIncidents = [];
  if (incident) {
    const r = await db.query(
      'SELECT id, title, severity, status FROM incidents WHERE user_id = $1 AND severity = $2 AND id != $3 ORDER BY created_at DESC LIMIT 5',
      [userId, incident.severity, incident.id]
    );
    similarIncidents = r.rows;
  }

  const fleetRes = await db.query(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE status = 'critical')::int AS critical,
            count(*) FILTER (WHERE status = 'offline')::int AS offline
     FROM servers WHERE user_id = $1 AND archived_at IS NULL`,
    [userId]
  );

  return {
    incident,
    server,
    rack,
    linked_applications: linkedApplications,
    recent_metrics: recentMetrics,
    similar_incidents: similarIncidents,
    fleet_summary: {
      total_servers: fleetRes.rows[0].total,
      critical_count: fleetRes.rows[0].critical,
      offline_count: fleetRes.rows[0].offline,
    },
  };
};

const analyzeAndSave = async (userId, { incidentId, serverId, title, severity, save = true }) => {
  const ctx = await gatherContext(userId, { incidentId, serverId });
  // The incident's own severity (if we have one) is more authoritative than the caller-supplied hint.
  if (ctx.incident) ctx.incident.severity = ctx.incident.severity || severity;
  else if (severity) ctx.incident = { severity };

  let report;
  let model;
  let source;
  if (ai.isConfigured()) {
    try {
      report = await engine.runAiAnalysis(ctx);
      model = ai.getModelName();
      source = 'ai';
    } catch (err) {
      console.error('AI RCA analysis failed, falling back to rule-based engine:', err.message);
    }
  }
  if (!report) {
    report = engine.runFallbackAnalysis(ctx);
    model = 'rule-based-fallback';
    source = 'fallback';
  }

  let savedId = null;
  if (save) {
    const saved = await createRcaAnalysis(userId, {
      incident_id: incidentId || null,
      server_id: ctx.server?.id || null,
      title: title || ctx.incident?.title || 'RCA Analysis',
      severity: ctx.incident?.severity || severity || null,
      confidence: report.confidence,
      risk_level: report.risk_level,
      model,
      source,
      report,
      context_snapshot: ctx,
    });
    savedId = saved.id;
  }

  return { report, context: ctx, model, source, savedId };
};

const listRcaAnalyses = async (userId, filters) => {
  let queryText = 'SELECT * FROM rca_analyses WHERE user_id = $1';
  const params = [userId];

  if (filters.incidentId) {
    queryText += ` AND incident_id = $${params.length + 1}`;
    params.push(filters.incidentId);
  }

  queryText += ' ORDER BY created_at DESC LIMIT 50';

  const result = await db.query(queryText, params);
  return result.rows;
};

const createRcaAnalysis = async (userId, data) => {
  const result = await db.query(
    `INSERT INTO rca_analyses 
      (user_id, incident_id, server_id, title, severity, confidence, risk_level, model, source, report, context_snapshot) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      userId, data.incident_id, data.server_id, data.title, data.severity,
      data.confidence, data.risk_level, data.model, data.source,
      data.report, data.context_snapshot
    ]
  );
  return result.rows[0];
};

const deleteRcaAnalysis = async (userId, id) => {
  await db.query('DELETE FROM rca_analyses WHERE id = $1 AND user_id = $2', [id, userId]);
  return { ok: true };
};

module.exports = {
  listRcaAnalyses,
  createRcaAnalysis,
  deleteRcaAnalysis,
  analyzeAndSave
};
