import { useState } from 'react';
import { apiRequest, getWorkspaceId, setWorkspaceId, workspaceHeaders } from '../../shared/lib/api.js';

export function VideoTimelinePage() {
  const [videoId, setVideoId] = useState('');
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');

  async function loadTimeline() {
    const workspaceId = getWorkspaceId();
    if (!workspaceId || !videoId) {
      setMessage('Workspace ID and Video Project ID are required');
      return;
    }
    try {
      const data = await apiRequest(`/videos/${videoId}/audit`, {
        headers: workspaceHeaders(workspaceId),
      });
      setEvents(data.events || []);
      setMessage(`Loaded ${data.events?.length || 0} events`);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Video Timeline</h2>
      <p className="text-sm text-muted-foreground">Backed by `/api/videos/:id/audit`.</p>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          className="bg-background border border-input rounded-md px-3 py-2"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          placeholder="Video Project ID"
        />
        <button
          className="bg-muted text-foreground rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground"
          onClick={() => {
            const workspaceId = getWorkspaceId();
            setWorkspaceId(workspaceId);
            loadTimeline();
          }}
        >
          Save workspace + Load timeline
        </button>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="space-y-2">
        {events.map((evt) => (
          <div key={evt.id} className="rounded-lg border border-border bg-card p-3">
            <p className="font-medium">{evt.action}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(evt.createdAt).toLocaleString()} | actor: {evt.actor?.name || evt.actor?.email || '-'}
            </p>
            <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
              {JSON.stringify(evt.payload, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
