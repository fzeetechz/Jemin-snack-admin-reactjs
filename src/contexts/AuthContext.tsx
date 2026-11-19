/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { authService } from '../services/auth/authService';
import { tokenStorage } from '../services/auth/tokenStorage';
import { isAdminUser } from '../config/permissions';
import {
  LoginDto,
  RegisterDto,
  UserProfileDto,
} from '../types/api/auth.types.ts';

interface AuthContextType {
  user: UserProfileDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  register: (userData: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserProfileDto) => void;
  isAdmin: any;
  sendOtp: (email: string) => Promise<any>;
  verifyOtpAndResetPassword: (
    email: string,
    otp: string,
    password: string
  ) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAdmin = isAdminUser(user);

  // Initialize auth state from storage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const isAuth = authService.isAuthenticated();
        console.log(isAuth);
        if (isAuth) {
          const storedUser = authService.getCurrentUser();
          const blockedReason = authService.getAccountBlockReason(storedUser);
          if (blockedReason) {
            tokenStorage.clearAuth();
            setUser(null);
          } else {
            console.log(storedUser);
            setUser(storedUser);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (credentials: LoginDto): Promise<void> => {
    setIsLoading(true);
    try {
      const response = (await authService.login(credentials)) as any;
      const user = response?.user;
      console.log(user);
      if (!user?.roleId) {
        throw new Error('Please contact with Admin.');
      }
      if (user.isDeleted) {
        throw new Error('Invalid credentials. Please try again.');
      }
      // return
      if (!response?.user) {
        throw new Error('Invalid credentials. Please try again.');
      }
      setUser(response.user);
    } catch (error) {
      tokenStorage.clearAuth();
      setUser(null);
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (userData: RegisterDto): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.register(userData);
      // After successful registration, you might want to auto-login
      // or redirect to login page
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear user even if API call fails
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update user profile data
   */
  const updateUser = useCallback((updatedUser: UserProfileDto): void => {
    setUser(updatedUser);
    // Update in storage as well
    tokenStorage.setUser(updatedUser);
  }, []);

  /**
   * Send OTP for password reset
   */
  const sendOtp = useCallback(async (email: string): Promise<any> => {
    try {
      const response = await authService.forgotPassword(email);
      return response;
    } catch (error) {
      console.error('Send OTP failed:', error);
      throw error;
    }
  }, []);

  /**
   * Verify OTP and reset password
   */
  const verifyOtpAndResetPassword = useCallback(
    async (email: string, _otp: string, password: string): Promise<any> => {
      try {
        const response = await authService.resetPassword({
          email,
          newPassword: password,
          token: '',
        });
        return response;
      } catch (error) {
        console.error('Reset password failed:', error);
        throw error;
      }
    },
    []
  );

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    isAdmin,
    sendOtp,
    verifyOtpAndResetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
