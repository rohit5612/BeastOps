const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const WORKSPACE_STORAGE_KEY = 'beastops_workspace_id';

export function getWorkspaceId() {
  return window.localStorage.getItem(WORKSPACE_STORAGE_KEY) || '';
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function setWorkspaceId(value) {
  if (!value) {
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(WORKSPACE_STORAGE_KEY, value);
}

export async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const baseHeaders = {};
  if (body) {
    baseHeaders['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...baseHeaders,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await res.text();
  let json = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = { message: raw || 'Unknown response' };
  }

  if (!res.ok) {
    const err = new Error(json?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = json;
    throw err;
  }

  return json;
}

export function workspaceHeaders(workspaceId = getWorkspaceId()) {
  return workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
}
