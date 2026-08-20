const logAnalyzerService = require('../services/log-analyzer.service');

const getLogAnalyses = async (req, res, next) => {
  try {
    const analyses = await logAnalyzerService.listLogAnalyses(req.user.id);
    res.json(analyses);
  } catch (err) {
    next(err);
  }
};

const createLogAnalysis = async (req, res, next) => {
  try {
    const { logs, title, source, filename } = req.body;
    const analysis = await logAnalyzerService.analyzeAndSave(req.user.id, { logs, title, source, filename });
    res.status(201).json(analysis);
  } catch (err) {
    next(err);
  }
};

const deleteLogAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;
    await logAnalyzerService.deleteLogAnalysis(req.user.id, id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

const chat = async (req, res, next) => {
  try {
    const { question, logs, report, history } = req.body;
    const answer = await logAnalyzerService.answerChat({ question, logs, report, history });
    res.json({ answer });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLogAnalyses,
  createLogAnalysis,
  deleteLogAnalysis,
  chat
};
