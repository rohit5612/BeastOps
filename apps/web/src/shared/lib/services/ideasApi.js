import { apiRequest, workspaceHeaders } from '../api.js';

export function listIdeas(workspaceId) {
  return apiRequest('/ideas', {
    headers: workspaceHeaders(workspaceId),
  });
}

export function createIdea(workspaceId, body) {
  return apiRequest('/ideas', {
    method: 'POST',
    headers: workspaceHeaders(workspaceId),
    body,
  });
}

export function convertIdeaToVideoProject(workspaceId, ideaId) {
  return apiRequest(`/ideas/${ideaId}/convert`, {
    method: 'POST',
    headers: workspaceHeaders(workspaceId),
  });
}

export function deleteIdea(workspaceId, ideaId) {
  return apiRequest(`/ideas/${ideaId}`, {
    method: 'DELETE',
    headers: workspaceHeaders(workspaceId),
  });
}

