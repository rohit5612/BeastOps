import {
  convertIdeaToVideoProject,
  createIdea,
  deleteIdea,
  getIdeaById,
  listIdeas,
  updateIdea,
} from './ideas.service.js';

export async function getIdeas(req, res) {
  const ideas = await listIdeas(req.workspace.id);
  res.json({ ideas });
}

export async function postIdea(req, res) {
  const idea = await createIdea(req.workspace.id, req.user.sub, req.body);
  res.status(201).json({ idea });
}

export async function getIdea(req, res) {
  const idea = await getIdeaById(req.workspace.id, req.params.id);
  res.json({ idea });
}

export async function patchIdea(req, res) {
  const idea = await updateIdea(
    req.workspace.id,
    req.params.id,
    req.user.sub,
    req.body,
  );
  res.json({ idea });
}

export async function removeIdea(req, res) {
  await deleteIdea(req.workspace.id, req.params.id, req.user.sub);
  res.status(204).end();
}

export async function postIdeaConvert(req, res) {
  const videoProject = await convertIdeaToVideoProject(
    req.workspace.id,
    req.params.id,
    req.user.sub,
  );
  res.status(201).json({ videoProject });
}
