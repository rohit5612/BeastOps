import { listStagesForWorkspace } from './pipeline.service.js';

export async function listStages(req, res) {
  const stages = await listStagesForWorkspace(req.workspace.id);
  res.json({ stages });
}
