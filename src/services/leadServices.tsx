import { trashService } from './trashService';
import { apiRequest } from './api/apiClient';
import { API_ENDPOINTS } from './api/endpoints';

const leadServices = () => {
  const getLeads = async () => {
    try {
      const response = await apiRequest.get(API_ENDPOINTS.LEADS.LIST);
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching Leads:', error);
      throw error;
    }
  };

  const creatLeads = async (payload: any) => {
    try {
      const response = await apiRequest.post(
        API_ENDPOINTS.LEADS.CREATE,
        payload
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  };

  const updateLeads = async (id: any, payload: any) => {
    try {
      const response = await apiRequest.put(
        API_ENDPOINTS.LEADS.UPDATE(id),
        payload
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  };

  const deleteLeads = async (id: any) => {
    try {
      const response = await trashService.move(id, 'lead');
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  };

  const getById = async (id: any) => {
    try {
      const response = await apiRequest.get(API_ENDPOINTS.LEADS.GET(id));
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  };

  const bulkCreateLeads = async (leads: any[]) => {
    try {
      const response = await apiRequest.post(API_ENDPOINTS.LEADS.BULK_CREATE, {
        leads,
      });
      return response;
    } catch (error) {
      console.error('Error bulk importing leads:', error);
      throw error;
    }
  };

  const addAttachements = async (payload: FormData) => {
    try {
      const response = await apiRequest.post(
        API_ENDPOINTS.LEADS.ADD_ATTACHEMENTS,
        payload,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response;
    } catch (error) {
      console.error('Error uploading attachments:', error);
      throw error;
    }
  };

  return {
    creatLeads,
    getLeads,
    updateLeads,
    getById,
    deleteLeads,
    bulkCreateLeads,
    addAttachements,
  };
};

export default leadServices;
