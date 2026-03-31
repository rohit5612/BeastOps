/**
 * Smoke-test BeastOps API endpoints.
 * Run with the server already up: `npm run test:api`
 *
 * Env (optional, from apps/api/.env when run via npm):
 *   API_BASE_URL — default http://127.0.0.1:$PORT
 *   PORT — used only if API_BASE_URL unset
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__dirname, '..');
dotenv.config({ path: join(apiRoot, '.env') });

const PORT = process.env.PORT || '5000';
const BASE =
  process.env.API_BASE_URL?.replace(/\/$/, '') ||
  `http://127.0.0.1:${PORT}`;
const API = `${BASE}/api`;
const SUPERUSER_EMAIL =
  process.env.SUPERUSER_EMAIL?.trim().toLowerCase() ||
  'superuser@beastops.local';

let passed = 0;
let failed = 0;

function cookieHeaderFromResponse(res) {
  if (typeof res.headers.getSetCookie === 'function') {
    const list = res.headers.getSetCookie();
    if (list.length) {
      return list.map((line) => line.split(';')[0].trim()).join('; ');
    }
  }
  const raw = res.headers.get('set-cookie');
  if (!raw) return '';
  return raw
    .split(/,(?=\s*[\w.-]+=)/)
    .map((p) => p.trim().split(';')[0])
    .join('; ');
}

async function req(method, path, { headers = {}, body, cookie } = {}) {
  const h = new Headers(headers);
  if (body !== undefined) {
    h.set('Content-Type', 'application/json');
  }
  if (cookie) {
    h.set('Cookie', cookie);
  }
  const res = await fetch(`${API}${path}`, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  return { res, json, text };
}

function ok(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  OK  ${name}${detail ? ` ${detail}` : ''}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${name}${detail ? ` ${detail}` : ''}`);
  }
}

async function main() {
  console.log(`API smoke test → ${API}\n`);

  // --- Public health ---
  {
    const { res, json } = await req('GET', '/health');
    ok('GET /health', res.status === 200 && json?.status === 'ok', `(${res.status})`);
  }
  {
    const { res, json } = await req('GET', '/health/db');
    const good = res.status === 200 && json?.database === 'connected';
    const softFail = res.status === 503;
    ok(
      'GET /health/db',
      good || softFail,
      good ? '(db up)' : softFail ? '(503 db down — check Postgres)' : `(${res.status})`,
    );
  }

  // --- Auth (development) ---
  let cookie = '';
  {
    const { res, json } = await req('POST', '/auth/dev-login', {
      body: { email: 'verify-api@test.local', name: 'Verify API' },
    });
    cookie = cookieHeaderFromResponse(res);
    ok(
      'POST /auth/dev-login',
      res.status === 200 && json?.user?.id && cookie.includes('beastops_session='),
      `(${res.status})`,
    );
  }

  let workspaceId = '';
  {
    const { res, json } = await req('GET', '/auth/me', { cookie });
    ok(
      'GET /auth/me',
      res.status === 200 && json?.user?.email === 'verify-api@test.local',
      `(${res.status})`,
    );
  }

  {
    const { res, json } = await req('PATCH', '/auth/me', {
      cookie,
      body: { name: 'Verify API Renamed' },
    });
    ok(
      'PATCH /auth/me (normal user)',
      res.status === 200 && json?.user?.name === 'Verify API Renamed',
      `(${res.status})`,
    );
  }

  {
    const { res, json } = await req('GET', '/workspaces', { cookie });
    ok('GET /workspaces', res.status === 200 && Array.isArray(json?.workspaces), `(${res.status})`);
  }

  {
    const { res, json } = await req('POST', '/workspaces', {
      cookie,
      body: { name: `Verify Workspace ${Date.now()}` },
    });
    workspaceId = json?.workspace?.id || '';
    ok(
      'POST /workspaces',
      res.status === 201 && workspaceId,
      `(${res.status})`,
    );
  }

  const wsHeaders = { 'X-Workspace-Id': workspaceId };
  let firstStageId = '';
  let videoId = '';

  {
    const { res, json } = await req('GET', '/pipeline/stages', {
      cookie,
      headers: wsHeaders,
    });
    firstStageId = json?.stages?.[0]?.id || '';
    ok(
      'GET /pipeline/stages',
      res.status === 200 && json?.stages?.length >= 7,
      `(${res.status}, ${json?.stages?.length ?? 0} stages)`,
    );
  }

  {
    const { res, json } = await req('GET', '/videos', { cookie, headers: wsHeaders });
    ok(
      'GET /videos',
      res.status === 200 && Array.isArray(json?.videoProjects),
      `(${res.status})`,
    );
  }

  {
    const { res, json } = await req('POST', '/videos', {
      cookie,
      headers: wsHeaders,
      body: { title: 'Verify API Video' },
    });
    videoId = json?.videoProject?.id || '';
    ok('POST /videos', res.status === 201 && videoId, `(${res.status})`);
  }

  const secondStageId =
    (await req('GET', '/pipeline/stages', { cookie, headers: wsHeaders })).json
      ?.stages?.[1]?.id || '';

  {
    const { res, json } = await req('PATCH', `/videos/${videoId}/stage`, {
      cookie,
      headers: wsHeaders,
      body: { stageId: secondStageId || firstStageId },
    });
    ok(
      'PATCH /videos/:id/stage',
      res.status === 200 && json?.videoProject?.stage?.id,
      `(${res.status})`,
    );
  }

  let ideaId = '';
  {
    const { res, json } = await req('GET', '/ideas', { cookie, headers: wsHeaders });
    ok('GET /ideas', res.status === 200 && Array.isArray(json?.ideas), `(${res.status})`);
  }

  {
    const { res, json } = await req('POST', '/ideas', {
      cookie,
      headers: wsHeaders,
      body: { title: 'Verify idea', tags: ['smoke'] },
    });
    ideaId = json?.idea?.id || '';
    ok('POST /ideas', res.status === 201 && !!ideaId, `(${res.status})`);
  }

  {
    const { res, json } = await req('GET', `/ideas/${ideaId}`, {
      cookie,
      headers: wsHeaders,
    });
    ok('GET /ideas/:id', res.status === 200 && json?.idea?.id === ideaId, `(${res.status})`);
  }

  {
    const { res, json } = await req('PATCH', `/ideas/${ideaId}`, {
      cookie,
      headers: wsHeaders,
      body: { expectedPerformance: 'High', tags: ['updated'] },
    });
    ok(
      'PATCH /ideas/:id',
      res.status === 200 && json?.idea?.expectedPerformance === 'High',
      `(${res.status})`,
    );
  }

  {
    const { res, json } = await req('POST', `/ideas/${ideaId}/convert`, {
      cookie,
      headers: wsHeaders,
    });
    ok(
      'POST /ideas/:id/convert',
      res.status === 201 && !!json?.videoProject?.id,
      `(${res.status})`,
    );
  }

  {
    const { res } = await req('DELETE', `/ideas/${ideaId}`, {
      cookie,
      headers: wsHeaders,
    });
    ok('DELETE /ideas/:id (converted idea)', res.status === 400, `(${res.status})`);
  }

  let deletableIdeaId = '';
  {
    const { res, json } = await req('POST', '/ideas', {
      cookie,
      headers: wsHeaders,
      body: { title: 'Delete-me idea' },
    });
    deletableIdeaId = json?.idea?.id || '';
    ok('POST /ideas (for delete)', res.status === 201 && !!deletableIdeaId, `(${res.status})`);
  }

  {
    const { res } = await req('DELETE', `/ideas/${deletableIdeaId}`, {
      cookie,
      headers: wsHeaders,
    });
    ok('DELETE /ideas/:id', res.status === 204, `(${res.status})`);
  }

  let suCookie = '';
  {
    const { res, json } = await req('POST', '/auth/dev-login', {
      body: { email: SUPERUSER_EMAIL, name: 'Should not apply' },
    });
    suCookie = cookieHeaderFromResponse(res);
    ok(
      'POST /auth/dev-login (primary superuser)',
      res.status === 200 &&
        json?.user?.systemAccount === 'SUPERUSER' &&
        json?.user?.elevatedAccess === true,
      `(${res.status})`,
    );
  }

  {
    const { res, json } = await req('GET', '/pipeline/stages', {
      cookie: suCookie,
      headers: wsHeaders,
    });
    ok(
      'GET /pipeline/stages as superuser (no workspace membership)',
      res.status === 200 && json?.stages?.length >= 7,
      `(${res.status})`,
    );
  }

  {
    const { res } = await req('PATCH', '/auth/me', {
      cookie: suCookie,
      body: { name: 'Hacker' },
    });
    ok(
      'PATCH /auth/me as superuser (protected)',
      res.status === 403,
      `(${res.status})`,
    );
  }

  let taskId = '';
  {
    const { res, json } = await req('POST', '/tasks', {
      cookie,
      headers: wsHeaders,
      body: { title: 'Verify task', videoProjectId: videoId, priority: 'high' },
    });
    taskId = json?.task?.id || '';
    ok('POST /tasks', res.status === 201 && !!taskId, `(${res.status})`);
  }

  {
    const { res, json } = await req('GET', '/tasks', {
      cookie,
      headers: wsHeaders,
    });
    ok(
      'GET /tasks',
      res.status === 200 && Array.isArray(json?.tasks),
      `(${res.status})`,
    );
  }

  {
    const { res } = await req('PATCH', `/tasks/${taskId}`, {
      cookie,
      headers: wsHeaders,
      body: { status: 'IN_PROGRESS' },
    });
    ok('PATCH /tasks/:id', res.status === 200, `(${res.status})`);
  }

  let commentId = '';
  {
    const { res, json } = await req('POST', '/comments', {
      cookie,
      headers: wsHeaders,
      body: { taskId, body: 'Verify comment' },
    });
    commentId = json?.comment?.id || '';
    ok('POST /comments', res.status === 201 && !!commentId, `(${res.status})`);
  }

  {
    const { res, json } = await req('GET', '/comments', {
      cookie,
      headers: wsHeaders,
    });
    ok(
      'GET /comments',
      res.status === 200 && Array.isArray(json?.comments),
      `(${res.status})`,
    );
  }

  {
    const { res } = await req('PATCH', `/comments/${commentId}`, {
      cookie,
      headers: wsHeaders,
      body: { body: 'Verify comment updated' },
    });
    ok('PATCH /comments/:id', res.status === 200, `(${res.status})`);
  }

  {
    const { res, json } = await req('GET', `/videos/${videoId}/audit`, {
      cookie,
      headers: wsHeaders,
    });
    ok(
      'GET /videos/:id/audit',
      res.status === 200 && Array.isArray(json?.events),
      `(${res.status})`,
    );
  }

  {
    const { res } = await req('DELETE', `/comments/${commentId}`, {
      cookie,
      headers: wsHeaders,
    });
    ok('DELETE /comments/:id', res.status === 204, `(${res.status})`);
  }

  {
    const { res } = await req('DELETE', `/tasks/${taskId}`, {
      cookie,
      headers: wsHeaders,
    });
    ok('DELETE /tasks/:id', res.status === 204, `(${res.status})`);
  }

  {
    const { res, json } = await req('GET', '/analytics/channel-overview', {
      cookie,
      headers: wsHeaders,
    });
    ok(
      'GET /analytics/channel-overview',
      res.status === 200 && !!json?.overview,
      `(${res.status})`,
    );
  }

  {
    const { res, json } = await req('GET', '/analytics/videos', {
      cookie,
      headers: wsHeaders,
    });
    ok(
      'GET /analytics/videos',
      res.status === 200 && Array.isArray(json?.videos),
      `(${res.status})`,
    );
  }

  // --- Workspace scope without header ---
  {
    const { res } = await req('GET', '/pipeline/stages', { cookie });
    ok('GET /pipeline/stages without X-Workspace-Id', res.status === 400, `(${res.status})`);
  }

  // --- Logout ---
  {
    const { res } = await req('POST', '/auth/logout', { cookie });
    ok('POST /auth/logout', res.status === 204, `(${res.status})`);
  }

  {
    const { res } = await req('GET', '/auth/me');
    ok('GET /auth/me with no Cookie header', res.status === 401, `(${res.status})`);
  }

  {
    const { res } = await req('GET', '/auth/me', { cookie });
    ok(
      'GET /auth/me with same JWT cookie after logout',
      res.status === 200,
      `(${res.status}) stateless JWT still valid until expiry; browser would drop cookie`,
    );
  }

  // --- 404 ---
  {
    const { res } = await req('GET', '/nope');
    ok('GET unknown route (404)', res.status === 404, `(${res.status})`);
  }

  console.log(`\nDone: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
