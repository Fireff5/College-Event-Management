import axios, { AxiosInstance } from 'axios';

/**
 * Real Axios instance that calls the Express/PostgreSQL backend at localhost:5000.
 * All mock adapter / localStorage logic has been removed.
 */
export const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach auth token to every request
api.interceptors.request.use(
    (config) => {
        // Prefer school token; fall back to admin token
        const schoolToken = localStorage.getItem('schoolToken');
        const adminToken = localStorage.getItem('token');
        const activeToken = schoolToken || adminToken;
        if (activeToken && config.headers) {
            config.headers.Authorization = `Bearer ${activeToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);
