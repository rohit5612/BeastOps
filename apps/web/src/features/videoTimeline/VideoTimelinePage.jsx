import { useState } from 'react';
import { getWorkspaceId } from '../../shared/lib/api.js';
import { listVideoAuditEvents } from '../../shared/lib/services/videosApi.js';

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
      const data = await listVideoAuditEvents(workspaceId, videoId, 50);
      setEvents(data.events || []);
      setMessage(`Loaded ${data.events?.length || 0} events`);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="app-page">
      <div className="app-page-header">
        <h1 className="app-page-title">Video Timeline</h1>
        <p className="app-page-subtitle">Backed by `/api/videos/:id/audit`.</p>
      </div>

      <div className="app-surface p-5">
        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <input
            className="app-input"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="Video Project ID"
          />
          <button
            className="app-btn-primary"
            onClick={loadTimeline}
          >
            Load Timeline
          </button>
        </div>
      </div>

      {message ? <div className="text-sm text-muted-foreground">{message}</div> : null}

      <div className="app-surface divide-y divide-border">
        {events.map((evt) => (
          <div key={evt.id} className="p-4">
            <p className="font-medium">{evt.action}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(evt.createdAt).toLocaleString()} | actor: {evt.actor?.name || evt.actor?.email || '-'}
            </p>
            <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap app-surface-muted p-3 overflow-x-auto">
              {JSON.stringify(evt.payload, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
}
