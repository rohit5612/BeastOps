import { apiRequest, workspaceHeaders } from '../api.js';

export function listPipelineStages(workspaceId) {
  return apiRequest('/pipeline/stages', {
    headers: workspaceHeaders(workspaceId),
  });
}

