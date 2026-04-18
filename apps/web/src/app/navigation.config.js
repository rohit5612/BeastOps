export const NAVIGATION_MODULES = [
  {
    id: 'command-center',
    label: 'Command Center',
    path: '/command-center',
    sections: [
      {
        id: 'overview',
        label: 'Overview',
        path: '/command-center',
      },
    ],
  },
  {
    id: 'user-management',
    label: 'User Management',
    path: '/user-management',
    sections: [
      {
        id: 'directory',
        label: 'User Directory',
        path: '/user-management/directory',
      },
      {
        id: 'approvals',
        label: 'User Approvals',
        path: '/user-management/approvals',
      },
      {
        id: 'org-management',
        label: 'Org Management',
        path: '/user-management/org-management/departments',
        children: [
          {
            id: 'departments',
            label: 'Department Mgmt',
            path: '/user-management/org-management/departments',
          },
          {
            id: 'roles',
            label: 'Role Mgmt',
            path: '/user-management/org-management/roles',
          },
        ],
      },
    ],
  },
  {
    id: 'content-ops',
    label: 'Content Ops',
    path: '/content-ops',
    sections: [
      { id: 'pipeline', label: 'Pipeline', path: '/content-ops/pipeline' },
      { id: 'ideas', label: 'Ideas', path: '/content-ops/ideas' },
      { id: 'tasks', label: 'Tasks', path: '/content-ops/tasks' },
      { id: 'comments', label: 'Comments', path: '/content-ops/comments' },
      { id: 'timeline', label: 'Video Timeline', path: '/content-ops/timeline' },
      { id: 'calendar', label: 'Calendar', path: '/content-ops/calendar' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    sections: [
      { id: 'overview', label: 'Overview', path: '/analytics/overview' },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    path: '/integrations',
    sections: [
      { id: 'youtube', label: 'YouTube', path: '/integrations/youtube' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    sections: [
      { id: 'general', label: 'General', path: '/settings/general' },
    ],
  },
];

function startsWithPath(pathname, candidate) {
  return pathname === candidate || pathname.startsWith(`${candidate}/`);
}

export function deriveNavigationState(pathname) {
  const module =
    NAVIGATION_MODULES.find((item) => startsWithPath(pathname, item.path)) ||
    NAVIGATION_MODULES[0];

  let section =
    module.sections.find((item) => startsWithPath(pathname, item.path)) ||
    module.sections[0];

  let subsection = null;
  if (section?.children?.length) {
    subsection =
      section.children.find((item) => startsWithPath(pathname, item.path)) ||
      section.children[0];
  }

  return {
    module,
    section,
    subsection,
  };
}
