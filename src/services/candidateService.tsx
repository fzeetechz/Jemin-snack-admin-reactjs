import { trashService } from './trashService';
import axios from 'axios';
import { apiRequest, BASEURL } from './api/apiClient';
import { API_ENDPOINTS } from './api/endpoints';
import { useState } from 'react';

const candidateService = () => {
  const [downloading, setIsDownloading] = useState(false);
  const getCandidates = async (params?: any) => {
    try {
      const response = await apiRequest.get(API_ENDPOINTS.CANDIDATES.LIST, {
        params: params,
      });
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching activityLogs:', error);
      throw error;
    }
  };
  const createCandidates = async (payload?: any) => {
    try {
      const response = await apiRequest.post(
        API_ENDPOINTS.CANDIDATES.CREATE,
        payload
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching activityLogs:', error);
      throw error;
    }
  };
  const getById = async (id?: any) => {
    try {
      const response = await apiRequest.get(API_ENDPOINTS.CANDIDATES.GET(id));
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching activityLogs:', error);
      throw error;
    }
  };
  const updateCandidate = async (id?: any, payload?: any) => {
    try {
      const response = await apiRequest.patch(
        API_ENDPOINTS.CANDIDATES.UPDATE(id),
        payload
      );
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching activityLogs:', error);
      throw error;
    }
  };
  const deleteCandidate = async (id?: any) => {
    try {
      const response = await trashService.move(id, 'candidate');
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error fetching activityLogs:', error);
      throw error;
    }
  };

  const downloadPdf = async (id: any, doc: string) => {
    setIsDownloading(true);
    try {
      const response = await axios.get(
        `${BASEURL}${API_ENDPOINTS.CANDIDATES.DOWNLOAD(id, doc)}`,
        {
          responseType: 'blob', // 🔥 MOST IMPORTANT
        }
      );

      const url = window.URL.createObjectURL(response.data);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `candidate_${id}.pdf`);

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const sendEmail = async (id: any, doc: any, onProgress: any) => {
    console.log(doc);
    try {
      const response = await axios.post(
        `${BASEURL}${API_ENDPOINTS.CANDIDATES.SEND_EMAIL(id, doc)}`,
        {}, // agar body nahi hai to empty object
        {
          onUploadProgress: (e) => {
            if (e.total) {
              const percent = Math.round((e.loaded * 100) / e.total);
              console.log('Sending Progress:', percent + '%');

              // optional callback (React UI ke liye)
              if (onProgress) onProgress(percent);
            }
          },

          onDownloadProgress: (e) => {
            if (e.total) {
              const percent = Math.round((e.loaded * 100) / e.total);
              console.log('Response Progress:', percent + '%');
            }
          },
        }
      );

      console.log('Final Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error sending email:', error?.response || error.message);
      throw error;
    }
  };

  return {
    getCandidates,
    createCandidates,
    getById,
    updateCandidate,
    downloadPdf,
    setIsDownloading,
    downloading,
    sendEmail,
    deleteCandidate,
  };
};

export default candidateService;
