import {
  Building2,
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  FileCheck2,
  Headphones,
  LayoutDashboard,
  MapPin,
  Package,
  Phone,
  Receipt,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  UserRoundSearch,
  UsersRound,
  Wallet,
  ListTodo,
  ContactRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PATH_CRM } from '../../config/permissions';

interface PageMeta {
  title: string;
  section: string;
  description: string;
  icon: LucideIcon;
}

const pages: Record<string, PageMeta> = {
  [PATH_CRM.dashboard]: {
    title: 'Overview',
    section: 'Workspace',
    description: 'A clear view of your team, sales and daily activity.',
    icon: LayoutDashboard,
  },
  [PATH_CRM.leads]: {
    title: 'Leads',
    section: 'Sales',
    description: 'Build relationships and move every opportunity forward.',
    icon: ContactRound,
  },
  [PATH_CRM.customers]: {
    title: 'Customers',
    section: 'Sales',
    description: 'Your customer relationships, all in one place.',
    icon: UsersRound,
  },
  [PATH_CRM.activities.leads]: {
    title: 'Lead activities',
    section: 'Sales',
    description: 'Stay on top of conversations and follow-ups.',
    icon: CalendarDays,
  },
  [PATH_CRM.activities.tasks]: {
    title: 'Tasks',
    section: 'Sales',
    description: 'Organize your work and keep the next step in sight.',
    icon: ListTodo,
  },
  [PATH_CRM.calls]: {
    title: 'Call logs',
    section: 'Communication',
    description: 'Review conversations, call outcomes and team activity.',
    icon: Phone,
  },
  [PATH_CRM.recordings]: {
    title: 'Recordings',
    section: 'Communication',
    description: 'Find and listen to your recorded conversations.',
    icon: Headphones,
  },
  [PATH_CRM.products]: {
    title: 'Products',
    section: 'Sales',
    description: 'Manage your catalogue, categories and pricing.',
    icon: Package,
  },
  [PATH_CRM.quotations]: {
    title: 'Orders',
    section: 'Sales',
    description: 'Keep every order and its progress in view.',
    icon: Receipt,
  },
  [PATH_CRM.locations]: {
    title: 'Staff locations',
    section: 'Team',
    description: 'Explore staff routes, stops and daily movement.',
    icon: MapPin,
  },
  [PATH_CRM.hr.Attendance]: {
    title: 'Attendance',
    section: 'Human resources',
    description: 'Track working days, check-ins and attendance.',
    icon: CalendarCheck2,
  },
  [PATH_CRM.hr.leave]: {
    title: 'Leave management',
    section: 'Human resources',
    description: 'Manage time off and keep your team in sync.',
    icon: CalendarDays,
  },
  [PATH_CRM.hr.salarySetting]: {
    title: 'Salary settings',
    section: 'Human resources',
    description: 'Manage employee compensation and salary details.',
    icon: Wallet,
  },
  [PATH_CRM.hr.payslip]: {
    title: 'Pay slips',
    section: 'Human resources',
    description: 'Review and manage employee pay slips.',
    icon: FileCheck2,
  },
  [PATH_CRM.hr.candidate]: {
    title: 'Candidates',
    section: 'Human resources',
    description: 'Bring your hiring pipeline into focus.',
    icon: UserRoundSearch,
  },
  [PATH_CRM.hr.Settings]: {
    title: 'HR configuration',
    section: 'Human resources',
    description: 'Shape your company policies and team settings.',
    icon: Building2,
  },
  [PATH_CRM.settings.users]: {
    title: 'Staff',
    section: 'Administration',
    description: 'Manage the people who make your business work.',
    icon: UsersRound,
  },
  [PATH_CRM.settings.roles]: {
    title: 'Roles & permissions',
    section: 'Administration',
    description: 'Keep the right access with the right people.',
    icon: ShieldCheck,
  },
  [PATH_CRM.config]: {
    title: 'Configurations',
    section: 'Administration',
    description: 'Keep your workspace settings organized.',
    icon: SlidersHorizontal,
  },
  [PATH_CRM.support]: {
    title: 'Support',
    section: 'Workspace',
    description: 'Find help for your workspace.',
    icon: Headphones,
  },
  '/crm/contacts': {
    title: 'Contracts',
    section: 'Sales',
    description: 'Organize agreements and customer contracts.',
    icon: ClipboardList,
  },
  '/user-profile': {
    title: 'My account',
    section: 'Workspace',
    description: 'Your profile, preferences and account details.',
    icon: UserRound,
  },
};

export const getPageMeta = (pathname: string): PageMeta => {
  const key = Object.keys(pages)
    .sort((a, b) => b.length - a.length)
    .find((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (key) return pages[key];
  const label =
    pathname.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ') ||
    'Workspace';
  return {
    title: label,
    section: 'Workspace',
    description: 'Your Jemini Snacks business workspace.',
    icon: Settings2,
  };
};
