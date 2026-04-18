import { useState } from 'react';
import { getWorkspaceId } from '../../shared/lib/api.js';
import { createComment, listComments } from '../../shared/lib/services/commentsApi.js';

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
    try {
      const data = await listComments(workspaceId, {
        taskId: taskId || undefined,
        videoProjectId: videoProjectId || undefined,
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
      await createComment(workspaceId, {
        body: commentBody.trim(),
        taskId: taskId || undefined,
        videoProjectId: videoProjectId || undefined,
      });
      setCommentBody('');
      await loadComments();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="app-page">
      <div className="app-page-header">
        <h1 className="app-page-title">Comments</h1>
        <p className="app-page-subtitle">Backed by `/api/comments` linked to task or video.</p>
      </div>

      <div className="app-surface p-5 space-y-3">
        <div className="grid gap-2 md:grid-cols-2">
          <input
            className="app-input"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            placeholder="Task ID"
          />
          <input
            className="app-input"
            value={videoProjectId}
            onChange={(e) => setVideoProjectId(e.target.value)}
            placeholder="Video Project ID"
          />
        </div>
        <div className="flex gap-2">
          <input
            className="app-input flex-1"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="New comment text"
          />
          <button className="app-btn-primary" onClick={createComment}>
            Create Comment
          </button>
          <button
            className="app-btn-muted"
            onClick={loadComments}
          >
            Refresh
          </button>
        </div>
      </div>

      {message ? <div className="text-sm text-muted-foreground">{message}</div> : null}

      <div className="app-surface divide-y divide-border">
        {comments.map((comment) => (
          <div key={comment.id} className="p-4">
            <p>{comment.body}</p>
            <p className="text-xs text-muted-foreground">
              {comment.author?.name || comment.author?.email} | task: {comment.taskId || '-'} |
              video: {comment.videoProjectId || '-'}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
