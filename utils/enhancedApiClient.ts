import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken, refreshToken, removeToken } from './storage';
import { BASE_URL } from '@/constants/endpoints';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if it's a 401/403 error and we haven't already tried to refresh
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshToken();
        if (newToken) {
          // Update the authorization header and retry the request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, remove token and redirect to login
        await removeToken();
        // You can add navigation logic here if needed
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Enhanced fetch function that uses the axios instance
export const enhancedFetch = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const response = await apiClient.request({
      url,
      method: options.method as any || 'GET',
      data: options.body,
      headers: options.headers as any,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Utility function to handle API errors gracefully
export const handleApiError = (error: any, operation: string = 'operation') => {
  console.error(`❌ Failed to ${operation}:`, error);
  
  // Don't show alerts for authentication errors - they're handled silently
  if (error.response?.status === 401 || error.response?.status === 403) {
    return 'Authentication error handled silently';
  }
  
  let errorMessage = `Failed to ${operation}. Please try again.`;
  
  if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  return errorMessage;
};
