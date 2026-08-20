const infraService = require('../services/infra.service');

// Racks
const getRacks = async (req, res, next) => {
  try {
    const racks = await infraService.listRacks(req.user.id);
    res.json(racks);
  } catch (err) {
    next(err);
  }
};

const upsertRack = async (req, res, next) => {
  try {
    const rack = await infraService.upsertRack(req.user.id, req.body);
    res.status(req.body.id ? 200 : 201).json(rack);
  } catch (err) {
    next(err);
  }
};

const deleteRack = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { archive } = req.query;
    await infraService.deleteRack(req.user.id, id, archive === 'true');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// Servers
const getServers = async (req, res, next) => {
  try {
    const servers = await infraService.listServers(req.user.id);
    res.json(servers);
  } catch (err) {
    next(err);
  }
};

const upsertServer = async (req, res, next) => {
  try {
    const server = await infraService.upsertServer(req.user.id, req.body);
    res.status(req.body.id ? 200 : 201).json(server);
  } catch (err) {
    next(err);
  }
};

const deleteServer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { archive } = req.query;
    await infraService.deleteServer(req.user.id, id, archive === 'true');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// Applications
const getApplications = async (req, res, next) => {
  try {
    const apps = await infraService.listApplications(req.user.id);
    res.json(apps);
  } catch (err) {
    next(err);
  }
};

const upsertApplication = async (req, res, next) => {
  try {
    const app = await infraService.upsertApplication(req.user.id, req.body);
    res.status(req.body.id ? 200 : 201).json(app);
  } catch (err) {
    next(err);
  }
};

const deleteApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { archive } = req.query;
    await infraService.deleteApplication(req.user.id, id, archive === 'true');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// Metrics
const getMetrics = async (req, res, next) => {
  try {
    const metrics = await infraService.listMetrics(req.user.id);
    res.json(metrics);
  } catch (err) {
    next(err);
  }
};

const seedDemoData = async (req, res, next) => {
  try {
    const result = await infraService.seedDemoData(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRacks, upsertRack, deleteRack,
  getServers, upsertServer, deleteServer,
  getApplications, upsertApplication, deleteApplication,
  getMetrics,
  seedDemoData
};
