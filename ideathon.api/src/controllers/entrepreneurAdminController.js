const service = require('../services/entrepreneurAdminService');

exports.list = async (req, res) => {
  const result = await service.list(req.query);
  res.json({ success: true, ...result });
};

exports.detail = async (req, res) => {
  res.json({ success: true, data: await service.detail(req.params.id) });
};

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
