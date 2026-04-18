import { apiRequest, workspaceHeaders } from '../api.js';

export function listUsers(workspaceId) {
  return apiRequest('/users', {
    headers: workspaceHeaders(workspaceId),
  });
}

export function updateUser(workspaceId, tenantMemberId, body) {
  return apiRequest(`/users/${tenantMemberId}`, {
    method: 'PATCH',
    headers: workspaceHeaders(workspaceId),
    body,
  });
}

export function listPendingApprovals(workspaceId) {
  return apiRequest('/onboarding/pending', {
    headers: workspaceHeaders(workspaceId),
  });
}

export function approvePendingUser(workspaceId, tenantMemberId, body = {}) {
  return apiRequest(`/onboarding/${tenantMemberId}/approve`, {
    method: 'POST',
    headers: workspaceHeaders(workspaceId),
    body,
  });
}

export function rejectPendingUser(workspaceId, tenantMemberId) {
  return apiRequest(`/onboarding/${tenantMemberId}/reject`, {
    method: 'POST',
    headers: workspaceHeaders(workspaceId),
  });
}
