import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getWorkspaceId } from '../../shared/lib/api.js';
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from '../../shared/lib/services/departmentsApi.js';

export function DepartmentManagementPage() {
  const workspaceId = getWorkspaceId();
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const departmentsQuery = useQuery({
    queryKey: ['departments', workspaceId],
    enabled: !!workspaceId,
    queryFn: () => listDepartments(workspaceId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createDepartment(workspaceId, {
        name: name.trim(),
      }),
    onSuccess: () => {
      setName('');
      queryClient.invalidateQueries({ queryKey: ['departments', workspaceId] });
    },
  });

  const toggleContentOpsMutation = useMutation({
    mutationFn: ({ id, moduleAccess }) =>
      updateDepartment(workspaceId, id, {
        moduleAccess: {
          ...(moduleAccess || {}),
          content_ops: !moduleAccess?.content_ops,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', workspaceId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDepartment(workspaceId, id, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', workspaceId] });
    },
  });

  return (
    <section className="app-page">
      <div className="app-page-header">
        <h1 className="app-page-title">Department Management</h1>
        <p className="app-page-subtitle">Organize users by department and control module-level access.</p>
      </div>
      {!workspaceId ? (
        <div className="app-surface p-4 text-sm text-muted-foreground">Select a workspace first.</div>
      ) : (
        <>
          <div className="app-surface p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Create Department
            </h2>
            <div className="flex gap-2">
              <input
                className="app-input flex-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Department name"
              />
              <button
                className="app-btn-primary"
                onClick={() => createMutation.mutate()}
              >
                Add
              </button>
            </div>
          </div>

          {departmentsQuery.isLoading ? (
            <div className="app-surface p-4 text-sm text-muted-foreground">Loading departments...</div>
          ) : departmentsQuery.isError ? (
            <div className="app-surface p-4 text-sm text-destructive">
              {departmentsQuery.error?.payload?.message ||
                departmentsQuery.error?.message}
            </div>
          ) : (
            <div className="app-surface divide-y divide-border">
              {(departmentsQuery.data?.departments || []).map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      members: {item?._count?.members || 0} | roles:{' '}
                      {item?._count?.roles || 0}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="app-btn-muted h-8 px-3 text-xs"
                      onClick={() =>
                        toggleContentOpsMutation.mutate({
                          id: item.id,
                          moduleAccess: item.moduleAccess,
                        })
                      }
                    >
                      ContentOps:{' '}
                      {item.moduleAccess?.content_ops ? 'On' : 'Off'}
                    </button>
                    <button
                      className="app-btn-muted h-8 px-3 text-xs"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
