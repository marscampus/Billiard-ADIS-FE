import axios from 'axios';
import config from '../config';
const api = axios.create({
    baseURL: config.apiUrl,
    withCredentials: true,
    withXSRFToken: true,
    validateStatus: () => true,
});
api.get('/sanctum/csrf-cookie');
export const login = async (data) => {
    return api.post('/auth/login', data);
};
export const register = async (data) => {
    return api.post('/auth/register', data);
};
export const authenticated = async () => {
    return api.get('/auth');
};
export default api;
