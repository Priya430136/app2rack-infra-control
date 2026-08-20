const reportsService = require('../services/reports.service');

const getReports = async (req, res, next) => {
  try {
    const reports = await reportsService.listReports(req.user.id);
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

const createReport = async (req, res, next) => {
  try {
    const report = await reportsService.createReport(req.user.id, req.body);
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
};

const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    await reportsService.deleteReport(req.user.id, id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReports,
  createReport,
  deleteReport
};
