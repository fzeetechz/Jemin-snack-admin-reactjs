import { trashService } from './trashService';
import apiClient, { apiRequest } from './api/apiClient';
import { API_ENDPOINTS } from './api/endpoints';

const taskService = () => {
  const getTasksList = async (params?: any) => {
    console.log(params);
    try {
      const queryParams = new URLSearchParams();
      if (params?.assignee) queryParams.append('assignee', params.assignee);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.timeFilter)
        queryParams.append('timeFilter', params.timeFilter);
      if (params?.name) queryParams.append('name', params.name);

      const url = queryParams.toString()
        ? `${API_ENDPOINTS.TASK.LIST}?${queryParams.toString()}`
        : API_ENDPOINTS.TASK.LIST;

      const response = await apiRequest.get(url);
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching activityLogs:', error);
      throw error;
    }
  };

  const createTask = async (payload: any) => {
    try {
      const response = await apiRequest.post(
        API_ENDPOINTS.TASK.CREATE,
        payload
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error creating Task:', error);
      throw error;
    }
  };
  const updateTask = async (id: any, payload: any) => {
    try {
      const response = await apiRequest.put(
        API_ENDPOINTS.TASK.UPDATE_BY_ID(id),
        payload
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error creating Task:', error);
      throw error;
    }
  };

  const getByLeadId = async (id: any) => {
    try {
      const response = await apiRequest.get(
        API_ENDPOINTS.TASK.GET_BY_LEAD_ID(id)
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching activityLogs:', error);
      throw error;
    }
  };

  const getById = async (id: any) => {
    try {
      const response = await apiRequest.get(API_ENDPOINTS.TASK.GET_BY_ID(id));
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching activityLogs:', error);
      throw error;
    }
  };

  const deleteTasks = async (id: any) => {
    try {
      const response = await trashService.move(id, 'task');
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching activityLogs:', error);
      throw error;
    }
  };

  const addAttachement = async (id: any, payload: any) => {
    const res = await apiClient.put(
      API_ENDPOINTS.TASK.ADD_ATTACHEMENTS(id),
      payload,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  };

  return {
    getTasksList,
    getByLeadId,
    createTask,
    getById,
    deleteTasks,
    updateTask,
    addAttachement,
  };
};

export default taskService;
