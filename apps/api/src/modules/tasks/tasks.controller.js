import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from './tasks.service.js';

export async function getTasks(req, res) {
  const tasks = await listTasks(req.workspace.id, req.query);
  res.json({ tasks });
}

export async function postTask(req, res) {
  const task = await createTask(req.workspace.id, req.user.sub, req.body);
  res.status(201).json({ task });
}

export async function patchTask(req, res) {
  const task = await updateTask(
    req.workspace.id,
    req.params.id,
    req.user.sub,
    req.body,
  );
  res.json({ task });
}

export async function removeTask(req, res) {
  await deleteTask(req.workspace.id, req.params.id, req.user.sub);
  res.status(204).end();
}
