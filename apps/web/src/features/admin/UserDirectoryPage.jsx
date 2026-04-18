import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkspaceId } from '../../shared/lib/api.js';
import { listUsers, updateUser } from '../../shared/lib/services/usersApi.js';
import { listDepartments } from '../../shared/lib/services/departmentsApi.js';

export function UserDirectoryPage() {
  const workspaceId = getWorkspaceId();
  const queryClient = useQueryClient();
  const usersQuery = useQuery({
    queryKey: ['tenantUsers', workspaceId],
    enabled: !!workspaceId,
    queryFn: () => listUsers(workspaceId),
  });

  const departmentsQuery = useQuery({
    queryKey: ['departments', workspaceId],
    enabled: !!workspaceId,
    queryFn: () => listDepartments(workspaceId),
  });

  const mutation = useMutation({
    mutationFn: ({ id, accessLevel, departmentId }) =>
      updateUser(workspaceId, id, { accessLevel, departmentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantUsers', workspaceId] });
    },
  });

  return (
    <section className="app-page">
      <div className="app-page-header">
        <h1 className="app-page-title">User Directory</h1>
        <p className="app-page-subtitle">
          Manage members, levels, and department assignments.
        </p>
      </div>
      {!workspaceId ? (
        <div className="app-surface p-4 text-sm text-muted-foreground">
          Select a workspace first.
        </div>
      ) : usersQuery.isLoading ? (
        <div className="app-surface p-4 text-sm text-muted-foreground">
          Loading users...
        </div>
      ) : usersQuery.isError ? (
        <div className="app-surface p-4 text-sm text-destructive">
          {usersQuery.error?.payload?.message || usersQuery.error?.message}
        </div>
      ) : (
        <div className="app-surface overflow-hidden">
          <div className="grid grid-cols-12 gap-2 border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">
            <p className="col-span-5">User</p>
            <p className="col-span-3">Access Level</p>
            <p className="col-span-4">Department</p>
          </div>
          {(usersQuery.data?.users || []).map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-b border-border/60 last:border-b-0"
            >
              <div className="col-span-5 min-w-0">
                <p className="font-medium text-sm truncate">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email} | {user.onboardingStatus}
                </p>
              </div>
              <select
                className="app-select col-span-3 h-9"
                value={user.accessLevel}
                onChange={(e) =>
                  mutation.mutate({
                    id: user.id,
                    accessLevel: e.target.value,
                    departmentId: user.departmentId || null,
                  })
                }
              >
                <option value="LEVEL0">0 Superadmin</option>
                <option value="LEVEL1">1 Admin</option>
                <option value="LEVEL2">2 Dept Head</option>
                <option value="LEVEL3">3 Manager</option>
                <option value="LEVEL4">4 Senior Associate</option>
                <option value="LEVEL5">5 Associate</option>
              </select>
              <select
                className="app-select col-span-4 h-9"
                value={user.departmentId || ''}
                onChange={(e) =>
                  mutation.mutate({
                    id: user.id,
                    accessLevel: user.accessLevel,
                    departmentId: e.target.value || null,
                  })
                }
              >
                <option value="">No Department</option>
                {(departmentsQuery.data?.departments || []).map((dep) => (
                  <option key={dep.id} value={dep.id}>
                    {dep.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
