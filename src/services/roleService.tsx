import { trashService } from './trashService';
import { apiRequest } from './api/apiClient';
import { API_ENDPOINTS } from './api/endpoints';

const roleService = () => {
  const getRoles = async (params?: any) => {
    try {
      const response = await apiRequest.get(API_ENDPOINTS.ROLES.LIST(params));
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  };

  const createRoles = async (roleData: any) => {
    try {
      const response = await apiRequest.post(
        API_ENDPOINTS.ROLES.CREATE,
        roleData
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  };

  const updateRoles = async (id: string, roleData: any) => {
    try {
      const response = await apiRequest.put(
        `${API_ENDPOINTS.ROLES.UPDATE(id)}`,
        roleData
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  };

  const deleteRoles = async (id: string) => {
    try {
      const response = await trashService.move(id, 'role');
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  };

  return { getRoles, createRoles, updateRoles, deleteRoles };
};

export default roleService;
