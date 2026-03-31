import { useState } from 'react';
import { apiRequest, getWorkspaceId, setWorkspaceId, workspaceHeaders } from '../../shared/lib/api.js';

export function CommentsPage() {
  const [taskId, setTaskId] = useState('');
  const [videoProjectId, setVideoProjectId] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState('');

  async function loadComments() {
    const workspaceId = getWorkspaceId();
    if (!workspaceId) {
      setMessage('Set workspace ID first');
      return;
    }
    const params = new URLSearchParams();
    if (taskId) params.set('taskId', taskId);
    if (videoProjectId) params.set('videoProjectId', videoProjectId);
    const query = params.toString() ? `?${params.toString()}` : '';

    try {
      const data = await apiRequest(`/comments${query}`, {
        headers: workspaceHeaders(workspaceId),
      });
      setComments(data.comments || []);
      setMessage(`Loaded ${data.comments?.length || 0} comments`);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function createComment() {
    const workspaceId = getWorkspaceId();
    if (!commentBody.trim()) {
      setMessage('Comment text is required');
      return;
    }
    if (!taskId && !videoProjectId) {
      setMessage('Either taskId or videoProjectId is required');
      return;
    }
    try {
      await apiRequest('/comments', {
        method: 'POST',
        headers: workspaceHeaders(workspaceId),
        body: {
          body: commentBody.trim(),
          taskId: taskId || undefined,
          videoProjectId: videoProjectId || undefined,
        },
      });
      setCommentBody('');
      await loadComments();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Comments</h2>
      <p className="text-sm text-muted-foreground">Backed by `/api/comments` linked to task/video.</p>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          className="bg-background border border-input rounded-md px-3 py-2"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          placeholder="Task ID"
        />
        <input
          className="bg-background border border-input rounded-md px-3 py-2"
          value={videoProjectId}
          onChange={(e) => setVideoProjectId(e.target.value)}
          placeholder="Video Project ID"
        />
      </div>

      <div className="flex gap-2">
        <button
          className="bg-muted text-foreground rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground"
          onClick={() => {
            const workspaceId = getWorkspaceId();
            setWorkspaceId(workspaceId);
            loadComments();
          }}
        >
          Save workspace + Refresh
        </button>
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 bg-background border border-input rounded-md px-3 py-2"
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          placeholder="New comment text"
        />
        <button
          className="bg-primary text-primary-foreground rounded-md px-3 py-2 hover:opacity-90"
          onClick={createComment}
        >
          Create Comment
        </button>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="space-y-2">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-lg border border-border bg-card p-3">
            <p>{comment.body}</p>
            <p className="text-xs text-muted-foreground">
              {comment.author?.name || comment.author?.email} | task: {comment.taskId || '-'} |
              video: {comment.videoProjectId || '-'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
