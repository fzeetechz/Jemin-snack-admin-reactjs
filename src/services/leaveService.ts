import { apiRequest } from './api/apiClient';
import { API_ENDPOINTS } from './api/endpoints';

const leaveService = () => {
  const getAllLeaves = async (params?: { status?: string; type?: string }) => {
    try {
      return await apiRequest.get(API_ENDPOINTS.LEAVE.ALL, { params });
    } catch (error) {
      throw error;
    }
  };

  const updateLeaveStatus = async (id: string, status: string) => {
    try {
      return await apiRequest.patch(API_ENDPOINTS.LEAVE.UPDATE_STATUS(id), {
        status,
      });
    } catch (error) {
      throw error;
    }
  };

  return { getAllLeaves, updateLeaveStatus };
};

export default leaveService;
