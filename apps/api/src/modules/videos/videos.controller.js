import {
  createVideoProject,
  getVideoAuditTimeline,
  listVideoProjects,
  moveVideoProjectToStage,
} from './videos.service.js';

export async function getVideos(req, res) {
  const items = await listVideoProjects(req.workspace.id);
  res.json({ videoProjects: items });
}

export async function postVideo(req, res) {
  const created = await createVideoProject(req.workspace.id, req.body);
  res.status(201).json({ videoProject: created });
}

export async function patchVideoStage(req, res) {
  const { id } = req.params;
  const { stageId } = req.body;
  if (!stageId) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'stageId is required',
    });
  }
  const updated = await moveVideoProjectToStage(
    req.workspace.id,
    id,
    stageId,
    req.user.sub,
  );
  res.json({ videoProject: updated });
}

export async function getVideoAudit(req, res) {
  const { id } = req.params;
  const { limit } = req.query;
  const events = await getVideoAuditTimeline(req.workspace.id, id, limit);
  res.json({ events });
}
