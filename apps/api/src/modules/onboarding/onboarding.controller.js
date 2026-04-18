import {
  approveMember,
  listPendingApprovals,
  rejectMember,
} from './onboarding.service.js';

export async function getPendingApprovals(req, res) {
  const approvals = await listPendingApprovals(req.workspace?.tenantId);
  res.json({ approvals });
}

export async function postApprove(req, res) {
  const member = await approveMember({
    tenantId: req.workspace?.tenantId,
    memberId: req.params.id,
    approverUserId: req.user.sub,
    accessLevel: req.body?.accessLevel,
  });
  res.json({ member });
}

export async function postReject(req, res) {
  const member = await rejectMember({
    tenantId: req.workspace?.tenantId,
    memberId: req.params.id,
    approverUserId: req.user.sub,
  });
  res.json({ member });
}
