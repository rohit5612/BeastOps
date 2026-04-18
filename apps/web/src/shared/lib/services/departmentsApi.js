import { apiRequest, workspaceHeaders } from '../api.js';

export function listDepartments(workspaceId) {
  return apiRequest('/departments', {
    headers: workspaceHeaders(workspaceId),
  });
}

export function createDepartment(workspaceId, body) {
  return apiRequest('/departments', {
    method: 'POST',
    headers: workspaceHeaders(workspaceId),
    body,
  });
}

export function updateDepartment(workspaceId, departmentId, body) {
  return apiRequest(`/departments/${departmentId}`, {
    method: 'PATCH',
    headers: workspaceHeaders(workspaceId),
    body,
  });
}

export function deleteDepartment(workspaceId, departmentId, force = false) {
  const query = force ? '?force=true' : '';
  return apiRequest(`/departments/${departmentId}${query}`, {
    method: 'DELETE',
    headers: workspaceHeaders(workspaceId),
  });
}
