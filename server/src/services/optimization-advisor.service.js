const db = require('../database');
const ai = require('./ai-provider.service');
const engine = require('./optimization-engine.service');

const analyzeAndSave = async (userId, { title } = {}) => {
  const [racksRes, serversRes, appsRes, incidentsRes] = await Promise.all([
    db.query('SELECT * FROM racks WHERE user_id = $1 AND archived_at IS NULL ORDER BY name', [userId]),
    db.query('SELECT * FROM servers WHERE user_id = $1 AND archived_at IS NULL ORDER BY name', [userId]),
    db.query('SELECT * FROM applications WHERE user_id = $1 AND archived_at IS NULL ORDER BY name', [userId]),
    db.query('SELECT * FROM incidents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]),
  ]);
  const ctx = { racks: racksRes.rows, servers: serversRes.rows, applications: appsRes.rows, incidents: incidentsRes.rows };

  let report;
  let model;
  let sourceType;
  if (ai.isConfigured()) {
    try {
      report = await engine.runAiAnalysis(ctx);
      if (!report?.scores || !report?.cost_savings || !Number.isFinite(Number(report.cost_savings.monthly_estimate))) {
        throw new Error('AI optimization response did not match the required report shape');
      }
      model = ai.getModelName();
      sourceType = 'ai';
    } catch (err) {
      console.error('AI optimization analysis failed, falling back to rule-based engine:', err.message);
    }
  }
  if (!report) {
    report = engine.runFallbackAnalysis(ctx);
    model = 'rule-based-fallback';
    sourceType = 'fallback';
  }

  const s = report.scores;
  const saved = await createOptimizationAnalysis(userId, {
    title: title || `Analysis ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    optimization_score: s.optimization, health_score: s.health, cost_efficiency: s.cost_efficiency,
    performance_score: s.performance, reliability_score: s.reliability, security_score: s.security,
    scalability_score: s.scalability, power_efficiency: s.power_efficiency, cooling_efficiency: s.cooling_efficiency,
    estimated_savings_monthly: report.cost_savings.monthly_estimate,
    summary: report.executive_summary?.slice(0, 800) ?? '',
    model, source_type: sourceType, report,
  });

  return { ...saved, model, source_type: sourceType };
};

const answerChat = (payload) => engine.answerChat(payload);

const listOptimizationAnalyses = async (userId) => {
  const result = await db.query(
    'SELECT * FROM optimization_analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [userId]
  );
  return result.rows;
};

const createOptimizationAnalysis = async (userId, data) => {
  const result = await db.query(
    `INSERT INTO optimization_analyses 
      (user_id, title, optimization_score, health_score, cost_efficiency, performance_score, reliability_score, security_score, scalability_score, power_efficiency, cooling_efficiency, estimated_savings_monthly, summary, model, source_type, report) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
    [
      userId, data.title, data.optimization_score, data.health_score, data.cost_efficiency,
      data.performance_score, data.reliability_score, data.security_score, data.scalability_score,
      data.power_efficiency, data.cooling_efficiency, data.estimated_savings_monthly,
      data.summary, data.model, data.source_type, data.report
    ]
  );
  return result.rows[0];
};

const deleteOptimizationAnalysis = async (userId, id) => {
  await db.query('DELETE FROM optimization_analyses WHERE id = $1 AND user_id = $2', [id, userId]);
  return { ok: true };
};

module.exports = {
  listOptimizationAnalyses,
  createOptimizationAnalysis,
  deleteOptimizationAnalysis,
  analyzeAndSave,
  answerChat
};
