const service = require('../services/entrepreneurAdminService');

exports.list = async (req, res) => {
  const result = await service.list(req.query);
  res.json({ success: true, ...result });
};

exports.detail = async (req, res) => {
  res.json({ success: true, data: await service.detail(req.params.id) });
};
exports.markViewed = async (req, res) => res.json({ success: true, data: await service.markViewed(req.params.id, req.body, req.user._id) });
exports.review = async (req, res) => res.json({ success: true, data: await service.review(req.params.id, req.body, req.user._id) });

exports.entryForm = async (req, res) => res.json({ success: true, data: await service.entryForm() });
exports.importFormats = async (req, res) => res.json({ success: true, data: require('../services/entrepreneurImport').capabilities() });
exports.importTemplate = async (req, res) => {
  const file = await require('../services/entrepreneurImportExcel').template(await service.entryForm());
  res.type(file.mimeType).attachment(file.name).send(file.contents);
};
exports.importPreview = async (req, res) => {
  const data = await require('../services/entrepreneurImport').preview(req.file, await service.entryForm());
  res.status(data.status === 'awaiting_format' ? 202 : 200).json({ success: true, data });
};
exports.accounts = async (req, res) => res.json({ success: true, data: await service.accounts(req.query) });
exports.create = async (req, res) => res.status(201).json({ success: true, data: await service.create(req.body, req.user._id) });
exports.update = async (req, res) => res.json({ success: true, data: await service.update(req.params.id, req.body, req.user._id) });
exports.archive = async (req, res) => res.json({ success: true, data: await service.setArchived(req.params.id, req.body, req.user._id, true) });
exports.restore = async (req, res) => res.json({ success: true, data: await service.setArchived(req.params.id, req.body, req.user._id, false) });

exports.document = async (req, res) => {
  const document = await service.document(req.params.id, req.params.documentId);
  res.type(document.mimeType).attachment(document.name).send(document.contents);
};

exports.export = async (req, res) => {
  const format = req.query.format;
  if (format !== 'pdf') return res.status(400).json({ success: false, message: 'Yalnızca PDF biçiminde dışa aktarılabilir.' });
  const application = await service.detail(req.params.id);
  const file = await require('../services/entrepreneurExport').generate(application, format);
  res.type(file.mimeType).attachment(file.name).send(file.contents);
};
