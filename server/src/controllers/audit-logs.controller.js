const auditLogsService = require('../services/audit-logs.service');

const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await auditLogsService.listAuditLogs(req.user.id, req.query);
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

const createAuditLog = async (req, res, next) => {
  try {
    const log = await auditLogsService.logAuditEvent(req.user.id, req.body);
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAuditLogs,
  createAuditLog
};
