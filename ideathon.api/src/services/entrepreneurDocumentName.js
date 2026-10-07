const path = require('node:path');
const { TextDecoder } = require('node:util');

function normalizeDocumentName(originalName) {
  let name = originalName;
  // Multer/Busboy interprets ordinary multipart filename bytes as Latin-1.
  // Decode only lossless UTF-8; keep genuine Latin-1 and already decoded names.
  if ([...name].every(character => character.codePointAt(0) <= 255)) {
    try { name = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.from(name, 'latin1')); }
    catch { /* This name is not UTF-8 encoded as Latin-1. */ }
  }
  name = path.posix.basename(name.replace(/\\/g, '/')).normalize('NFC').replace(/[\x00-\x1f\x7f-\x9f]/g, '');
  return [...name].slice(0, 180).join('') || 'evrak';
}

module.exports = { normalizeDocumentName };
