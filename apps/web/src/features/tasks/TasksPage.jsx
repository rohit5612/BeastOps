import { useEffect, useState } from 'react';
import { apiRequest, getWorkspaceId, setWorkspaceId, workspaceHeaders } from '../../shared/lib/api.js';

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
      const query = videoProjectId ? `?videoProjectId=${encodeURIComponent(videoProjectId)}` : '';
      const data = await apiRequest(`/tasks${query}`, {
        headers: workspaceHeaders(workspaceId),
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
      await apiRequest('/tasks', {
        method: 'POST',
        headers: workspaceHeaders(workspaceId),
        body: {
          title: title.trim(),
          videoProjectId: videoProjectId || undefined,
          priority: 'MEDIUM',
        },
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
      await apiRequest(`/tasks/${id}`, {
        method: 'DELETE',
        headers: workspaceHeaders(workspaceId),
      });
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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Tasks</h2>
      <p className="text-sm text-muted-foreground">Backed by `/api/tasks` with workspace scoping.</p>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          className="bg-background border border-input rounded-md px-3 py-2"
          value={videoProjectId}
          onChange={(e) => setVideoProjectId(e.target.value)}
          placeholder="Optional Video Project ID"
        />
        <button
          className="bg-muted text-foreground rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground"
          onClick={() => {
            const workspaceId = getWorkspaceId();
            setWorkspaceId(workspaceId);
            loadTasks();
          }}
        >
          Save workspace + Refresh
        </button>
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 bg-background border border-input rounded-md px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task title"
        />
        <button
          className="bg-primary text-primary-foreground rounded-md px-3 py-2 hover:opacity-90"
          onClick={createTask}
        >
          Create Task
        </button>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-lg border border-border bg-card p-3 flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{task.title}</p>
              <p className="text-xs text-muted-foreground">
                {task.status} | {task.priority} | {task.id}
              </p>
            </div>
            <button
              className="text-destructive text-sm"
              onClick={() => removeTask(task.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
