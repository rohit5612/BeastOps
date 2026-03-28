import { createIdea, listIdeas } from './ideas.service.js';

export async function getIdeas(req, res) {
  const ideas = await listIdeas(req.workspace.id);
  res.json({ ideas });
}

export async function postIdea(req, res) {
  const idea = await createIdea(req.workspace.id, req.body);
  res.status(201).json({ idea });
}
