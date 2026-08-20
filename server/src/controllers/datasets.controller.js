const datasetsService = require('../services/datasets.service');

const getDatasets = async (req, res, next) => {
  try {
    const datasets = await datasetsService.listDatasets(req.user.id);
    res.json(datasets);
  } catch (err) {
    next(err);
  }
};

const createDataset = async (req, res, next) => {
  try {
    const { filename, kind, target_entity, mapping, rows } = req.body;
    const dataset = await datasetsService.importAndSave(req.user.id, { filename, kind, target_entity, mapping, rows });
    res.status(201).json(dataset);
  } catch (err) {
    next(err);
  }
};

const deleteDataset = async (req, res, next) => {
  try {
    const { id } = req.params;
    await datasetsService.deleteDataset(req.user.id, id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDatasets,
  createDataset,
  deleteDataset
};
