const db = require('../database');
const ai = require('./ai-provider.service');
const engine = require('./log-analyzer-engine.service');

const analyzeAndSave = async (userId, { logs, title, source, filename }) => {
  const incidentsResult = await db.query(
    'SELECT id, title, severity, status FROM incidents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [userId]
  );

  let report;
  let model;
  let sourceType;
  if (ai.isConfigured()) {
    try {
      report = await engine.runAiAnalysis(logs, { title });
      model = ai.getModelName();
      sourceType = 'ai';
    } catch (err) {
      console.error('AI log analysis failed, falling back to rule-based engine:', err.message);
    }
  }
  if (!report) {
    report = engine.runFallbackAnalysis(logs, { title, existingIncidents: incidentsResult.rows });
    model = 'rule-based-fallback';
    sourceType = 'fallback';
  }

  const lineCount = logs.split(/\r?\n/).length;
  const saved = await createLogAnalysis(userId, {
    title: title || filename || 'Log analysis',
    source: source || 'paste',
    filename: filename || null,
    log_size: logs.length,
    line_count: lineCount,
    severity: report.severity,
    confidence: report.confidence,
    risk_level: report.risk_level,
    model,
    source_type: sourceType,
    summary: report.executive_summary?.slice(0, 800) ?? '',
    report,
  });

  return { ...saved, model, source_type: sourceType };
};

const answerChat = (payload) => engine.answerChat(payload);

const listLogAnalyses = async (userId) => {
  const result = await db.query(
    'SELECT * FROM log_analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [userId]
  );
  return result.rows;
};

const createLogAnalysis = async (userId, data) => {
  const result = await db.query(
    `INSERT INTO log_analyses 
      (user_id, title, source, filename, log_size, line_count, severity, confidence, risk_level, model, source_type, summary, report) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
    [
      userId, data.title, data.source, data.filename, data.log_size, data.line_count, 
      data.severity, data.confidence, data.risk_level, data.model, data.source_type, 
      data.summary, data.report
    ]
  );
  return result.rows[0];
};

const deleteLogAnalysis = async (userId, id) => {
  await db.query('DELETE FROM log_analyses WHERE id = $1 AND user_id = $2', [id, userId]);
  return { ok: true };
};

module.exports = {
  listLogAnalyses,
  createLogAnalysis,
  deleteLogAnalysis,
  analyzeAndSave,
  answerChat
};
