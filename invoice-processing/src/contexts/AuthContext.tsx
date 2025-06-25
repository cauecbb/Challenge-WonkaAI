import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useMsal } from '@azure/msal-react';
import authService, { AuthState, AuthTokens, TokenEvent, TokenEventListener } from '../services/auth_service';

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  error: string | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true
  });
  const [error, setError] = useState<string | null>(null);

  // Token event listener
  const tokenEventListener: TokenEventListener = (event: TokenEvent, data?: any) => {
    switch (event) {
      case 'refresh_success':
        setError(null);
        if (data) {
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: data.user,
            token: data.access_token
          }));
        }
        break;
        
      case 'refresh_failed':
        setError('Session refresh failed. Please log in again.');
        break;
        
      case 'token_expired':
        setError('Your session has expired. Please log in again.');
        logout();
        break;
        
      case 'logout':
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false
        });
        setError(null);
        break;
    }
  };

  // Initialize auth state and setup service
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Configure auth service
        authService.configure({
          refreshThresholdMinutes: 5,
          maxRetries: 3,
          retryDelayMs: 1000,
          enableBackgroundRefresh: true
        });

        // Add token event listener
        authService.addEventListener(tokenEventListener);
        
        // Check for existing authentication
        const currentAuthState = authService.getAuthState();
        
        if (currentAuthState.isAuthenticated) {
          // Verify token is still valid by fetching current user
          const user = await authService.getCurrentUser();
          if (user) {
            setAuthState({
              ...currentAuthState,
              user,
              loading: false
            });
            
            // Check if token needs immediate refresh
            if (authService.shouldRefreshToken()) {
              authService.refreshToken();
            }
          } else {
            // Token invalid, clear auth data
            authService.logout();
            setAuthState({
              isAuthenticated: false,
              user: null,
              token: null,
              loading: false
            });
          }
        } else {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false
        });
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      authService.removeEventListener(tokenEventListener);
    };
  }, []);

  // Handle MSAL account changes
  useEffect(() => {
    const handleMsalAuth = async () => {
      if (accounts.length > 0 && !authState.isAuthenticated && !authState.loading) {
        try {
          await login();
        } catch (error) {
          console.error('Auto-login failed:', error);
        }
      }
    };

    handleMsalAuth();
  }, [accounts, authState.isAuthenticated, authState.loading]);

  const login = async (): Promise<void> => {
    try {
      setError(null);
      setAuthState(prev => ({ ...prev, loading: true }));

      // Get access token from MSAL
      const tokenRequest = {
        scopes: ['User.Read'],
        account: accounts[0]
      };

      const response = await instance.acquireTokenSilent(tokenRequest);
      const microsoftToken = response.accessToken;

      // Exchange Microsoft token for backend JWT
      const authData: AuthTokens = await authService.loginWithMicrosoftToken(microsoftToken);

      setAuthState({
        isAuthenticated: true,
        user: authData.user,
        token: authData.access_token,
        loading: false
      });

    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false
      });

      // Try interactive login if silent fails
      try {
        const response = await instance.acquireTokenPopup({
          scopes: ['User.Read']
        });
        const microsoftToken = response.accessToken;
        const authData: AuthTokens = await authService.loginWithMicrosoftToken(microsoftToken);

        setAuthState({
          isAuthenticated: true,
          user: authData.user,
          token: authData.access_token,
          loading: false
        });
        setError(null);
      } catch (popupError) {
        console.error('Interactive login also failed:', popupError);
      }
    }
  };

  const logout = (): void => {
    authService.logout();
    instance.logoutRedirect();
  };

  const refreshAuth = async (): Promise<void> => {
    try {
      const refreshedAuth = await authService.refreshToken();
      if (refreshedAuth) {
        setAuthState(prev => ({
          ...prev,
          user: refreshedAuth.user,
          token: refreshedAuth.access_token
        }));
        setError(null);
      }
    } catch (error) {
      console.error('Manual refresh failed:', error);
      setError('Failed to refresh session');
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshAuth,
    error
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 