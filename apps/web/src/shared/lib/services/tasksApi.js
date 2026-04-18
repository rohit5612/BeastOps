import { apiRequest, workspaceHeaders } from '../api.js';

export function listTasks(workspaceId, params = {}) {
  const query = new URLSearchParams();
  if (params.videoProjectId) {
    query.set('videoProjectId', params.videoProjectId);
  }
  if (params.status) {
    query.set('status', params.status);
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest(`/tasks${suffix}`, {
    headers: workspaceHeaders(workspaceId),
  });
}

export function createTask(workspaceId, body) {
  return apiRequest('/tasks', {
    method: 'POST',
    headers: workspaceHeaders(workspaceId),
    body,
  });
}

export function updateTask(workspaceId, taskId, body) {
  return apiRequest(`/tasks/${taskId}`, {
    method: 'PATCH',
    headers: workspaceHeaders(workspaceId),
    body,
  });
}

export function deleteTask(workspaceId, taskId) {
  return apiRequest(`/tasks/${taskId}`, {
    method: 'DELETE',
    headers: workspaceHeaders(workspaceId),
  });
}

