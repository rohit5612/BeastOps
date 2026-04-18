import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getWorkspaceId } from '../../shared/lib/api.js';
import { listDepartments } from '../../shared/lib/services/departmentsApi.js';
import { createRole, listRoles } from '../../shared/lib/services/rolesApi.js';

export function RoleManagementPage() {
  const workspaceId = getWorkspaceId();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [resource, setResource] = useState('tasks');
  const [action, setAction] = useState('read');
  const [departmentId, setDepartmentId] = useState('');

  const rolesQuery = useQuery({
    queryKey: ['roles', workspaceId],
    enabled: !!workspaceId,
    queryFn: () => listRoles(workspaceId),
  });

  const departmentsQuery = useQuery({
    queryKey: ['departments', workspaceId],
    enabled: !!workspaceId,
    queryFn: () => listDepartments(workspaceId),
  });

  const createRoleMutation = useMutation({
    mutationFn: () =>
      createRole(workspaceId, {
        name: name.trim(),
        departmentId: departmentId || null,
        permissions: [
          {
            resource,
            action,
            effect: 'allow',
          },
        ],
      }),
    onSuccess: () => {
      setName('');
      setDepartmentId('');
      queryClient.invalidateQueries({ queryKey: ['roles', workspaceId] });
    },
  });

  return (
    <section className="app-page">
      <div className="app-page-header">
        <h1 className="app-page-title">Role Management</h1>
        <p className="app-page-subtitle">Create tenant roles with scoped permissions and department mapping.</p>
      </div>
      {!workspaceId ? (
        <div className="app-surface p-4 text-sm text-muted-foreground">Select a workspace first.</div>
      ) : (
        <>
          <div className="app-surface p-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Create Role</h2>
            <input
              className="app-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Role name"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                className="app-select"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">Select department</option>
                {(departmentsQuery.data?.departments || []).map((dep) => (
                  <option key={dep.id} value={dep.id}>
                    {dep.name}
                  </option>
                ))}
              </select>
              <input
                className="app-input"
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                placeholder="Resource"
              />
              <input
                className="app-input"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Action"
              />
            </div>
            <button
              className="app-btn-primary"
              onClick={() => createRoleMutation.mutate()}
            >
              Create
            </button>
          </div>

          {rolesQuery.isLoading ? (
            <div className="app-surface p-4 text-sm text-muted-foreground">Loading roles...</div>
          ) : rolesQuery.isError ? (
            <div className="app-surface p-4 text-sm text-destructive">
              {rolesQuery.error?.payload?.message || rolesQuery.error?.message}
            </div>
          ) : (
            <div className="app-surface divide-y divide-border">
              {(rolesQuery.data?.roles || []).map((role) => (
                <div key={role.id} className="p-4">
                  <p className="font-medium text-sm">{role.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Department: {role.department?.name || 'System/Global'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(role.rolePermissions || [])
                      .map((rp) => `${rp.permission?.resource}:${rp.permission?.action}`)
                      .join(', ') || 'No permissions yet'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
