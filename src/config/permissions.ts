// Permission types
export type PermissionAction = 'read' | 'view' | 'create' | 'update' | 'delete';
export type PermissionScope = 'all' | 'assigned' | 'own';

export type PermissionObj = {
  module: string;
  actions: PermissionAction[];
  scope: PermissionScope;
};

// CRM Routes
export const PATH_CRM = {
  dashboard: '/dashboards/default',
  customers: '/crm/customers',
  leads: '/crm/leads',
  locations: '/crm/location',
  activities: {
    leads: '/crm/activities/leads',
    tasks: '/crm/activities/tasks',
  },
  hr: {
    Attendance: '/hrms/employeee/attendance',
    leave: '/hrms/employeee/leave',
    salarySetting: '/hrms/employeee/salarySetting',
    payslip: '/hrms/setting/payslip',
    candidate: '/hrms/candidate',
    Settings: '/hrms/setting',
  },
  calls: '/crm/calls',
  recordings: '/crm/recordings',
  products: '/crm/products',
  quotations: '/crm/quotations',
  reports: {
    overview: '/crm/reports/overview',
    sales: '/crm/reports/sales',
    team: '/crm/reports/team',
  },
  settings: {
    users: '/crm/settings/staff',
    roles: '/crm/settings/roles',
    sources: '/crm/settings/sources',
    integrations: '/crm/settings/integrations',
  },
  support: '/crm/support',
  config: '/crm/config',
  trash: '/crm/trash',
};

export const ROUTE_MODULE_MAP: Record<string, string> = {
  [PATH_CRM.leads]: 'leads',
  [PATH_CRM.customers]: 'customers',
  [PATH_CRM.activities.leads]: 'leads',
  [PATH_CRM.activities.tasks]: 'tasks',
  [PATH_CRM.calls]: 'calls',
  [PATH_CRM.recordings]: 'recordings',
  [PATH_CRM.products]: 'products',
  [PATH_CRM.quotations]: 'quotations',
  [PATH_CRM.locations]: 'locations',
  [PATH_CRM.hr.Attendance]: 'attendance',
  [PATH_CRM.hr.leave]: 'leave',
  [PATH_CRM.hr.salarySetting]: 'salary',
  [PATH_CRM.hr.payslip]: 'payroll',
  [PATH_CRM.hr.candidate]: 'candidates',
  [PATH_CRM.hr.Settings]: 'settings',
  [PATH_CRM.settings.users]: 'users',
  [PATH_CRM.settings.roles]: 'roles',
  [PATH_CRM.config]: 'settings',
};

// Module definitions with actions
export const MODULES = {
  trash: {
    label: 'Trash',
    group: 'Administration',
    actions: ['read', 'update', 'delete'],
    scopes: ['all'],
  },
  // HR Module
  staff: {
    label: 'Staff',
    group: 'Human Resources',
    actions: ['read', 'create', 'update', 'delete'],
    scopes: ['all', 'own'],
  },
  attendance: {
    label: 'Attendance',
    group: 'Human Resources',
    actions: ['read', 'create', 'update', 'delete'],
    scopes: ['all', 'own'],
  },
  leave: {
    label: 'Leave',
    group: 'Human Resources',
    actions: ['read', 'create', 'update', 'delete'],
    scopes: ['all', 'own'],
  },
  salary: {
    label: 'Salary',
    group: 'Human Resources',
    actions: ['read', 'create', 'update', 'delete'],
    scopes: ['all', 'own'],
  },
  payroll: {
    label: 'Payroll',
    group: 'Human Resources',
    actions: ['read', 'update', 'delete'],
    scopes: ['all', 'own'],
  },
  candidates: {
    label: 'Candidates',
    group: 'Human Resources',
    actions: ['read', 'create', 'update', 'delete'],
    scopes: ['all', 'own'],
  },

  // Sales Module
  customers: {
    label: 'Customers',
    group: 'Sales',
    actions: ['read', 'create', 'update', 'delete'],
    scopes: ['all', 'assigned'],
  },
  leads: {
    label: 'Leads',
    group: 'Sales',
    actions: ['read', 'create', 'update', 'delete'],
    scopes: ['all', 'own'],
  },
  tasks: {
    label: 'Tasks',
    group: 'Sales',
    actions: ['read', 'create', 'update', 'delete'],
    scopes: ['all', 'own'],
  },
  // customers: {
  //   label: 'Customers',
  //   group: 'Sales',
  //   actions: ['read', 'create', 'update', 'delete'],
  //   scopes: ['all', 'assigned'],
  // },
  // deals: {
  //   label: 'Deals',
  //   group: 'Sales',
  //   actions: ['read', 'create', 'update', 'delete'],
  //   scopes: ['all', 'assigned', 'own'],
  // },
  products: {
    label: 'Products',
    group: 'Sales',
    actions: ['read', 'create', 'update', 'delete'],
    scopes: ['all'],
  },
  quotations: {
    label: 'Orders',
    group: 'Sales',
    actions: ['read', 'create', 'update', 'delete'],
    scopes: ['all', 'own'],
  },

  // Communication Module
  calls: {
    label: 'Calls',
    group: 'Communication',
    actions: ['read', 'create', 'delete'],
    scopes: ['all', 'own'],
  },
  locations: {
    label: 'Location',
    group: 'Communication',
    actions: ['read'],
    scopes: ['all', 'own'],
  },
  recordings: {
    label: 'Recordings',
    group: 'Communication',
    actions: ['read', 'create', 'delete'],
    scopes: ['all', 'own'],
  },

  // Reports Module
  // reports: {
  //   label: 'Reports',
  //   group: 'Analytics',
  //   actions: ['read'],
  //   scopes: ['all'],
  // },

  // Settings Module
  settings: {
    label: 'Settings',
    group: 'Administration',
    actions: ['read', 'update', 'delete'],
    scopes: ['all'],
  },
  roles: {
    label: 'Roles & Permissions',
    group: 'Administration',
    actions: ['read', 'create', 'update', 'delete'],
    scopes: ['all'],
  },
  users: {
    label: 'Users',
    group: 'Administration',
    actions: ['read', 'create', 'update', 'delete'],
    scopes: ['all'],
  },
};

// Get grouped permissions by category
export const getPermissionsGrouped = () => {
  const grouped: Record<
    string,
    {
      groupLabel: string;
      items: { key: string; label: string; module: string }[];
    }
  > = {};

  Object.entries(MODULES).forEach(([moduleKey, moduleConfig]) => {
    const groupKey = moduleConfig.group;

    if (!grouped[groupKey]) {
      grouped[groupKey] = {
        groupLabel: groupKey,
        items: [],
      };
    }

    grouped[groupKey].items.push({
      key: moduleKey,
      label: moduleConfig.label,
      module: moduleKey,
    });
  });

  return grouped;
};

// Get module config
export const getModuleConfig = (module: string) => {
  return MODULES[module as keyof typeof MODULES];
};

// Get all available scopes for a module
export const getModuleScopes = (module: string): PermissionScope[] => {
  const config = getModuleConfig(module);
  return (config?.scopes as PermissionScope[]) || ['all'];
};

// Get all available actions for a module
export const getModuleActions = (module: string): PermissionAction[] => {
  const config = getModuleConfig(module);
  return (config?.actions as PermissionAction[]) || ['read'];
};

// Helper to format permission display
export const formatPermission = (permission: PermissionObj): string => {
  const config = getModuleConfig(permission.module);
  const label = config?.label || permission.module;
  const actions = permission.actions.join(', ');
  return `${label} (${actions}) - ${permission.scope}`;
};

// Helper to get all modules
export const getAllModules = () => {
  return Object.entries(MODULES).map(([key, config]) => ({
    key,
    ...config,
  }));
};

// Helper to get modules by group
export const getModulesByGroup = (group: string) => {
  return Object.entries(MODULES)
    .filter(([_, config]) => config.group === group)
    .map(([key, config]) => ({
      key,
      ...config,
    }));
};

// Get all unique groups
export const getAllGroups = () => {
  const groups = new Set(Object.values(MODULES).map((m) => m.group));
  return Array.from(groups).sort();
};

// Helper to check route access
export const hasRouteAccess = (
  userPermissions: PermissionObj[],
  route: string,
  user?: any
): boolean => {
  if (isAdminUser(user)) return true;

  const normalizedRoute = normalizeRoute(route);
  if (normalizedRoute === PATH_CRM.dashboard) return true;
  if (normalizedRoute === PATH_CRM.trash) {
    return userPermissions.some((permission) => permission.actions.some((action) => ['read', 'view'].includes(action)));
  }

  const module = getRouteModule(normalizedRoute);
  if (!module) return true;

  return canViewModule(userPermissions, module);
};

export const normalizeRoute = (route: string): string =>
  (route || '').split('?')[0].replace(/\/+$/, '') || '/';

export const getRouteModule = (route: string): string | undefined => {
  const normalizedRoute = normalizeRoute(route);
  const routes = Object.keys(ROUTE_MODULE_MAP).sort(
    (a, b) => b.length - a.length
  );

  const matchedRoute = routes.find(
    (mappedRoute) =>
      normalizedRoute === mappedRoute ||
      normalizedRoute.startsWith(`${mappedRoute}/`)
  );

  return matchedRoute ? ROUTE_MODULE_MAP[matchedRoute] : undefined;
};

export const canViewModule = (
  userPermissions: PermissionObj[],
  module: string
): boolean => {
  const permission = userPermissions.find((p) => p.module === module);
  if (!permission) return false;

  return permission.actions.some((action) => ['read', 'view'].includes(action));
};

export const isAdminUser = (user?: any): boolean => {
  const role = user?.roleId;
  const roleName = typeof role === 'object' ? role?.name : user?.roleName;

  return (
    user?.isAdmin === true ||
    role?.isAdmin === true ||
    String(roleName || '').toLowerCase() === 'super admin'
  );
};
