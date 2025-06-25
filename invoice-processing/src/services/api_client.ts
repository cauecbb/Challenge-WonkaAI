import authService from './auth_service';

// Export the configured axios instance from auth service
export const apiClient = authService.getAxiosInstance();
export default apiClient;