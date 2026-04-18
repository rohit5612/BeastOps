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

  const suffix = Date.now();
  const superadminEmail = `owner-${suffix}@test.local`;
  const superadminPassword = 'OwnerPass123!';
  const invitedEmail = `invite-${suffix}@test.local`;
  const invitedPassword = 'InvitePass123!';
  let tenantId = '';
  let workspaceId = '';
  let superadminCookie = '';

  // --- Register tenant ---
  let verifyToken = '';
  {
    const { res, json } = await req('POST', '/auth/register-tenant', {
      body: {
        companyName: `Acme ${suffix}`,
        email: superadminEmail,
        password: superadminPassword,
        name: 'Owner',
      },
    });
    tenantId = json?.tenantId || '';
    verifyToken = json?.debug?.verifyToken || '';
    ok(
      'POST /auth/register-tenant',
      res.status === 201 && !!tenantId && !!verifyToken,
      `(${res.status})`,
    );
  }

  {
    const { res, json } = await req('POST', '/auth/verify-email', {
      body: { token: verifyToken },
    });
    ok(
      'POST /auth/verify-email',
      res.status === 200 && json?.verified === true,
      `(${res.status})`,
    );
  }

  {
    const { res } = await req('POST', '/auth/login', {
      body: {
        tenantId,
        email: superadminEmail,
        password: superadminPassword,
      },
    });
    superadminCookie = cookieHeaderFromResponse(res);
    ok(
      'POST /auth/login superadmin',
      res.status === 200 && superadminCookie.includes('beastops_session='),
      `(${res.status})`,
    );
  }

  {
    const { res, json } = await req('GET', '/auth/me', { cookie: superadminCookie });
    workspaceId = json?.workspaces?.[0]?.id || '';
    ok('GET /auth/me superadmin', res.status === 200 && !!workspaceId, `(${res.status})`);
  }

  const wsHeaders = { 'X-Workspace-Id': workspaceId };

  // --- Invite flow ---
  let inviteToken = '';
  {
    const { res, json } = await req('POST', '/auth/invite', {
      cookie: superadminCookie,
      headers: wsHeaders,
      body: { email: invitedEmail, accessLevel: 'LEVEL5' },
    });
    inviteToken = json?.debug?.inviteToken || '';
    ok(
      'POST /auth/invite',
      res.status === 201 && !!inviteToken,
      `(${res.status})`,
    );
  }

  let invitedVerifyToken = '';
  {
    const { res, json } = await req('POST', '/auth/register-invite', {
      body: {
        token: inviteToken,
        name: 'Invited User',
        password: invitedPassword,
      },
    });
    invitedVerifyToken = json?.debug?.verifyToken || '';
    ok(
      'POST /auth/register-invite',
      res.status === 201 && !!invitedVerifyToken,
      `(${res.status})`,
    );
  }

  {
    const { res } = await req('POST', '/auth/verify-email', {
      body: { token: invitedVerifyToken },
    });
    ok('POST /auth/verify-email invited', res.status === 200, `(${res.status})`);
  }

  {
    const { res } = await req('POST', '/auth/login', {
      body: {
        tenantId,
        email: invitedEmail,
        password: invitedPassword,
      },
    });
    ok(
      'POST /auth/login invited before approval',
      res.status === 403,
      `(${res.status})`,
    );
  }

  let pendingMemberId = '';
  {
    const { res, json } = await req('GET', '/onboarding/pending', {
      cookie: superadminCookie,
      headers: wsHeaders,
    });
    pendingMemberId = json?.approvals?.[0]?.id || '';
    ok(
      'GET /onboarding/pending',
      res.status === 200 && !!pendingMemberId,
      `(${res.status})`,
    );
  }

  {
    const { res } = await req('POST', `/onboarding/${pendingMemberId}/approve`, {
      cookie: superadminCookie,
      headers: wsHeaders,
      body: { accessLevel: 'LEVEL5' },
    });
    ok('POST /onboarding/:id/approve', res.status === 200, `(${res.status})`);
  }

  let invitedCookie = '';
  {
    const { res } = await req('POST', '/auth/login', {
      body: {
        tenantId,
        email: invitedEmail,
        password: invitedPassword,
      },
    });
    invitedCookie = cookieHeaderFromResponse(res);
    ok(
      'POST /auth/login invited after approval',
      res.status === 200 && invitedCookie.includes('beastops_session='),
      `(${res.status})`,
    );
  }

  // --- Admin modules ---
  {
    const { res, json } = await req('GET', '/users', {
      cookie: superadminCookie,
      headers: wsHeaders,
    });
    ok('GET /users', res.status === 200 && Array.isArray(json?.users), `(${res.status})`);
  }

  let departmentId = '';
  {
    const { res, json } = await req('POST', '/departments', {
      cookie: superadminCookie,
      headers: wsHeaders,
      body: {
        name: 'Operations',
        moduleAccess: {
          user_management: true,
          content_ops: true,
          analytics: true,
          integrations: false,
        },
      },
    });
    departmentId = json?.department?.id || '';
    ok('POST /departments', res.status === 201 && !!departmentId, `(${res.status})`);
  }

  {
    const { res, json } = await req('GET', '/departments', {
      cookie: superadminCookie,
      headers: wsHeaders,
    });
    ok(
      'GET /departments',
      res.status === 200 &&
        Array.isArray(json?.departments) &&
        json.departments.some((d) => d.id === departmentId),
      `(${res.status})`,
    );
  }

  let roleId = '';
  {
    const { res, json } = await req('POST', '/roles', {
      cookie: superadminCookie,
      headers: wsHeaders,
      body: {
        name: 'QA Role',
        departmentId,
        permissions: [{ resource: 'tasks', action: 'read' }],
      },
    });
    roleId = json?.role?.id || '';
    ok('POST /roles', res.status === 201 && !!roleId, `(${res.status})`);
  }

  let invitedMemberId = '';
  {
    const { json } = await req('GET', '/users', {
      cookie: superadminCookie,
      headers: wsHeaders,
    });
    invitedMemberId =
      (json?.users || []).find((u) => u.email === invitedEmail)?.id || '';
  }

  {
    const { res } = await req('PATCH', `/users/${invitedMemberId}`, {
      cookie: superadminCookie,
      headers: wsHeaders,
      body: { departmentId, accessLevel: 'LEVEL5' },
    });
    ok('PATCH /users/:id set department', res.status === 200, `(${res.status})`);
  }

  {
    const { res } = await req('POST', `/roles/${roleId}/assign`, {
      cookie: superadminCookie,
      headers: wsHeaders,
      body: { tenantMemberId: invitedMemberId },
    });
    ok('POST /roles/:id/assign', res.status === 201, `(${res.status})`);
  }

  // --- Policy checks ---
  {
    const { res } = await req('POST', '/tasks', {
      cookie: invitedCookie,
      headers: wsHeaders,
      body: { title: 'Should be denied' },
    });
    ok('POST /tasks as LEVEL5 denied', res.status === 403, `(${res.status})`);
  }

  {
    const { res } = await req('GET', '/tasks', {
      cookie: invitedCookie,
      headers: wsHeaders,
    });
    ok('GET /tasks as LEVEL5 allowed', res.status === 200, `(${res.status})`);
  }

  // --- Logout and no-cookie ---
  {
    const { res } = await req('POST', '/auth/logout', { cookie: invitedCookie });
    ok('POST /auth/logout', res.status === 204, `(${res.status})`);
  }
  {
    const { res } = await req('GET', '/auth/me');
    ok('GET /auth/me with no cookie', res.status === 401, `(${res.status})`);
  }

  console.log(`\nDone: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
