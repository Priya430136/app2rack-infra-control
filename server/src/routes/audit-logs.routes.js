const express = require('express');
const router = express.Router();
const auditLogsController = require('../controllers/audit-logs.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, auditLogsController.getAuditLogs);
router.post('/', protect, auditLogsController.createAuditLog);

module.exports = router;
