import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const getVendors = () => api.get('/vendors');
export const createVendor = (data) => api.post('/vendors', data);
export const updateVendor = (vendorId, data) => api.put(`/vendors/${vendorId}`, data);
export const deleteVendor = (vendorId) => api.delete(`/vendors/${vendorId}`);

export const getRfps = () => api.get('/rfps');
export const createRfp = (data) => api.post('/rfps', data);
export const updateRfp = (rfpId, data) => api.put(`/rfps/${rfpId}`, data);
export const deleteRfp = (rfpId) => api.delete(`/rfps/${rfpId}`);
export const sendRfpToVendors = (rfpId, selectedVendors) => api.post(`/rfps/${rfpId}/send`, { selectedVendors });
export const evaluateRfp = (rfpId) => api.post(`/rfps/${rfpId}/evaluate`);

export const getProposals = (rfpId) => api.get(`/proposals/${rfpId}`);
export const compareProposals = (rfpId, proposalIds) => api.post(`/proposals/${rfpId}/compare`, { proposalIds });

export const pollEmails = () => api.post('/emails/poll');

export default api;