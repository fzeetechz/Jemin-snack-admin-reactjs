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

  const deleteStaff = async (id: any) => {
    try {
      const response = await trashService.move(id, 'staff');
      return response;
    } catch (error) {
      console.error('Error fetching Staff:', error);
      throw error;
    }
  };

  return { getStaff, createStaff, updateStaff, deleteStaff };
};

export default staffService;
