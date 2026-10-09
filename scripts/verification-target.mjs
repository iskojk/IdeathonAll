import assert from 'node:assert/strict';

// Optional isolated target for release verification. Production databases and
// arbitrary remote hosts are deliberately not accepted by these test scripts.
export function verificationTarget(localURI = 'mongodb://127.0.0.1:27027/ideathon_local', options = process.env) {
  assert.equal(localURI, 'mongodb://127.0.0.1:27027/ideathon_local', 'Verification requires the known local configuration.');
  const name = options.RELEASE_QA_DB;
  const origin = options.RELEASE_QA_API_ORIGIN;
  if (!name && !origin) return { mongoURI: localURI, apiOrigin: 'http://127.0.0.1:5010' };
  assert.match(name || '', /^ideathon_release_qa_[a-f0-9]{12}$/, 'An isolated release database name is required.');
  assert.equal(origin, 'http://127.0.0.1:5210', 'Release verification must target the isolated loopback API.');
  return { mongoURI: `mongodb://127.0.0.1:27027/${name}`, apiOrigin: origin };
}
