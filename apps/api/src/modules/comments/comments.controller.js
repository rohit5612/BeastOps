import {
  createComment,
  deleteComment,
  listComments,
  updateComment,
} from './comments.service.js';

export async function getComments(req, res) {
  const comments = await listComments(req.workspace.id, req.query);
  res.json({ comments });
}

export async function postComment(req, res) {
  const comment = await createComment(req.workspace.id, req.user.sub, req.body);
  res.status(201).json({ comment });
}

export async function patchComment(req, res) {
  const comment = await updateComment(req.workspace.id, req.params.id, req.user, req.body);
  res.json({ comment });
}

export async function removeComment(req, res) {
  await deleteComment(req.workspace.id, req.params.id, req.user);
  res.status(204).end();
}
