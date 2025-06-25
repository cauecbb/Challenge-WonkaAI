import axios, { AxiosInstance } from 'axios';
import config from '../config';

// Types for authentication
export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

// Backend API response types
interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface AzureLoginRequest {
  azure_token: string;
}

// Token refresh configuration
interface TokenRefreshConfig {
  refreshThresholdMinutes: number; // Refresh token X minutes before expiration
  maxRetries: number;
  retryDelayMs: number;
  enableBackgroundRefresh: boolean;
}

// Events for token lifecycle
export type TokenEvent = 'refresh_success' | 'refresh_failed' | 'token_expired' | 'logout';

export interface TokenEventListener {
  (event: TokenEvent, data?: any): void;
}

class AuthService {
  private readonly TOKEN_KEY = 'amnorman_jwt_token';
  private readonly USER_KEY = 'amnorman_user_data';
  private readonly TOKEN_EXPIRY_KEY = 'amnorman_token_expiry';
  private readonly REFRESH_LOCK_KEY = 'amnorman_refresh_lock';

  // Configuration
  private config: TokenRefreshConfig = {
    refreshThresholdMinutes: 5, // Refresh 5 minutes before expiration
    maxRetries: 3,
    retryDelayMs: 1000,
    enableBackgroundRefresh: true
  };

  // State management
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<AuthTokens | null> | null = null;
  private eventListeners: TokenEventListener[] = [];
  private axiosInstance: AxiosInstance = this.createAxiosInstance();

  // Add singleton protection
  private static instance: AuthService | null = null;

  constructor() {
    // Singleton pattern to prevent multiple instances
    if (AuthService.instance) {
      return AuthService.instance;
    }

    this.setupAxiosInterceptors();
    
    // Start background refresh if enabled
    if (this.config.enableBackgroundRefresh) {
      this.startBackgroundRefresh();
    }

    // Listen for storage changes (multi-tab support)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
      
      // Listen for visibility changes to refresh when tab becomes active
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    AuthService.instance = this;
  }

  /**
   * Configure token refresh behavior
   */
  configure(config: Partial<TokenRefreshConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.enableBackgroundRefresh && !this.refreshTimer) {
      this.startBackgroundRefresh();
    } else if (!this.config.enableBackgroundRefresh && this.refreshTimer) {
      this.stopBackgroundRefresh();
    }
  }

  /**
   * Add event listener for token events
   */
  addEventListener(listener: TokenEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: TokenEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Emit token event to all listeners
   */
  private emitEvent(event: TokenEvent, data?: any): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in token event listener:', error);
      }
    });
  }

  /**
   * Create axios instance with base configuration
   */
  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: `${config.apiUrl}${config.apiPrefix}`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Exchange Microsoft token for backend JWT
   */
  async loginWithMicrosoftToken(microsoftToken: string): Promise<AuthTokens> {
    try {
      const response = await this.axiosInstance.post<APIResponse<AuthTokens>>(
        '/admin/auth/azure',
        { azure_token: microsoftToken } as AzureLoginRequest
      );

      if (response.data.success) {
        const authData = response.data.data;
        this.storeAuthData(authData);
        this.startBackgroundRefresh();
        return authData;
      } else {
        throw new Error(response.data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Microsoft token exchange failed:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        const message = axiosError.response?.data?.message || axiosError.response?.data?.detail || 'Authentication failed';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Store authentication data in localStorage with enhanced metadata
   */
  private storeAuthData(authData: AuthTokens): void {
    const now = Date.now();
    const expiryTime = now + (authData.expires_in * 1000);
    const refreshTime = expiryTime - (this.config.refreshThresholdMinutes * 60 * 1000);
    
    localStorage.setItem(this.TOKEN_KEY, authData.access_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authData.user));
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    localStorage.setItem('amnorman_token_refresh_time', refreshTime.toString());
    localStorage.setItem('amnorman_token_issued_at', now.toString());
    
    // Clear any existing refresh lock
    localStorage.removeItem(this.REFRESH_LOCK_KEY);
  }

  /**
   * Get stored JWT token with enhanced validation
   */
  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) {
      return null;
    }

    // Check if token is expired
    if (Date.now() > parseInt(expiry)) {
      this.clearAuthData();
      this.emitEvent('token_expired');
      return null;
    }

    return token;
  }

  /**
   * Check if token needs refresh (proactive check)
   */
  shouldRefreshToken(): boolean {
    const refreshTime = localStorage.getItem('amnorman_token_refresh_time');
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    
    if (!refreshTime || !expiry) {
      return false;
    }

    const now = Date.now();
    return now >= parseInt(refreshTime) && now < parseInt(expiry);
  }

  /**
   * Get time until token refresh is needed (in milliseconds)
   */
  getTimeUntilRefresh(): number {
    const refreshTime = localStorage.getItem('amnorman_token_refresh_time');
    if (!refreshTime) {
      return 0;
    }
    
    return Math.max(0, parseInt(refreshTime) - Date.now());
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeUntilExpiry(): number {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) {
      return 0;
    }
    
    return Math.max(0, parseInt(expiry) - Date.now());
  }

  /**
   * Get stored user data
   */
  getUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    if (!userData) {
      return null;
    }

    try {
      return JSON.parse(userData) as User;
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null && this.getUser() !== null;
  }

  /**
   * Refresh JWT token with retry logic and concurrency protection
   */
  async refreshToken(): Promise<AuthTokens | null> {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // Check for refresh lock (multi-tab protection)
    const refreshLock = localStorage.getItem(this.REFRESH_LOCK_KEY);
    if (refreshLock && Date.now() - parseInt(refreshLock) < 30000) { // 30 second lock
      return null;
    }

    this.isRefreshing = true;
    localStorage.setItem(this.REFRESH_LOCK_KEY, Date.now().toString());

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      this.emitEvent(result ? 'refresh_success' : 'refresh_failed', result);
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
      localStorage.removeItem(this.REFRESH_LOCK_KEY);
    }
  }

  /**
   * Perform the actual token refresh with retry logic
   */
  private async performTokenRefresh(): Promise<AuthTokens | null> {
    const currentToken = this.getToken();
    if (!currentToken) {
      return null;
    }

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.axiosInstance.post<APIResponse<{ access_token: string; token_type: string; expires_in: number }>>(
          '/admin/auth/refresh',
          {},
          {
            headers: {
              Authorization: `Bearer ${currentToken}`
            },
            timeout: 10000 // 10 second timeout for refresh requests
          }
        );

        if (response.data.success) {
          const tokenData = response.data.data;
          const user = this.getUser();
          
          if (user) {
            const authData: AuthTokens = {
              access_token: tokenData.access_token,
              token_type: tokenData.token_type,
              expires_in: tokenData.expires_in,
              user
            };
            
            this.storeAuthData(authData);
            return authData;
          }
        }
        
        throw new Error('Invalid response from refresh endpoint');
      } catch (error) {
        console.error(`Token refresh attempt ${attempt} failed:`, error);
        
        if (attempt === this.config.maxRetries) {
          console.error('All token refresh attempts failed');
          this.clearAuthData();
          return null;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelayMs * attempt));
      }
    }
    
    return null;
  }

  /**
   * Get current user info from backend
   */
  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const response = await this.axiosInstance.get<APIResponse<User>>(
        '/admin/auth/me',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        const user = response.data.data;
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Get current user failed:', error);
      return null;
    }
  }

  /**
   * Logout user and clear all stored data
   */
  logout(): void {
    this.stopBackgroundRefresh();
    this.clearAuthData();
    this.emitEvent('logout');
  }

  /**
   * Clear all authentication data from localStorage
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem('amnorman_token_refresh_time');
    localStorage.removeItem('amnorman_token_issued_at');
    localStorage.removeItem(this.REFRESH_LOCK_KEY);
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.getUser(),
      token: this.getToken(),
      loading: false
    };
  }

  /**
   * Start background token refresh timer
   */
  private startBackgroundRefresh(): void {
    this.stopBackgroundRefresh(); // Clear any existing timer
    
    const scheduleNextRefresh = () => {
      const timeUntilRefresh = this.getTimeUntilRefresh();
      
      if (timeUntilRefresh > 0) {
        this.refreshTimer = setTimeout(async () => {
          if (this.isAuthenticated() && this.shouldRefreshToken()) {
            await this.refreshToken();
          }
          scheduleNextRefresh(); // Schedule next check
        }, Math.min(timeUntilRefresh, 60000)); // Check at least every minute
      } else if (this.isAuthenticated()) {
        // Token needs immediate refresh
        this.refreshTimer = setTimeout(async () => {
          await this.refreshToken();
          scheduleNextRefresh();
        }, 1000);
      }
    };

    scheduleNextRefresh();
  }

  /**
   * Stop background token refresh timer
   */
  private stopBackgroundRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Handle storage changes (multi-tab synchronization)
   */
  private handleStorageChange(event: StorageEvent): void {
    if (event.key === this.TOKEN_KEY || event.key === this.TOKEN_EXPIRY_KEY) {
      // Token changed in another tab, restart background refresh
      if (this.config.enableBackgroundRefresh) {
        this.startBackgroundRefresh();
      }
    }
  }

  /**
   * Handle visibility changes (refresh when tab becomes active)
   */
  private handleVisibilityChange(): void {
    if (!document.hidden && this.isAuthenticated() && this.shouldRefreshToken()) {
      this.refreshToken();
    }
  }

  /**
   * Setup axios interceptors for automatic token attachment and refresh
   */
  private setupAxiosInterceptors(): void {
    // Clear any existing interceptors to prevent duplicates
    this.axiosInstance.interceptors.request.clear();
    this.axiosInstance.interceptors.response.clear();

    // Request interceptor to add token to headers
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh on 401 and 403
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle both 401 (Unauthorized) and 403 (Forbidden) errors
        if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshedAuth = await this.refreshToken();
            if (refreshedAuth) {
              originalRequest.headers.Authorization = `Bearer ${refreshedAuth.access_token}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            console.error(`Token refresh failed after ${error.response?.status}:`, refreshError);
            this.clearAuthData();
            this.emitEvent('token_expired');
            // Redirect to login page
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get axios instance for making API calls
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Get all users from backend (admin)
   */
  async getAllUsers(): Promise<User[]> {
    const response = await this.axiosInstance.get<APIResponse<User[]>>('/admin/users/');

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch users');
    }
  }

  /**
   * Update user's details (e.g., role)
   */
  async updateUser(userId: string, userData: Partial<Pick<User, 'role'>>): Promise<User> {
    const response = await this.axiosInstance.put<APIResponse<User>>(
      `/admin/users/${userId}`,
      userData
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to update user');
    }
  }

  /**
   * Development helper: Force token to expire soon for testing
   */
  forceTokenExpirySoon(minutesFromNow: number = 1): void {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('forceTokenExpirySoon is only available in development mode');
      return;
    }

    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      console.warn('No token found to expire');
      return;
    }

    const newExpiry = Date.now() + (minutesFromNow * 60 * 1000);
    const newRefreshTime = newExpiry - (this.config.refreshThresholdMinutes * 60 * 1000);
    
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, newExpiry.toString());
    localStorage.setItem('amnorman_token_refresh_time', newRefreshTime.toString());
    
    // Restart background refresh to pick up new timing
    if (this.config.enableBackgroundRefresh) {
      this.startBackgroundRefresh();
    }
  }

  /**
   * Development helper: Get token info for debugging
   */
  getTokenInfo(): any {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    const token = localStorage.getItem(this.TOKEN_KEY);
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    const refreshTime = localStorage.getItem('amnorman_token_refresh_time');
    const issuedAt = localStorage.getItem('amnorman_token_issued_at');

    if (!token || !expiry) {
      return null;
    }

    const now = Date.now();
    const expiryTime = parseInt(expiry);
    const refreshTimeMs = refreshTime ? parseInt(refreshTime) : null;
    const issuedAtMs = issuedAt ? parseInt(issuedAt) : null;

    return {
      hasToken: !!token,
      isExpired: now > expiryTime,
      shouldRefresh: this.shouldRefreshToken(),
      timeUntilExpiry: Math.max(0, expiryTime - now),
      timeUntilRefresh: refreshTimeMs ? Math.max(0, refreshTimeMs - now) : null,
      tokenAge: issuedAtMs ? now - issuedAtMs : null,
      expiryDate: new Date(expiryTime).toISOString(),
      refreshDate: refreshTimeMs ? new Date(refreshTimeMs).toISOString() : null,
      issuedDate: issuedAtMs ? new Date(issuedAtMs).toISOString() : null
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService; 