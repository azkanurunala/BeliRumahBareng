'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { User } from '@/lib/types';
import { createUser as createUserAction } from '@/lib/actions/user.actions';
import { login as loginAction, getUserById } from '@/lib/actions/auth.actions';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<boolean>;
  loginWithOAuth: (provider: 'google' | 'facebook') => Promise<boolean>;
  register: (data: {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
    profile: User['profile'];
  }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: check if user is logged in (from localStorage)
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const initializeAuth = async () => {
      try {
        const storedUserId = localStorage.getItem('currentUserId');
        if (storedUserId) {
          // Fetch user from database
          const result = await getUserById(storedUserId);
          if (result.success && result.data) {
            setUser(result.data);
          } else {
            // User not found or error, clear stored ID
            localStorage.removeItem('currentUserId');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('currentUserId');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (emailOrPhone: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await loginAction({
        emailOrPhone,
        password,
      });

      if (result.success && result.data) {
        setUser(result.data);
        localStorage.setItem('currentUserId', result.data.id);
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Error logging in:', error);
      setIsLoading(false);
      return false;
    }
  }, []);

  const loginWithOAuth = useCallback(async (provider: 'google' | 'facebook'): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real app, handle OAuth callback
      // For now, use first user as demo
      const demoUser = mockUsers[0];
      setUser(demoUser);
      localStorage.setItem('currentUserId', demoUser.id);
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  }, []);

  const register = useCallback(async (data: {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
    profile: User['profile'];
  }): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Create user in database
      const result = await createUserAction({
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        avatarUrl: '/images/default-avatar.png',
        avatarHint: 'default avatar',
        locationPreference: data.profile.locationPreference,
        priceRange: data.profile.priceRange,
        investmentGoals: data.profile.investmentGoals,
        financialCapacity: data.profile.financialCapacity,
        timeHorizon: data.profile.timeHorizon,
        passwordHash: data.password, // In real app, hash this with bcrypt
        oauthProvider: null,
        oauthId: undefined,
      });

      if (!result.success || !result.data) {
        console.error('Failed to create user:', result.error);
        setIsLoading(false);
        return false;
      }

      const newUser: User = result.data;
      
      // Trigger custom event to notify admin context
      window.dispatchEvent(new CustomEvent('userRegistered', { detail: newUser }));
      
      setUser(newUser);
      localStorage.setItem('currentUserId', newUser.id);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error registering user:', error);
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('currentUserId');
  }, []);

  // Check if current user is admin (based on role)
  const isAdmin = user?.role === 2;

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    loginWithOAuth,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

