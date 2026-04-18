import { apiRequest, workspaceHeaders } from '../api.js';

export function listComments(workspaceId, params = {}) {
  const query = new URLSearchParams();
  if (params.taskId) {
    query.set('taskId', params.taskId);
  }
  if (params.videoProjectId) {
    query.set('videoProjectId', params.videoProjectId);
  }
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest(`/comments${suffix}`, {
    headers: workspaceHeaders(workspaceId),
  });
}

export function createComment(workspaceId, body) {
  return apiRequest('/comments', {
    method: 'POST',
    headers: workspaceHeaders(workspaceId),
    body,
  });
}

export function updateComment(workspaceId, commentId, body) {
  return apiRequest(`/comments/${commentId}`, {
    method: 'PATCH',
    headers: workspaceHeaders(workspaceId),
    body,
  });
}

export function deleteComment(workspaceId, commentId) {
  return apiRequest(`/comments/${commentId}`, {
    method: 'DELETE',
    headers: workspaceHeaders(workspaceId),
  });
}

