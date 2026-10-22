import { trashService } from './trashService';
import { apiRequest } from './api/apiClient';
import { API_ENDPOINTS } from './api/endpoints';

const activityLogservices = () => {
  const getactivityLogs = async (params?: any) => {
    try {
      const response = await apiRequest.get(API_ENDPOINTS.ACTIVITY_LOGS.LIST, {
        params: params,
      });
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching activityLogs:', error);
      throw error;
    }
  };

  const creatactivityLogs = async (payload: any) => {
    try {
      const response = await apiRequest.post(
        API_ENDPOINTS.ACTIVITY_LOGS.CREATE,
        payload,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching activityLogs:', error);
      throw error;
    }
  };

  const updateactivityLogs = async (id: any, payload: any) => {
    try {
      const response = await apiRequest.put(
        API_ENDPOINTS.ACTIVITY_LOGS.UPDATE(id),
        payload
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching activityLogs:', error);
      throw error;
    }
  };

  const deleteactivityLogs = async (id: any) => {
    try {
      const response = await trashService.move(id, 'activityLog');
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching activityLogs:', error);
      throw error;
    }
  };

  const getById = async (id: any) => {
    try {
      const response = await apiRequest.get(
        API_ENDPOINTS.ACTIVITY_LOGS.GET(id)
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching activityLogs:', error);
      throw error;
    }
  };
  const getByActivityId = async (id: any) => {
    try {
      const response = await apiRequest.get(
        API_ENDPOINTS.ACTIVITY_LOGS.GET_BY_LEAD_ID(id)
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching activityLogs:', error);
      throw error;
    }
  };

  return {
    creatactivityLogs,
    getactivityLogs,
    updateactivityLogs,
    getById,
    deleteactivityLogs,
    getByActivityId,
  };
};

export default activityLogservices;
