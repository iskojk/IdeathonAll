import assert from 'node:assert/strict';

// Real local auth mail now uses Microsoft 365. Auth fixtures must target a
// separate QA API/database; authMail.js forbids external SMTP in that database.
export function requireAuthSandbox(target) {
  assert.equal(target.apiOrigin, 'http://127.0.0.1:5210', 'Auth verification requires the isolated QA API; the normal local API sends real mail.');
  assert.match(target.mongoURI, /\/ideathon_release_qa_[a-f0-9]{12}$/);
}

export function mailpitCodes() {
  const messages = new Set();
  const base = 'http://127.0.0.1:8025';
  return {
    async read(email) {
      for (let attempt = 0; attempt < 10; attempt++) {
        const response = await fetch(`${base}/api/v1/messages?limit=200`, { signal: AbortSignal.timeout(5000) });
        assert.equal(response.status, 200);
        const message = (await response.json()).messages.find(item => !messages.has(item.ID) && item.To?.some(to => to.Address === email));
        if (message) {
          messages.add(message.ID);
          const detailResponse = await fetch(`${base}/api/v1/message/${encodeURIComponent(message.ID)}`, { signal: AbortSignal.timeout(5000) });
          assert.equal(detailResponse.status, 200);
          const detail = await detailResponse.json();
          const code = (detail.Text || detail.HTML.replace(/<[^>]+>/g, ' ')).match(/\b\d{6}\b/)?.[0];
          assert.ok(code, 'Mailpit message must contain a six-digit code.');
          return code;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      throw new Error('Verification email did not reach Mailpit.');
    },
    async cleanup() {
      if (!messages.size) return;
      const response = await fetch(`${base}/api/v1/messages`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IDs: [...messages] }), signal: AbortSignal.timeout(5000) });
      assert.ok(response.ok, 'Only fixture messages should be cleaned up.');
    }
  };
}
