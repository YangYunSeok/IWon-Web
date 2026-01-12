import axios from 'axios';

const BASE_URL = '/api/employee-wallet';

const EmployeeWalletApi = {
  fetchWallets: async (params) => {
    const response = await axios.get(`${BASE_URL}/list`, { params });
    return response.data;
  },

  fetchWalletDetails: async (id) => {
    const response = await axios.get(`${BASE_URL}/detail/${id}`);
    return response.data;
  },

  updateWallet: async (id, data) => {
    const response = await axios.put(`${BASE_URL}/update/${id}`, data);
    return response.data;
  },
};

export default EmployeeWalletApi;