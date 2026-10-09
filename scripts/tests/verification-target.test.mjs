import test from 'node:test';
import assert from 'node:assert/strict';
import { verificationTarget } from '../verification-target.mjs';

test('verification retains the local target by default and pairs the isolated DB/API', () => {
  assert.equal(verificationTarget(undefined, {}).apiOrigin, 'http://127.0.0.1:5010');
  assert.deepEqual(verificationTarget(undefined, { RELEASE_QA_DB: 'ideathon_release_qa_abcdef012345', RELEASE_QA_API_ORIGIN: 'http://127.0.0.1:5210' }), {
    mongoURI: 'mongodb://127.0.0.1:27027/ideathon_release_qa_abcdef012345', apiOrigin: 'http://127.0.0.1:5210',
  });
});
test('verification refuses production databases, remote hosts and incomplete isolation', () => {
  assert.throws(() => verificationTarget('mongodb://127.0.0.1:27027/production', {}));
  for (const options of [
    { RELEASE_QA_DB: 'ideathon_local', RELEASE_QA_API_ORIGIN: 'http://127.0.0.1:5210' },
    { RELEASE_QA_DB: 'ideathon_release_qa_abcdef012345', RELEASE_QA_API_ORIGIN: 'https://example.com' },
    { RELEASE_QA_DB: 'ideathon_release_qa_abcdef012345', RELEASE_QA_API_ORIGIN: 'http://127.0.0.1:5010' },
    { RELEASE_QA_DB: 'ideathon_release_qa_abcdef012345' },
    { RELEASE_QA_API_ORIGIN: 'http://127.0.0.1:5210' },
  ]) assert.throws(() => verificationTarget(undefined, options));
});
