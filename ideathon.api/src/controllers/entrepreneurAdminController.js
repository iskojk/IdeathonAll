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
