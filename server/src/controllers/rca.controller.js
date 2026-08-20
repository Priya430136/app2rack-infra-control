const rcaService = require('../services/rca.service');

const getAnalyses = async (req, res, next) => {
  try {
    const analyses = await rcaService.listRcaAnalyses(req.user.id, req.query);
    res.json(analyses);
  } catch (err) {
    next(err);
  }
};

const analyze = async (req, res, next) => {
  try {
    const { incidentId, serverId, title, severity, save } = req.body;
    const result = await rcaService.analyzeAndSave(req.user.id, { incidentId, serverId, title, severity, save });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const createAnalysis = async (req, res, next) => {
  try {
    const analysis = await rcaService.createRcaAnalysis(req.user.id, req.body);
    res.status(201).json(analysis);
  } catch (err) {
    next(err);
  }
};

const deleteAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;
    await rcaService.deleteRcaAnalysis(req.user.id, id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalyses,
  analyze,
  createAnalysis,
  deleteAnalysis
};
