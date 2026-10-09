import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter } from 'k6/metrics';

// Mutating tests must target the separately restored local release QA database.
const origin = __ENV.RELEASE_QA_API_ORIGIN;
if (origin !== 'http://127.0.0.1:5210' || !/^ideathon_release_qa_[a-f0-9]{12}$/.test(__ENV.RELEASE_QA_DB || '')) throw new Error('An isolated local release QA target is required');
if (!__ENV.RELEASE_QA_FIXTURE) throw new Error('Private per-user QA fixture required');
const fixture = new SharedArray('isolated users', () => JSON.parse(open(__ENV.RELEASE_QA_FIXTURE)).users);
const profiles = {
  smoke: { vus: 5, duration: '15s' },
  ramp: { stages: [{ duration: '30s', target: 10 }, { duration: '45s', target: 25 }, { duration: '45s', target: 50 }, { duration: '15s', target: 0 }] },
  stress: { stages: [{ duration: '30s', target: 50 }, { duration: '60s', target: 100 }, { duration: '30s', target: 100 }, { duration: '15s', target: 0 }] },
  spike: { stages: [{ duration: '15s', target: 5 }, { duration: '5s', target: 100 }, { duration: '25s', target: 100 }, { duration: '5s', target: 5 }, { duration: '20s', target: 5 }] },
  soak: { vus: 25, duration: '10m' },
};
const profile = profiles[__ENV.RELEASE_QA_PROFILE || 'smoke'];
if (!profile || fixture.length < 100) throw new Error('Unknown profile or insufficient independent QA users');
export const options = {
  ...profile, discardResponseBodies: true,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{kind:json}': ['p(95)<1000'],
    'http_req_duration{kind:pdf}': ['p(95)<3000'],
    checks: ['rate>0.99'],
    invariant_failures: ['count==0'],
  },
};
const invariantFailures = new Counter('invariant_failures');
function request(method, path, token, body, kind = 'json') {
  const response = http.request(method, origin + path, body === undefined ? null : JSON.stringify(body), {
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    responseType: kind === 'pdf' ? 'none' : 'text', tags: { kind, name: path.replace(/[a-f0-9]{24}/g, ':id') }, timeout: '15s',
  });
  if (!check(response, { 'HTTP 200': r => r.status === 200 })) return null;
  if (kind === 'pdf') return response;
  try { return response.json().data; } catch (_) { invariantFailures.add(1); return null; }
}
export default function () {
  invariantFailures.add(0);
  const user = fixture[__VU - 1];
  let state = request('GET', '/api/entrepreneurs/my', user.token);
  if (!state) { sleep(1); return; }
  const phase = (__ITER + __VU) % 10;
  if (phase === 0 || !state.application) {
    let application = state.application;
    if (application?.status === 'submitted' && !application.isResubmission) {
      application = request('POST', '/api/entrepreneurs/my/edit', user.token, { revision: application.revision })?.application;
      if (!application) { sleep(1); return; }
    }
    const body = { answers: user.answers, formVersion: state.form.version, ...(application ? { revision: application.revision } : {}) };
    application = request('PUT', '/api/entrepreneurs/my', user.token, body)?.application;
    if (application) {
      const submitted = request('PUT', '/api/entrepreneurs/my', user.token, { ...body, revision: application.revision, submit: true })?.application;
      if (submitted && (submitted.status !== 'submitted' || submitted.applicationNumber !== user.applicationNumber)) invariantFailures.add(1);
    }
  } else if (phase === 1) request('GET', '/api/entrepreneurs/my/export?format=pdf', user.token, undefined, 'pdf');
  else request('GET', '/api/auth/me', user.token);
  sleep(1);
}
