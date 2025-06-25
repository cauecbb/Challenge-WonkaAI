// Define your environment configuration here
const config = {
    // Only force HTTPS for non-localhost environments
    apiUrl: import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.toString().includes('localhost')
            ? import.meta.env.VITE_API_URL.toString()
            : import.meta.env.VITE_API_URL.toString().replace(/^http:\/\//i, 'https://')
        : '',
    // The prefix might be different - check your FastAPI main.py file
  apiPrefix: '/api/v1',
  // Add other environment-specific values here
};

// Log the actual API URL for debugging
console.log('Config - API URL:', config.apiUrl);

export default config; 