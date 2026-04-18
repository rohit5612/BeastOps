import { useEffect, useState } from 'react';
import { getWorkspaceId } from '../../shared/lib/api.js';
import {
  createTask as createTaskRequest,
  deleteTask,
  listTasks,
} from '../../shared/lib/services/tasksApi.js';

export function TasksPage() {
  const [videoProjectId, setVideoProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  async function loadTasks() {
    const workspaceId = getWorkspaceId();
    if (!workspaceId) {
      setMessage('Set workspace ID first');
      return;
    }
    try {
      const data = await listTasks(workspaceId, {
        videoProjectId: videoProjectId || undefined,
      });
      setTasks(data.tasks || []);
      setMessage(`Loaded ${data.tasks?.length || 0} tasks`);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function createTask() {
    const workspaceId = getWorkspaceId();
    if (!title.trim()) {
      setMessage('Task title is required');
      return;
    }
    try {
      await createTaskRequest(workspaceId, {
        title: title.trim(),
        videoProjectId: videoProjectId || undefined,
        priority: 'MEDIUM',
      });
      setTitle('');
      await loadTasks();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function removeTask(id) {
    const workspaceId = getWorkspaceId();
    try {
      await deleteTask(workspaceId, id);
      await loadTasks();
    } catch (err) {
      setMessage(err.message);
    }
  }

  useEffect(() => {
    const workspaceId = getWorkspaceId();
    if (workspaceId) loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="app-page">
      <div className="app-page-header">
        <h1 className="app-page-title">Tasks</h1>
        <p className="app-page-subtitle">Backed by `/api/tasks` with workspace scoping.</p>
      </div>

      <div className="app-surface p-5 space-y-3">
        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <input
            className="app-input"
            value={videoProjectId}
            onChange={(e) => setVideoProjectId(e.target.value)}
            placeholder="Optional Video Project ID"
          />
          <button
            className="app-btn-muted"
            onClick={loadTasks}
          >
            Refresh
          </button>
        </div>
        <div className="flex gap-2">
          <input
            className="app-input flex-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New task title"
          />
          <button className="app-btn-primary" onClick={createTask}>
            Create Task
          </button>
        </div>
      </div>

      {message ? <div className="text-sm text-muted-foreground">{message}</div> : null}

      <div className="app-surface divide-y divide-border">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-4 flex items-center justify-between gap-3"
          >
            <div>
              <p className="font-medium">{task.title}</p>
              <p className="text-xs text-muted-foreground">
                {task.status} | {task.priority} | {task.id}
              </p>
            </div>
            <button
              className="text-destructive text-sm hover:underline"
              onClick={() => removeTask(task.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
