/**
 * Mock Axios Adapter for Portfolio Demo
 * 
 * Replaces real axios HTTP client with a mock that routes
 * all requests through the mockApi handler.
 * 
 * IMPORTANT: This file exists ONLY in portfolio/src/lib/axios.ts
 * The original frontend/src/lib/axios.ts is UNTOUCHED.
 */

import { handleRequest, setCurrentUser } from '@/mock/mockApi';
import { authenticateUser } from '@/mock/mockAuth';

// Simple response wrapper to mimic axios response shape
function createResponse(data: any, status = 200) {
  return { data, status, statusText: 'OK', headers: {}, config: {} };
}

function createError(message: string, status = 401) {
  const error: any = new Error(message);
  error.response = { data: { errors: { username: [message] } }, status, statusText: 'Unauthorized' };
  return error;
}

const api = {
  defaults: { baseURL: '/api', headers: { common: {} } },

  interceptors: {
    request: { use: () => {}, eject: () => {} },
    response: { use: () => {}, eject: () => {} },
  },

  async get(url: string, config?: any) {
    const result = await handleRequest('get', url);
    return createResponse(result);
  },

  async post(url: string, data?: any, config?: any) {
    // Special handling for login
    if (url === '/auth/login' || url.endsWith('/login')) {
      const { username, password } = data || {};
      const result = authenticateUser(username, password);
      
      if (!result.success) {
        throw createError(result.error || 'Login failed');
      }
      
      // Set current user context for mock API
      setCurrentUser(result.user!);
      
      return createResponse({
        user: result.user,
        access_token: result.token,
      });
    }

    // All other POST requests
    const result = await handleRequest('post', url, data);
    return createResponse(result);
  },

  async put(url: string, data?: any, config?: any) {
    const result = await handleRequest('put', url, data);
    return createResponse(result);
  },

  async patch(url: string, data?: any, config?: any) {
    const result = await handleRequest('patch', url, data);
    return createResponse(result);
  },

  async delete(url: string, config?: any) {
    const result = await handleRequest('delete', url);
    return createResponse(result);
  },
};

export default api;
