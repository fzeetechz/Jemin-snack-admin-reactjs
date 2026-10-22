import { trashService } from './trashService';
import { apiRequest } from './api/apiClient';
import { API_ENDPOINTS } from './api/endpoints';

const attendanceService = () => {
  const getAttendanceList = async (params?: Record<string, string>) => {
    const queryParams = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.ATTENDANCE.LIST}?${queryParams.toString()}`
      : API_ENDPOINTS.ATTENDANCE.LIST;

    return apiRequest.get(url);
  };

  const getAttendanceSummary = async (params?: Record<string, string>) => {
    const queryParams = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.ATTENDANCE.SUMMARY}?${queryParams.toString()}`
      : API_ENDPOINTS.ATTENDANCE.SUMMARY;

    return apiRequest.get(url);
  };

  const updateAttendance = async (
    id: string,
    payload: Record<string, unknown>
  ) => {
    return apiRequest.put(API_ENDPOINTS.ATTENDANCE.UPDATE(id), payload);
  };

  const deleteAttendance = async (id: string) => {
    return trashService.move(id, 'attendance');
  };

  return {
    getAttendanceList,
    getAttendanceSummary,
    updateAttendance,
    deleteAttendance,
  };
};

export default attendanceService;
