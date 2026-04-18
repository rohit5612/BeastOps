import { listTenantUsers, updateTenantUser } from './users.service.js';

export async function getUsers(req, res) {
  const users = await listTenantUsers(req.workspace?.tenantId);
  res.json({ users });
}

export async function patchUser(req, res) {
  const member = await updateTenantUser(
    req.workspace?.tenantId,
    req.params.id,
    req.body,
  );
  res.json({ member });
}
