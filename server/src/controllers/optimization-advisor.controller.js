const optimizationService = require('../services/optimization-advisor.service');

const getAnalyses = async (req, res, next) => {
  try {
    const analyses = await optimizationService.listOptimizationAnalyses(req.user.id);
    res.json(analyses);
  } catch (err) {
    next(err);
  }
};

const createAnalysis = async (req, res, next) => {
  try {
    const { title } = req.body;
    const analysis = await optimizationService.analyzeAndSave(req.user.id, { title });
    res.status(201).json(analysis);
  } catch (err) {
    next(err);
  }
};

const deleteAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;
    await optimizationService.deleteOptimizationAnalysis(req.user.id, id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

const chat = async (req, res, next) => {
  try {
    const { question, report, history } = req.body;
    const answer = await optimizationService.answerChat({ question, report, history });
    res.json({ answer });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalyses,
  createAnalysis,
  deleteAnalysis,
  chat
};
