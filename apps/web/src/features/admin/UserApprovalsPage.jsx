import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getWorkspaceId } from '../../shared/lib/api.js';
import {
  approvePendingUser,
  listPendingApprovals,
  rejectPendingUser,
} from '../../shared/lib/services/usersApi.js';

export function UserApprovalsPage() {
  const workspaceId = getWorkspaceId();
  const queryClient = useQueryClient();

  const approvalsQuery = useQuery({
    queryKey: ['pendingApprovals', workspaceId],
    enabled: !!workspaceId,
    queryFn: () => listPendingApprovals(workspaceId),
  });

  const approve = useMutation({
    mutationFn: ({ id, accessLevel }) =>
      approvePendingUser(workspaceId, id, { accessLevel }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals', workspaceId] });
    },
  });

  const reject = useMutation({
    mutationFn: (id) => rejectPendingUser(workspaceId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals', workspaceId] });
    },
  });

  return (
    <section className="app-page">
      <div className="app-page-header">
        <h1 className="app-page-title">User Approvals</h1>
        <p className="app-page-subtitle">Review invite-based users waiting for onboarding approval.</p>
      </div>
      {!workspaceId ? (
        <div className="app-surface p-4 text-sm text-muted-foreground">Select a workspace first.</div>
      ) : approvalsQuery.isLoading ? (
        <div className="app-surface p-4 text-sm text-muted-foreground">Loading approvals...</div>
      ) : approvalsQuery.isError ? (
        <div className="app-surface p-4 text-sm text-destructive">
          {approvalsQuery.error?.payload?.message || approvalsQuery.error?.message}
        </div>
      ) : (
        <div className="app-surface divide-y divide-border">
          {(approvalsQuery.data?.approvals || []).map((item) => (
            <div key={item.id} className="p-4 space-y-2">
              <p className="font-medium text-sm">{item.user?.name || item.user?.email}</p>
              <p className="text-xs text-muted-foreground">{item.user?.email}</p>
              <div className="flex items-center gap-2">
                <button
                  className="app-btn-primary h-9"
                  onClick={() => approve.mutate({ id: item.id, accessLevel: 'LEVEL5' })}
                >
                  Approve
                </button>
                <button
                  className="app-btn-muted h-9"
                  onClick={() => reject.mutate(item.id)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
