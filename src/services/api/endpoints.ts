/**
 * API Endpoints Constants
 * Centralized endpoint definitions for the API
 */

export const API_ENDPOINTS = {
  TRASH: {
    MODELS: '/trash/models',
    LIST: '/trash',
    GET: (id: string) => `/trash/${encodeURIComponent(id)}`,
    MOVE: '/trash/move',
    RESTORE: (id: string) => `/trash/restore/${encodeURIComponent(id)}`,
    RESTORE_BULK: '/trash/restore-bulk',
    PERMANENT: (id: string) => `/trash/permanent/${encodeURIComponent(id)}`,
    PERMANENT_BULK: '/trash/permanent-bulk',
    EMPTY: '/trash/empty',
  },
  // ==================== AUTHENTICATION ====================
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgotPassword',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // ==================== ROLES & PERMISSIONS ====================
  ROLES: {
    LIST: (roleId: any) =>
      roleId ? `/roles/get?roleId=${roleId}` : '/roles/get',
    GET: (id: string) => `/roles/${id}`,
    CREATE: '/roles/create',
    UPDATE: (id: string) => `/roles/${id}`,
    DELETE: (id: string) => `/roles/${id}`,
  },
  STATE: {
    GET: (query: any) =>
      !query ? '/state' : `/state?type=district&state=${query}`,
  },
  //=========================Staff===========================

  STAFF: {
    LIST: '/staff',
    GET: (id: string) => `/staff/${id}`,
    CREATE: '/staff',
    UPDATE: (id: string) => `/staff/${id}`,
    DELETE: (id: string) => `/staff/${id}`,
  },
  //=========================Staff===========================

  CANDIDATES: {
    LIST: '/hr/candidates',
    GET: (id: string) => `/hr/candidates/byId/${id}`,
    CREATE: '/hr/candidates',
    UPDATE: (id: string) => `/hr/candidates/update/${id}`,
    DELETE: (id: string) => `/hr/candidates/delete/${id}`,
    DOWNLOAD: (id: string, doc: string) =>
      `/generate-pdf?userId=${id}&document=${doc}`,
    SEND_EMAIL: (id: string, doc: any) =>
      `/sendEmail?userId=${id}&document=${doc}`,
  },

  // ================Salary==============

  SALARY: {
    LIST: '/staff/salary',
    GET: (id: string) => `/staff/salary/getSalary/${id}`,
    CREATE: '/staff/salary',
    UPDATE: (staffId: string) => `/staff/salary/update/${staffId}`,
    GENERATE_PAYSLIP: '/staff/salary/generatePayslip',
    GENERATE_ALL_PAYSLIPS: '/staff/salary/generateAllPayslips',
    DELETE: (id: string) => `/salary/delete/${id}`,
  },
  LOCATION: {
    GET: '/staff/location/history',
  },
  HR_SETTINGS: {
    GET: '/hr-settings',
    CREATE: '/hr-settings',
    UPDATE: '/hr-settings',
    LEAVE_POLICIES: '/hr-settings/leave-policies',
    LEAVE_POLICY_UPDATE: (id: string) => `/hr-settings/leave-policies/${id}`,
    LEAVE_POLICY_DELETE: (id: string) => `/hr-settings/leave-policies/${id}`,
    SHIFTS: '/hr-settings/shifts',
    SHIFT_UPDATE: (id: string) => `/hr-settings/shifts/${id}`,
    SHIFT_DELETE: (id: string) => `/hr-settings/shifts/${id}`,
    WEEKLY_OFFS: '/hr-settings/weekly-offs',
    WEEKLY_OFF_UPDATE: (id: string) => `/hr-settings/weekly-offs/${id}`,
    WEEKLY_OFF_DELETE: (id: string) => `/hr-settings/weekly-offs/${id}`,
    HOLIDAYS: '/hr-settings/holidays',
    HOLIDAY_UPDATE: (id: string) => `/hr-settings/holidays/${id}`,
    HOLIDAY_DELETE: (id: string) => `/hr-settings/holidays/${id}`,
  },
  ATTENDANCE: {
    LIST: '/attendance',
    SUMMARY: '/attendance/summary',
    GET: (id: string) => `/attendance/${id}`,
    CREATE: '/attendance',
    UPDATE: (id: string) => `/attendance/${id}`,
    DELETE: (id: string) => `/attendance/${id}`,
    BY_EMPLOYEE: (employeeId: string) => `/attendance/employee/${employeeId}`,
  },

  LEAVE: {
    ALL: '/leave/all',
    UPDATE_STATUS: (id: string) => `/leave/${id}/status`,
  },

  //=========================CUSTOMERS===========================
  CUSTOMERS: {
    LIST: '/customers',
    GET: (id: string) => `/customers/${id}`,
    CREATE: '/customers',
    UPDATE: (id: string) => `/customers/${id}`,
    DELETE: (id: string) => `/customers/${id}`,
    CONVERT: (leadId: string) => `/customers/convert/${leadId}`,
  },

  //=========================LEADS===========================

  LEADS: {
    LIST: '/leads',
    GET: (id: string) => `/leads/${id}`,
    CREATE: '/leads',
    BULK_CREATE: '/leads/bulk',
    UPDATE: (id: string) => `/leads/${id}`,
    DELETE: (id: string) => `/leads/${id}`,
    ADD_ATTACHEMENTS: '/upload/leadAttachements',
  },

  //=========================QUOTATIONS===========================
  QUOTATIONS: {
    LIST: '/quotations',
    GET: (id: string) => `/quotations/${id}`,
    BY_ACTIVITY: (activityId: string) =>
      `/quotations/by-activity/${activityId}`,
    CREATE_MANUAL: '/quotations/manual',
    PDF: (id: string) => `/quotations/${id}/pdf`,
  },

  //=========================ACTIVITY LOGS===========================

  ACTIVITY_LOGS: {
    LIST: '/activityLogs/get',
    GET: (id: string) => `/activityLogs//${id}`,
    GET_BY_LEAD_ID: (id: string) => `/activityLogs/byLeadId/${id}`,
    CREATE: '/activityLogs/createWithMedia',
    UPDATE: (id: string) => `/activityLogs/${id}`,
    DELETE: (id: string) => `/activityLogs/${id}`,
  },

  //=========================PRODUCTS===========================
  PRODUCT: {
    TYPE: {
      GET: '/products/type',
      POST: '/products/type',
      UPDATE: (id: string) => `/products/type/${id}`,
      DELETE: (id: string) => `/products/type/${id}`,
    },
    SUBTYPE: {
      GET: '/products/subtype',
      POST: '/products/subtype',
      UPDATE: (id: string) => `/products/subtype/${id}`,
      DELETE: (id: string) => `/products/subtype/${id}`,
    },
    PRODUCT: {
      GET: '/products',
      GET_BY_ID: (id: string) => `/products/${id}`,
      POST: '/products',
      UPDATE: (id: string) => `/products/${id}`,
      DELETE: (id: string) => `/products/${id}`,
    },
  },

  //=========================TASKS===========================

  TASK: {
    LIST: '/task',
    CREATE: '/task/create',
    GET_BY_LEAD_ID: (id: string) => `/task/byLeadId/${id}`,
    GET_BY_ID: (id: string) => `/task/${id}`,
    DELETE_BY_ID: (id: string) => `/task/${id}`,
    UPDATE_BY_ID: (id: string) => `/task/${id}`,
    ADD_ATTACHEMENTS: (id: string) => `/task/addAttachement/${id}`,
  },

  // ==================== USER PROFILE ====================
  PROFILE: {
    GET: '/auth/profile',
    UPDATE: '/profile',
    CHANGE_PASSWORD: '/profile/change-password',
  },

  // ==================== USER MANAGEMENT ====================
  USERS: {
    LIST: '/users',
    GET: (id: string) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    ROLES: (id: string) => `/users/${id}/roles`,
    CLAIMS: (id: string) => `/users/${id}/claims`,
    RESET_PASSWORD: (id: string) => `/users/${id}/reset-password`,
  },

  // ==================== AUDIT LOGS ====================
  AUDIT: {
    LIST: '/audit',
    GET_BY_INVOICE: (invoiceId: string) => `/audit/invoice/${invoiceId}`,
  },

  // ==================== COUNTRIES & LANGUAGES ====================
  COUNTRIES: {
    LIST: '/countries',
    GET: (code: string) => `/countries/${code}`,
  },

  LANGUAGES: {
    LIST: '/languages',
    GET: (code: string) => `/languages/${code}`,
  },

  // ==================== PRODUCTS (GENERAL) ====================
  PRODUCTS: {
    LIST: '/products',
    GET: (id: string) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id: string) => `/products/${id}`,
    DELETE: (id: string) => `/products/${id}`,
    BY_CATEGORY: (category: string) => `/products/category/${category}`,
    FEATURED: '/products/featured',
    LOW_STOCK: '/products/low-stock',
    UPDATE_STOCK: (id: string) => `/products/${id}/stock`,
  },

  // ==================== DASHBOARD ====================
  DASHBOARD: {
    // stats
    GET_STATS: '/auth/getDashBoardStats',
    // Products

    // Orders
    ORDERS: {
      LIST: '/antd/orders',
      GET: (id: string) => `/antd/orders/${id}`,
      CREATE: '/antd/orders',
      UPDATE: (id: string) => `/antd/orders/${id}`,
      DELETE: (id: string) => `/antd/orders/${id}`,
      RECENT: '/antd/orders/recent',
    },

    // Sellers
    SELLERS: {
      LIST: '/antd/sellers',
      GET: (id: string) => `/antd/sellers/${id}`,
      CREATE: '/antd/sellers',
      UPDATE: (id: string) => `/antd/sellers/${id}`,
      DELETE: (id: string) => `/antd/sellers/${id}`,
      TOP: '/antd/sellers/top',
    },

    // Projects
    PROJECTS: {
      LIST: '/antd/projects',
      GET: (id: string) => `/antd/projects/${id}`,
      CREATE: '/antd/projects',
      UPDATE: (id: string) => `/antd/projects/${id}`,
      DELETE: (id: string) => `/antd/projects/${id}`,
    },

    // Clients
    CLIENTS: {
      LIST: '/antd/clients',
      GET: (id: string) => `/antd/clients/${id}`,
      CREATE: '/antd/clients',
      UPDATE: (id: string) => `/antd/clients/${id}`,
      DELETE: (id: string) => `/antd/clients/${id}`,
    },

    // Tasks
    TASKS: {
      LIST: '/antd/tasks',
      GET: (id: string) => `/antd/tasks/${id}`,
      CREATE: '/antd/tasks',
      UPDATE: (id: string) => `/antd/tasks/${id}`,
      DELETE: (id: string) => `/antd/tasks/${id}`,
    },

    // Campaign Ads
    CAMPAIGN_ADS: {
      LIST: '/antd/campaign-ads',
      GET: (id: string) => `/antd/campaign-ads/${id}`,
      CREATE: '/antd/campaign-ads',
      UPDATE: (id: string) => `/antd/campaign-ads/${id}`,
      DELETE: (id: string) => `/antd/campaign-ads/${id}`,
    },

    // Courses
    COURSES: {
      LIST: '/antd/courses',
      GET: (id: string) => `/antd/courses/${id}`,
    },

    RECOMMENDED_COURSES: {
      LIST: '/antd/recommended-courses',
      GET: (id: string) => `/antd/recommended-courses/${id}`,
    },

    // Exams
    EXAMS: {
      LIST: '/antd/exams',
      GET: (id: string) => `/antd/exams/${id}`,
    },

    // Study Statistics
    STUDY_STATISTICS: {
      LIST: '/antd/study-statistics',
      GET: (id: string) => `/antd/study-statistics/${id}`,
    },

    // Community Groups
    COMMUNITY_GROUPS: {
      LIST: '/antd/community-groups',
      GET: (id: string) => `/antd/community-groups/${id}`,
    },

    // Social Media
    SOCIAL_MEDIA_ACTIVITIES: {
      LIST: '/antd/social-media-activities',
      GET: (id: string) => `/antd/social-media-activities/${id}`,
    },

    SOCIAL_MEDIA_STATS: {
      LIST: '/antd/social-media-stats',
      GET: (id: string) => `/antd/social-media-stats/${id}`,
    },

    SCHEDULED_POSTS: {
      LIST: '/antd/scheduled-posts',
      GET: (id: string) => `/antd/scheduled-posts/${id}`,
    },

    // Bidding/Auction
    LIVE_AUCTIONS: {
      LIST: '/antd/live-auctions',
      GET: (id: string) => `/antd/live-auctions/${id}`,
    },

    AUCTION_CREATORS: {
      LIST: '/antd/auction-creators',
      GET: (id: string) => `/antd/auction-creators/${id}`,
    },

    BIDDING_TOP_SELLERS: {
      LIST: '/antd/bidding-top-sellers',
      GET: (id: string) => `/antd/bidding-top-sellers/${id}`,
    },

    BIDDING_TRANSACTIONS: {
      LIST: '/antd/bidding-transactions',
      GET: (id: string) => `/antd/bidding-transactions/${id}`,
    },

    // Logistics/Delivery
    TRUCKS: {
      LIST: '/antd/trucks',
      GET: (id: string) => `/antd/trucks/${id}`,
      CREATE: '/antd/trucks',
      UPDATE: (id: string) => `/antd/trucks/${id}`,
      DELETE: (id: string) => `/antd/trucks/${id}`,
    },

    TRUCK_DELIVERIES: {
      LIST: '/antd/truck-deliveries',
      GET: (id: string) => `/antd/truck-deliveries/${id}`,
      CREATE: '/antd/truck-deliveries',
      UPDATE: (id: string) => `/antd/truck-deliveries/${id}`,
      DELETE: (id: string) => `/antd/truck-deliveries/${id}`,
    },

    TRUCK_DELIVERY_REQUESTS: {
      LIST: '/antd/truck-delivery-requests',
      GET: (id: string) => `/antd/truck-delivery-requests/${id}`,
      CREATE: '/antd/truck-delivery-requests',
      UPDATE: (id: string) => `/antd/truck-delivery-requests/${id}`,
      DELETE: (id: string) => `/antd/truck-delivery-requests/${id}`,
    },

    DELIVERY_ANALYTICS: {
      LIST: '/antd/delivery-analytics',
      GET: (id: string) => `/antd/delivery-analytics/${id}`,
      CREATE: '/antd/delivery-analytics',
      UPDATE: (id: string) => `/antd/delivery-analytics/${id}`,
      DELETE: (id: string) => `/antd/delivery-analytics/${id}`,
    },
  },

  // ==================== MANTINE DASHBOARD ====================
  MANTINE: {
    // Chats
    CHATS: {
      LIST: '/mantine/chats',
      GET: (id: string) => `/mantine/chats/${id}`,
      CREATE: '/mantine/chats',
      UPDATE: (id: string) => `/mantine/chats/${id}`,
      DELETE: (id: string) => `/mantine/chats/${id}`,
    },

    CHAT_ITEMS: {
      LIST: '/mantine/chat-items',
      GET: (id: string) => `/mantine/chat-items/${id}`,
      CREATE: '/mantine/chat-items',
      DELETE: (id: string) => `/mantine/chat-items/${id}`,
    },

    // Files & Folders
    FILES: {
      LIST: '/mantine/files',
      GET: (id: string) => `/mantine/files/${id}`,
      CREATE: '/mantine/files',
      UPDATE: (id: string) => `/mantine/files/${id}`,
      DELETE: (id: string) => `/mantine/files/${id}`,
    },

    FOLDERS: {
      LIST: '/mantine/folders',
      GET: (id: string) => `/mantine/folders/${id}`,
      CREATE: '/mantine/folders',
      UPDATE: (id: string) => `/mantine/folders/${id}`,
      DELETE: (id: string) => `/mantine/folders/${id}`,
    },

    FILE_ACTIVITIES: {
      LIST: '/mantine/file-activities',
    },

    // Invoices
    INVOICES: {
      LIST: '/mantine/invoices',
      GET: (id: string) => `/mantine/invoices/${id}`,
      CREATE: '/mantine/invoices',
      UPDATE: (id: string) => `/mantine/invoices/${id}`,
      DELETE: (id: string) => `/mantine/invoices/${id}`,
    },

    // Kanban
    KANBAN_TASKS: {
      LIST: '/mantine/kanban-tasks',
      GET: (id: string) => `/mantine/kanban-tasks/${id}`,
      CREATE: '/mantine/kanban-tasks',
      UPDATE: (id: string) => `/mantine/kanban-tasks/${id}`,
      DELETE: (id: string) => `/mantine/kanban-tasks/${id}`,
    },

    // Orders
    ORDERS: {
      LIST: '/mantine/orders',
      GET: (id: string) => `/mantine/orders/${id}`,
      CREATE: '/mantine/orders',
      UPDATE: (id: string) => `/mantine/orders/${id}`,
      DELETE: (id: string) => `/mantine/orders/${id}`,
    },

    // Projects
    PROJECTS: {
      LIST: '/mantine/projects',
      GET: (id: string) => `/mantine/projects/${id}`,
      CREATE: '/mantine/projects',
      UPDATE: (id: string) => `/mantine/projects/${id}`,
      DELETE: (id: string) => `/mantine/projects/${id}`,
    },

    // Sales
    SALES: {
      LIST: '/mantine/sales',
      GET: (id: string) => `/mantine/sales/${id}`,
      CREATE: '/mantine/sales',
      UPDATE: (id: string) => `/mantine/sales/${id}`,
      DELETE: (id: string) => `/mantine/sales/${id}`,
    },

    // Stats
    STATS: {
      LIST: '/mantine/stats',
      GET: (id: string) => `/mantine/stats/${id}`,
      ALL: '/mantine/stats/all',
    },

    // Traffic
    TRAFFIC: {
      LIST: '/mantine/traffic',
    },

    // User Profile
    USER_PROFILE: {
      GET: '/mantine/user-profile',
    },
  },
} as const;
