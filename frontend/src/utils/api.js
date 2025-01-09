import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001/api/v1';

export const api = {
    async registerModel(modelData) {
        const response = await axios.post(`${API_BASE_URL}/models/`, modelData);
        return response.data;
    },

    async getModel(modelId) {
        const response = await axios.get(`${API_BASE_URL}/models/${modelId}`);
        return response.data;
    },

    async getModels() {
        const response = await axios.get(`${API_BASE_URL}/models`);
        return response.data;
    },

    async getContractStatus() {
        const response = await axios.get(`${API_BASE_URL}/status`);
        return response.data;
    },

    async updateModel(modelId, data) {
        const response = await axios.put(`${API_BASE_URL}/models/${modelId}`, data);
        return response.data;
    }
};