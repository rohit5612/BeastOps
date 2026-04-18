import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from './departments.service.js';

export async function getDepartments(req, res) {
  const departments = await listDepartments(req.workspace?.tenantId);
  res.json({ departments });
}

export async function postDepartment(req, res) {
  const department = await createDepartment(req.workspace?.tenantId, req.body);
  res.status(201).json({ department });
}

export async function patchDepartment(req, res) {
  const department = await updateDepartment(
    req.workspace?.tenantId,
    req.params.id,
    req.body,
  );
  res.json({ department });
}

export async function removeDepartment(req, res) {
  await deleteDepartment(req.workspace?.tenantId, req.params.id, {
    force: req.query?.force === 'true',
  });
  res.status(204).end();
}
