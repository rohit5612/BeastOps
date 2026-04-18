import { assignRoleToMember, createRole, listRoles } from './roles.service.js';

export async function getRoles(req, res) {
  const roles = await listRoles(req.workspace?.tenantId);
  res.json({ roles });
}

export async function postRole(req, res) {
  const role = await createRole(req.workspace?.tenantId, req.body);
  res.status(201).json({ role });
}

export async function postRoleAssignment(req, res) {
  const assignment = await assignRoleToMember({
    tenantId: req.workspace?.tenantId,
    roleId: req.params.id,
    tenantMemberId: req.body?.tenantMemberId,
  });
  res.status(201).json({ assignment });
}
