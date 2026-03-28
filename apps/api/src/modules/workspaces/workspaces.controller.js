import { createWorkspace, listWorkspacesForUser } from './workspaces.service.js';

export async function postWorkspace(req, res) {
  const userId = req.user.sub;
  const workspace = await createWorkspace(userId, req.body);
  res.status(201).json({ workspace });
}

export async function getWorkspaces(req, res) {
  const userId = req.user.sub;
  const workspaces = await listWorkspacesForUser(userId);
  res.json({ workspaces });
}
