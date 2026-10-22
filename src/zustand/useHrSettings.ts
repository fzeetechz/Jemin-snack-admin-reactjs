import { trashService } from '../services/trashService';
import apiClient from 'src/services/api/apiClient';
import { API_ENDPOINTS } from '../services/api/endpoints';
import { create } from 'zustand';

type HrSettingsApi = {
  _id?: string;
  workingDaysPerMonth?: number;
  workingHoursPerDay?: number;
  overtimeEnabled?: boolean;
  overtimeRate?: number;
  latePenaltyPerMinute?: number;
  halfDayThreshold?: number;
  fullDayThreshold?: number;
  salaryCalculationType?: 'FULL_MONTH' | 'WORKING_DAYS';
};

type ShiftApi = {
  _id?: string;
  name: string;
  startTime: string;
  endTime: string;
  breakTime?: number;
  graceTime?: number;
  isNightShift?: boolean;
  isActive?: boolean;
};

type WeeklyOffApi = {
  _id?: string;
  name?: string;
  days?: string[];
  monthlyWeekOffs?: Array<{
    day: string;
    weeks: number[];
  }>;
  isActive?: boolean;
};

type LeavePolicyApi = {
  _id?: string;
  name?: string;
  roleIds?: Array<string | { _id: string; name: string }>;
  casualLeave?: number;
  sickLeave?: number;
  paidLeave?: number;
  monthlyLimit?: number;
  carryForward?: boolean;
  maxCarryForward?: number;
  isActive?: boolean;
};

type HolidayApi = {
  _id?: string;
  name: string;
  date: string;
  isActive?: boolean;
};

type UseHrSettingsState = {
  hrSettings: HrSettingsApi | null;
  shifts: ShiftApi[];
  weeklyOffs: WeeklyOffApi[];
  holidays: HolidayApi[];
  leavePolicies: LeavePolicyApi[];
  loading: boolean;
  fetchAll: () => Promise<void>;
  saveSettings: (payload: HrSettingsApi) => Promise<any>;
  createShift: (payload: ShiftApi) => Promise<any>;
  updateShift: (id: string, payload: ShiftApi) => Promise<any>;
  deleteShift: (id: string) => Promise<any>;
  createWeeklyOff: (payload: WeeklyOffApi) => Promise<any>;
  updateWeeklyOff: (id: string, payload: WeeklyOffApi) => Promise<any>;
  deleteWeeklyOff: (id: string) => Promise<any>;
  createHoliday: (payload: HolidayApi) => Promise<any>;
  updateHoliday: (id: string, payload: HolidayApi) => Promise<any>;
  deleteHoliday: (id: string) => Promise<any>;
  createLeavePolicy: (payload: LeavePolicyApi) => Promise<any>;
  updateLeavePolicy: (id: string, payload: LeavePolicyApi) => Promise<any>;
  deleteLeavePolicy: (id: string) => Promise<any>;
};

const useHrSettings = create<UseHrSettingsState>((set) => ({
  hrSettings: null,
  shifts: [],
  weeklyOffs: [],
  holidays: [],
  leavePolicies: [],
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const [
        settingsRes,
        shiftsRes,
        weeklyOffsRes,
        holidaysRes,
        leavePoliciesRes,
      ] = await Promise.all([
        apiClient.get(API_ENDPOINTS.HR_SETTINGS.GET),
        apiClient.get(API_ENDPOINTS.HR_SETTINGS.SHIFTS),
        apiClient.get(API_ENDPOINTS.HR_SETTINGS.WEEKLY_OFFS),
        apiClient.get(API_ENDPOINTS.HR_SETTINGS.HOLIDAYS),
        apiClient.get(API_ENDPOINTS.HR_SETTINGS.LEAVE_POLICIES),
      ]);

      set({
        hrSettings: settingsRes.data.data,
        shifts: shiftsRes.data.data ?? [],
        weeklyOffs: weeklyOffsRes.data.data ?? [],
        holidays: holidaysRes.data.data ?? [],
        leavePolicies: leavePoliciesRes.data.data ?? [],
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  saveSettings: async (payload) => {
    const response = await apiClient.put(
      API_ENDPOINTS.HR_SETTINGS.UPDATE,
      payload
    );
    set({ hrSettings: response.data.data });
    return response.data;
  },

  createShift: async (payload) => {
    const response = await apiClient.post(
      API_ENDPOINTS.HR_SETTINGS.SHIFTS,
      payload
    );
    set((state) => ({ shifts: [response.data.data, ...state.shifts] }));
    return response.data;
  },
  updateShift: async (id, payload) => {
    const response = await apiClient.put(
      API_ENDPOINTS.HR_SETTINGS.SHIFT_UPDATE(id),
      payload
    );
    set((state) => ({
      shifts: state.shifts.map((shift) =>
        shift._id === id ? response.data.data : shift
      ),
    }));
    return response.data;
  },
  deleteShift: async (id) => {
    const response = { data: await trashService.move(id, 'shift') };
    set((state) => ({
      shifts: state.shifts.filter((shift) => shift._id !== id),
    }));
    return response.data;
  },

  createWeeklyOff: async (payload) => {
    const response = await apiClient.post(
      API_ENDPOINTS.HR_SETTINGS.WEEKLY_OFFS,
      payload
    );
    set((state) => ({ weeklyOffs: [response.data.data, ...state.weeklyOffs] }));
    return response.data;
  },
  updateWeeklyOff: async (id, payload) => {
    const response = await apiClient.put(
      API_ENDPOINTS.HR_SETTINGS.WEEKLY_OFF_UPDATE(id),
      payload
    );
    set((state) => ({
      weeklyOffs: state.weeklyOffs.map((item) =>
        item._id === id ? response.data.data : item
      ),
    }));
    return response.data;
  },
  deleteWeeklyOff: async (id) => {
    const response = { data: await trashService.move(id, 'weeklyOff') };
    set((state) => ({
      weeklyOffs: state.weeklyOffs.filter((item) => item._id !== id),
    }));
    return response.data;
  },

  createHoliday: async (payload) => {
    const response = await apiClient.post(
      API_ENDPOINTS.HR_SETTINGS.HOLIDAYS,
      payload
    );
    set((state) => ({
      holidays: [...state.holidays, response.data.data].sort((left, right) =>
        left.date.localeCompare(right.date)
      ),
    }));
    return response.data;
  },
  updateHoliday: async (id, payload) => {
    const response = await apiClient.put(
      API_ENDPOINTS.HR_SETTINGS.HOLIDAY_UPDATE(id),
      payload
    );
    set((state) => ({
      holidays: state.holidays
        .map((item) => (item._id === id ? response.data.data : item))
        .sort((left, right) => left.date.localeCompare(right.date)),
    }));
    return response.data;
  },
  deleteHoliday: async (id) => {
    const response = { data: await trashService.move(id, 'holiday') };
    set((state) => ({
      holidays: state.holidays.filter((item) => item._id !== id),
    }));
    return response.data;
  },

  createLeavePolicy: async (payload) => {
    const response = await apiClient.post(
      API_ENDPOINTS.HR_SETTINGS.LEAVE_POLICIES,
      payload
    );
    set((state) => ({
      leavePolicies: [response.data.data, ...state.leavePolicies],
    }));
    return response.data;
  },
  updateLeavePolicy: async (id, payload) => {
    const response = await apiClient.put(
      API_ENDPOINTS.HR_SETTINGS.LEAVE_POLICY_UPDATE(id),
      payload
    );
    set((state) => ({
      leavePolicies: state.leavePolicies.map((item) =>
        item._id === id ? response.data.data : item
      ),
    }));
    return response.data;
  },
  deleteLeavePolicy: async (id) => {
    const response = { data: await trashService.move(id, 'leavePolicy') };
    set((state) => ({
      leavePolicies: state.leavePolicies.filter((item) => item._id !== id),
    }));
    return response.data;
  },
}));

export default useHrSettings;
