import { trashService } from './trashService';
import { apiRequest } from './api/apiClient';
import { API_ENDPOINTS } from './api/endpoints';

const useCustomerService = () => {
  const getCustomers = async (params?: Record<string, any>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest.get(`${API_ENDPOINTS.CUSTOMERS.LIST}${query}`);
  };

  const getCustomerById = async (id: string) =>
    apiRequest.get(API_ENDPOINTS.CUSTOMERS.GET(id));

  const createCustomer = async (payload: any) =>
    apiRequest.post(API_ENDPOINTS.CUSTOMERS.CREATE, payload);

  const updateCustomer = async (id: string, payload: any) =>
    apiRequest.put(API_ENDPOINTS.CUSTOMERS.UPDATE(id), payload);

  const deleteCustomer = async (id: string) =>
    trashService.move(id, 'customer');

  const convertLeadToCustomer = async (leadId: string, payload?: any) =>
    apiRequest.post(API_ENDPOINTS.CUSTOMERS.CONVERT(leadId), payload || {});

  return {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    convertLeadToCustomer,
  };
};

export default useCustomerService;
