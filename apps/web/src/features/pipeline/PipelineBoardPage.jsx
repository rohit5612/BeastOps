import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getWorkspaceId } from '../../shared/lib/api.js';
import { listPipelineStages } from '../../shared/lib/services/pipelineApi.js';
import {
  createVideoProject,
  listVideoProjects,
  moveVideoProjectStage,
} from '../../shared/lib/services/videosApi.js';

export function PipelineBoardPage() {
  const workspaceId = getWorkspaceId();
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [newStageId, setNewStageId] = useState('');

  const stagesQuery = useQuery({
    queryKey: ['pipelineStages', workspaceId],
    enabled: !!workspaceId,
    queryFn: () => listPipelineStages(workspaceId),
  });

  const videosQuery = useQuery({
    queryKey: ['videoProjects', workspaceId],
    enabled: !!workspaceId,
    queryFn: () => listVideoProjects(workspaceId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createVideoProject(workspaceId, {
        title: newTitle.trim(),
        stageId: newStageId || undefined,
      }),
    onSuccess: () => {
      setNewTitle('');
      queryClient.invalidateQueries({ queryKey: ['videoProjects', workspaceId] });
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ videoProjectId, stageId }) =>
      moveVideoProjectStage(workspaceId, videoProjectId, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoProjects', workspaceId] });
    },
  });

  const grouped = useMemo(() => {
    const byStage = new Map();
    const stages = stagesQuery.data?.stages || [];
    for (const stage of stages) {
      byStage.set(stage.id, []);
    }
    for (const video of videosQuery.data?.videoProjects || []) {
      if (!byStage.has(video.stageId)) {
        byStage.set(video.stageId, []);
      }
      byStage.get(video.stageId).push(video);
    }
    return byStage;
  }, [stagesQuery.data, videosQuery.data]);

  return (
    <section className="app-page">
      <div className="app-page-header">
        <h1 className="app-page-title">Pipeline Board</h1>
        <p className="app-page-subtitle">
          Track video projects across Idea to Postmortem stages.
        </p>
      </div>

      {!workspaceId ? (
        <div className="app-surface p-4 text-sm text-muted-foreground">
          Select a workspace first.
        </div>
      ) : (
        <>
          <div className="app-surface p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Create Video Project
            </h2>
            <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
              <input
                className="app-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Video project title"
              />
              <select
                className="app-select"
                value={newStageId}
                onChange={(e) => setNewStageId(e.target.value)}
              >
                <option value="">First stage</option>
                {(stagesQuery.data?.stages || []).map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
              <button
                className="app-btn-primary"
                disabled={!newTitle.trim() || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                Add
              </button>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {(stagesQuery.data?.stages || []).map((stage) => (
              <article key={stage.id} className="app-surface p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{stage.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {grouped.get(stage.id)?.length || 0}
                  </span>
                </div>
                <div className="space-y-2">
                  {(grouped.get(stage.id) || []).map((video) => (
                    <div key={video.id} className="app-surface-muted p-3 space-y-2">
                      <Link
                        to={`/content-ops/video-projects/${video.id}`}
                        className="text-sm font-medium hover:text-primary"
                      >
                        {video.title}
                      </Link>
                      <div className="flex items-center gap-2">
                        <select
                          className="app-select h-8 flex-1 text-xs"
                          value={video.stageId}
                          onChange={(e) =>
                            moveMutation.mutate({
                              videoProjectId: video.id,
                              stageId: e.target.value,
                            })
                          }
                        >
                          {(stagesQuery.data?.stages || []).map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

