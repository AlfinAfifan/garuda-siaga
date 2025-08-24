import axiosInstance from '@/providers/axios-instance';

interface ParamsTku {
  search?: string;
  page?: number;
  limit?: number;
}

export interface MulaPayload {
  member_id: string;
}

export interface BantuPayload {
    id: string
}

export const getSummary = async () => {
  try {
    const response = await axiosInstance.get('/tku');
    return response.data
  } catch (error: any) {
    console.error('Failed to fetch summary:', error);
    throw error.response?.data
  }
};

export const getMula = async (params: ParamsTku) => {
  try {
    const response = await axiosInstance.get('/tku/mula', {
      params,
    });

    const data = response.data;
    return data;
  } catch (error: any) {
    console.error('Failed to fetch Mula:', error);
    throw error.response?.data
  }
};

export const getBantu = async (params: ParamsTku) => {
  try {
    const response = await axiosInstance.get('/tku/bantu', {
      params,
    });

    const data = response.data;
    return data;
  } catch (error: any) {
    console.error('Failed to fetch Bantu:', error);
    throw error.response?.data
  }
};  

export const getTata = async (params: ParamsTku) => {
  try {
    const response = await axiosInstance.get('/tku/tata', {
      params,
    });

    const data = response.data;
    return data;
  } catch (error: any) {
    console.error('Failed to fetch Tata:', error);
    throw error.response?.data
  }
};

export const createMula = async (data: MulaPayload) => {
  try {
    const response = await axiosInstance.post('/tku/mula', data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to create Mula:', error);
    throw error.response?.data
  }
};

export const createBantu = async (data: BantuPayload) => {
  try {
    const response = await axiosInstance.post('/tku/bantu', data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to create Bantu:', error);
    throw error.response?.data
  }
};

export const createTata = async (data: BantuPayload) => {
  try {
    const response = await axiosInstance.post('/tku/tata', data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to create Tata:', error);
    throw error.response?.data
  }
};

export const deleteMula = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/tku/mula/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to delete Mula:', error);
    throw error.response?.data
  }
};

export const deleteBantu = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/tku/bantu/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to delete Bantu:', error);
    throw error.response?.data
  }
};

export const deleteTata = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/tku/tata/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to delete Tata:', error);
    throw error.response?.data
  }
};

export const exportTku = async () => {
  try {
    const response = await axiosInstance.get('/tku/export');
    return response.data;
  } catch (error: any) {
    console.error('Error exporting TKU data:', error);
    throw error.response?.data;
  }
};