import { apiRequest, workspaceHeaders } from '../api.js';

export function listVideoProjects(workspaceId) {
  return apiRequest('/videos', {
    headers: workspaceHeaders(workspaceId),
  });
}

export function createVideoProject(workspaceId, body) {
  return apiRequest('/videos', {
    method: 'POST',
    headers: workspaceHeaders(workspaceId),
    body,
  });
}

export function moveVideoProjectStage(workspaceId, videoProjectId, stageId) {
  return apiRequest(`/videos/${videoProjectId}/stage`, {
    method: 'PATCH',
    headers: workspaceHeaders(workspaceId),
    body: { stageId },
  });
}

export function listVideoAuditEvents(workspaceId, videoProjectId, limit = 50) {
  return apiRequest(`/videos/${videoProjectId}/audit?limit=${encodeURIComponent(limit)}`, {
    headers: workspaceHeaders(workspaceId),
  });
}

