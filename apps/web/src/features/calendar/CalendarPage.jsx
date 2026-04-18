import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkspaceId } from '../../shared/lib/api.js';
import { listTasks } from '../../shared/lib/services/tasksApi.js';

function toDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unscheduled';
  return date.toISOString().slice(0, 10);
}

export function CalendarPage() {
  const workspaceId = getWorkspaceId();
  const tasksQuery = useQuery({
    queryKey: ['tasks', workspaceId, 'calendar'],
    enabled: !!workspaceId,
    queryFn: () => listTasks(workspaceId),
  });

  const grouped = useMemo(() => {
    const map = new Map();
    for (const task of tasksQuery.data?.tasks || []) {
      const key = task.dueDate ? toDateKey(task.dueDate) : 'unscheduled';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(task);
    }
    return [...map.entries()].sort((a, b) => {
      if (a[0] === 'unscheduled') return 1;
      if (b[0] === 'unscheduled') return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [tasksQuery.data]);

  return (
    <section className="app-page">
      <div className="app-page-header">
        <h1 className="app-page-title">Calendar</h1>
        <p className="app-page-subtitle">
          Date-focused task view for publishing and delivery planning.
        </p>
      </div>

      {!workspaceId ? (
        <div className="app-surface p-4 text-sm text-muted-foreground">
          Select a workspace first.
        </div>
      ) : tasksQuery.isLoading ? (
        <div className="app-surface p-4 text-sm text-muted-foreground">
          Loading calendar items...
        </div>
      ) : (
        <div className="app-surface divide-y divide-border">
          {grouped.length ? (
            grouped.map(([dateKey, tasks]) => (
              <div key={dateKey} className="p-4 space-y-2">
                <h2 className="text-sm font-semibold">
                  {dateKey === 'unscheduled'
                    ? 'Unscheduled'
                    : new Date(dateKey).toLocaleDateString()}
                </h2>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="app-surface-muted p-3">
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.status} | {task.priority} |{' '}
                        {task.videoProject?.title || 'General workspace task'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              No task calendar items yet.
            </div>
          )}
        </div>
      )}
    </section>
  );
}

