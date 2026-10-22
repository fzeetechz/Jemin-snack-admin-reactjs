import { useState } from 'react';
import { trashService } from './trashService';
import apiClient from './api/apiClient';
import { API_ENDPOINTS } from './api/endpoints';

const useProducts = () => {
  const [types, setTypes] = useState([]);
  const [products, setProducts] = useState([]);
  // ================= TYPES =================

  const getTypes = async (params?: any) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.PRODUCT.TYPE.GET, {
        params,
      });
      if (res.data.success) {
      }
      setTypes(res.data.data);
      return res.data;
    } catch (error) {
      console.log(error);
    }
  };

  const createTypes = async (payload?: any) => {
    try {
      const res = await apiClient.post(
        API_ENDPOINTS.PRODUCT.TYPE.POST,
        payload
      );
      if (res.data.success) getTypes();
      return res.data;
    } catch (error) {
      console.log(error);
    }
  };

  const updateTypes = async (payload: any, id: string) => {
    try {
      const res = await apiClient.put(
        API_ENDPOINTS.PRODUCT.TYPE.UPDATE(id),
        payload
      );
      if (res.data.success) getTypes();
      return res.data;
    } catch (error) {
      console.log(error);
    }
  };

  const deleteTypes = (id: string) => trashService.move(id, 'productType');

  // ================= SUBTYPES =================

  const getSubTypes = async (params?: any) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.PRODUCT.SUBTYPE.GET, {
        params,
      });
      return res.data;
    } catch (error) {
      console.log(error);
    }
  };

  const createSubTypes = async (payload?: any) => {
    try {
      const res = await apiClient.post(
        API_ENDPOINTS.PRODUCT.SUBTYPE.POST,
        payload
      );
      return res.data;
    } catch (error) {
      console.log(error);
    }
  };

  const updateSubTypes = async (payload: any, id: string) => {
    try {
      const res = await apiClient.put(
        API_ENDPOINTS.PRODUCT.SUBTYPE.UPDATE(id),
        payload
      );
      return res.data;
    } catch (error) {
      console.log(error);
    }
  };

  const deleteSubTypes = (id: string) => trashService.move(id, 'productSubType');

  // ================= PRODUCTS =================

  const getProducts = async (params?: any) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.PRODUCT.PRODUCT.GET, {
        params,
      });
      if (res.data.success) setProducts(res.data.data);
      return res.data;
    } catch (error) {
      console.log(error);
    }
  };

  const createProducts = async (payload?: any) => {
    try {
      const res = await apiClient.post(
        API_ENDPOINTS.PRODUCT.PRODUCT.POST,
        payload,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (res.data.success) getProducts();
      return res.data;
    } catch (error) {
      console.log(error);
    }
  };

  const updateProducts = async (payload: any, id: string) => {
    try {
      const res = await apiClient.put(
        API_ENDPOINTS.PRODUCT.PRODUCT.UPDATE(id),
        payload,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (res.data.success) getProducts();
      return res.data;
    } catch (error) {
      console.log(error);
    }
  };

  const deleteProducts = (id: string) => trashService.move(id, 'product');

  return {
    types,
    setTypes,
    products,
    setProducts,
    getTypes,
    createTypes,
    updateTypes,
    deleteTypes,
    getProducts,
    createProducts,
    updateProducts,
    deleteProducts,

    getSubTypes,
    createSubTypes,
    updateSubTypes,
    deleteSubTypes,
  };
};

export default useProducts;
