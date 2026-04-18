import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getWorkspaceId } from '../../shared/lib/api.js';
import {
  convertIdeaToVideoProject,
  createIdea,
  deleteIdea,
  listIdeas,
} from '../../shared/lib/services/ideasApi.js';

export function IdeasPage() {
  const workspaceId = getWorkspaceId();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [hooks, setHooks] = useState('');
  const [thumbnailConcepts, setThumbnailConcepts] = useState('');
  const [tags, setTags] = useState('');
  const [expectedPerformance, setExpectedPerformance] = useState('');

  const ideasQuery = useQuery({
    queryKey: ['ideas', workspaceId],
    enabled: !!workspaceId,
    queryFn: () => listIdeas(workspaceId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createIdea(workspaceId, {
        title: title.trim(),
        hooks: hooks.trim() || undefined,
        thumbnailConcepts: thumbnailConcepts.trim() || undefined,
        expectedPerformance: expectedPerformance.trim() || undefined,
        tags: tags
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      setTitle('');
      setHooks('');
      setThumbnailConcepts('');
      setTags('');
      setExpectedPerformance('');
      queryClient.invalidateQueries({ queryKey: ['ideas', workspaceId] });
    },
  });

  const convertMutation = useMutation({
    mutationFn: (ideaId) => convertIdeaToVideoProject(workspaceId, ideaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas', workspaceId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ideaId) => deleteIdea(workspaceId, ideaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas', workspaceId] });
    },
  });

  return (
    <section className="app-page">
      <div className="app-page-header">
        <h1 className="app-page-title">Ideas</h1>
        <p className="app-page-subtitle">
          Capture hooks, concepts, and convert winning ideas into video projects.
        </p>
      </div>

      {!workspaceId ? (
        <div className="app-surface p-4 text-sm text-muted-foreground">
          Select a workspace first.
        </div>
      ) : (
        <>
          <div className="app-surface p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Add Idea
            </h2>
            <input
              className="app-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Idea title"
            />
            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="app-input"
                value={hooks}
                onChange={(e) => setHooks(e.target.value)}
                placeholder="Hook concepts"
              />
              <input
                className="app-input"
                value={thumbnailConcepts}
                onChange={(e) => setThumbnailConcepts(e.target.value)}
                placeholder="Thumbnail concepts"
              />
              <input
                className="app-input"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma separated)"
              />
              <input
                className="app-input"
                value={expectedPerformance}
                onChange={(e) => setExpectedPerformance(e.target.value)}
                placeholder="Expected performance"
              />
            </div>
            <button
              className="app-btn-primary"
              disabled={!title.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Create Idea
            </button>
          </div>

          <div className="app-surface divide-y divide-border">
            {(ideasQuery.data?.ideas || []).map((idea) => (
              <div key={idea.id} className="p-4 space-y-2">
                <p className="text-sm font-medium">{idea.title}</p>
                <p className="text-xs text-muted-foreground">
                  Tags: {(idea.tags || []).join(', ') || 'None'}
                </p>
                {idea.hooks ? (
                  <p className="text-xs text-muted-foreground">Hooks: {idea.hooks}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  {idea.videoProject ? (
                    <Link
                      className="text-xs text-primary hover:underline"
                      to={`/content-ops/video-projects/${idea.videoProject.id}`}
                    >
                      Converted: {idea.videoProject.title}
                    </Link>
                  ) : (
                    <>
                      <button
                        className="app-btn-primary h-8 px-3 text-xs"
                        onClick={() => convertMutation.mutate(idea.id)}
                      >
                        Convert to Video Project
                      </button>
                      <button
                        className="app-btn-muted h-8 px-3 text-xs"
                        onClick={() => deleteMutation.mutate(idea.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

