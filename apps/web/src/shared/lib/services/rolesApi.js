import { apiRequest, workspaceHeaders } from '../api.js';

export function listRoles(workspaceId) {
  return apiRequest('/roles', {
    headers: workspaceHeaders(workspaceId),
  });
}

export function createRole(workspaceId, body) {
  return apiRequest('/roles', {
    method: 'POST',
    headers: workspaceHeaders(workspaceId),
    body,
  });
}

export function assignRole(workspaceId, roleId, tenantMemberId) {
  return apiRequest(`/roles/${roleId}/assign`, {
    method: 'POST',
    headers: workspaceHeaders(workspaceId),
    body: { tenantMemberId },
  });
}
