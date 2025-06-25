// Global API client that all services should use
import authService from './auth_service';

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

// Create a wrapper around the axios instance to add deduplication
const createDedupedApi = () => {
  const axiosInstance = authService.getAxiosInstance();
  
  // Add request deduplication
  axiosInstance.interceptors.request.use(
    (config) => {
      // Create a unique key for this request
      const requestKey = `${config.method}:${config.url}:${JSON.stringify(config.params)}:${JSON.stringify(config.data)}`;
      
      // If this exact request is already pending, return the existing promise
      if (pendingRequests.has(requestKey)) {
        console.log(`Deduplicating request: ${requestKey}`);
        return Promise.reject({ 
          __DEDUPE__: true, 
          promise: pendingRequests.get(requestKey) 
        });
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Clean up pending requests on response
  axiosInstance.interceptors.response.use(
    (response) => {
      const requestKey = `${response.config.method}:${response.config.url}:${JSON.stringify(response.config.params)}:${JSON.stringify(response.config.data)}`;
      pendingRequests.delete(requestKey);
      return response;
    },
    (error) => {
      if (error.__DEDUPE__) {
        return error.promise;
      }
      
      if (error.config) {
        const requestKey = `${error.config.method}:${error.config.url}:${JSON.stringify(error.config.params)}:${JSON.stringify(error.config.data)}`;
        pendingRequests.delete(requestKey);
      }
      
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

// Export the configured axios instance
export const api = createDedupedApi();

// Export as default for convenience
export default api; 