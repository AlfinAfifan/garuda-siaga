import axiosInstance from '@/providers/axios-instance';

interface ParamsTkk {
  search?: string;
  page?: number;
  limit?: number;
}

export interface TkkPayload {
  member_id: string;
  type_tkk_id: string;
  examiner_name: string;
  examiner_address: string;
  examiner_position: string;
}

export const getSummary = async () => {
  try {
    const response = await axiosInstance(`/tkk`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching TKK summary:', error);
    throw error.response?.data;
  }
};

export const getTkk = async (params: ParamsTkk) => {
  try {
    const response = await axiosInstance.get('/tkk/list', { params });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching TKK:', error);
    throw error.response?.data;
  }
};

export const createTkk = async (data: TkkPayload) => {
  try {
    const response = await axiosInstance.post('/tkk/list', data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating TKK:', error);
    throw error.response?.data;
  }
};

export const deleteTkk = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/tkk/list/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting TKK:', error);
    throw error.response?.data;
  }
};

export const exportTkk = async () => {
  try {
    const response = await axiosInstance.get('/tkk/export');
    return response.data;
  } catch (error: any) {
    console.error('Error exporting TKK data:', error);
    throw error.response?.data;
  }
};
