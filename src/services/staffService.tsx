import { trashService } from './trashService';
import { apiRequest } from './api/apiClient';
import { API_ENDPOINTS } from './api/endpoints';

const staffService = () => {
  const getStaff = async (params?: Record<string, any>) => {
    try {
      const response = await apiRequest.get(API_ENDPOINTS.STAFF.LIST, {
        params,
      });
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching Staff:', error);
      throw error;
    }
  };

  const createStaff = async (payload: any) => {
    try {
      const response = await apiRequest.post(
        API_ENDPOINTS.STAFF.CREATE,
        payload
      );
      return response;
    } catch (error) {
      console.error('Error fetching Staff:', error);
      throw error;
    }
  };

  const updateStaff = async (id: any, payload: any) => {
    try {
      const response = await apiRequest.put(
        API_ENDPOINTS.STAFF.UPDATE(id),
        payload
      );
      return response;
    } catch (error) {
      console.error('Error fetching Staff:', error);
      throw error;
    }
  };

  const changeStaffPassword = async (id: string, password: string) => {
    try {
      return await apiRequest.put(API_ENDPOINTS.STAFF.UPDATE(id), { password });
    } catch (error) {
      console.error('Error changing staff password:', error);
      throw error;
    }
  };

  const showStaffPassword = async (id: string) => {
    try {
      return await apiRequest.get(API_ENDPOINTS.STAFF.SHOW_PASSWORD(id));
    } catch (error) {
      console.error('Error retrieving staff password:', error);
      throw error;
    }
  };

  const deleteStaff = async (id: any) => {
    try {
      const response = await trashService.move(id, 'staff');
      return response;
    } catch (error) {
      console.error('Error fetching Staff:', error);
      throw error;
    }
  };

  return {
    getStaff,
    createStaff,
    updateStaff,
    changeStaffPassword,
    showStaffPassword,
    deleteStaff,
  };
};

export default staffService;
