import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getWorkspaceId } from '../../shared/lib/api.js';
import { listComments, createComment } from '../../shared/lib/services/commentsApi.js';
import { listTasks, createTask, updateTask } from '../../shared/lib/services/tasksApi.js';
import { listVideoAuditEvents, listVideoProjects } from '../../shared/lib/services/videosApi.js';

export function VideoDetailPage() {
  const { id: videoProjectId } = useParams();
  const workspaceId = getWorkspaceId();
  const queryClient = useQueryClient();
  const [taskTitle, setTaskTitle] = useState('');
  const [commentBody, setCommentBody] = useState('');

  const videosQuery = useQuery({
    queryKey: ['videoProjects', workspaceId],
    enabled: !!workspaceId,
    queryFn: () => listVideoProjects(workspaceId),
  });
  const videoProject = useMemo(
    () => (videosQuery.data?.videoProjects || []).find((item) => item.id === videoProjectId),
    [videosQuery.data, videoProjectId],
  );

  const tasksQuery = useQuery({
    queryKey: ['tasks', workspaceId, videoProjectId],
    enabled: !!workspaceId && !!videoProjectId,
    queryFn: () => listTasks(workspaceId, { videoProjectId }),
  });

  const commentsQuery = useQuery({
    queryKey: ['comments', workspaceId, videoProjectId],
    enabled: !!workspaceId && !!videoProjectId,
    queryFn: () => listComments(workspaceId, { videoProjectId }),
  });

  const auditQuery = useQuery({
    queryKey: ['videoAudit', workspaceId, videoProjectId],
    enabled: !!workspaceId && !!videoProjectId,
    queryFn: () => listVideoAuditEvents(workspaceId, videoProjectId, 50),
  });

  const createTaskMutation = useMutation({
    mutationFn: () =>
      createTask(workspaceId, {
        title: taskTitle.trim(),
        videoProjectId,
      }),
    onSuccess: () => {
      setTaskTitle('');
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId, videoProjectId] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }) => updateTask(workspaceId, taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId, videoProjectId] });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: () =>
      createComment(workspaceId, {
        body: commentBody.trim(),
        videoProjectId,
      }),
    onSuccess: () => {
      setCommentBody('');
      queryClient.invalidateQueries({ queryKey: ['comments', workspaceId, videoProjectId] });
    },
  });

  return (
    <section className="app-page">
      <div className="app-page-header">
        <h1 className="app-page-title">{videoProject?.title || 'Video Project Detail'}</h1>
        <p className="app-page-subtitle">
          Overview with tasks, comments, and timeline audit events.
        </p>
      </div>

      {!workspaceId ? (
        <div className="app-surface p-4 text-sm text-muted-foreground">
          Select a workspace first.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="app-surface p-4 space-y-3 xl:col-span-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Task Tracker
            </h2>
            <div className="flex gap-2">
              <input
                className="app-input flex-1"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="New task title"
              />
              <button
                className="app-btn-primary"
                disabled={!taskTitle.trim() || createTaskMutation.isPending}
                onClick={() => createTaskMutation.mutate()}
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {(tasksQuery.data?.tasks || []).map((task) => (
                <div key={task.id} className="app-surface-muted p-3">
                  <p className="text-sm font-medium">{task.title}</p>
                  <div className="mt-2">
                    <select
                      className="app-select h-8 w-full text-xs"
                      value={task.status}
                      onChange={(e) =>
                        updateTaskMutation.mutate({ taskId: task.id, status: e.target.value })
                      }
                    >
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="DONE">DONE</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="app-surface p-4 space-y-3 xl:col-span-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Comments
            </h2>
            <div className="flex gap-2">
              <input
                className="app-input flex-1"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Add comment"
              />
              <button
                className="app-btn-primary"
                disabled={!commentBody.trim() || createCommentMutation.isPending}
                onClick={() => createCommentMutation.mutate()}
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {(commentsQuery.data?.comments || []).map((comment) => (
                <div key={comment.id} className="app-surface-muted p-3">
                  <p className="text-sm">{comment.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {comment.author?.name || comment.author?.email}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="app-surface p-4 space-y-3 xl:col-span-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Audit Timeline
            </h2>
            <div className="space-y-2">
              {(auditQuery.data?.events || []).map((evt) => (
                <div key={evt.id} className="app-surface-muted p-3">
                  <p className="text-sm font-medium">{evt.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(evt.createdAt).toLocaleString()} |{' '}
                    {evt.actor?.name || evt.actor?.email || 'System'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

