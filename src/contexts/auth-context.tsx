'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { User } from '@/lib/types';
import { mockUsers } from '@/lib/mock-data';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: check if user is logged in (from localStorage or session)
  useEffect(() => {
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      const foundUser = mockUsers.find(u => u.id === storedUserId);
      if (foundUser) {
        setUser(foundUser);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (emailOrPhone: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find user by email or phone
      const foundUser = mockUsers.find(u => 
        u.email === emailOrPhone || u.phoneNumber === emailOrPhone
      );
      
      if (foundUser) {
        // In real app, verify password hash
        setUser(foundUser);
        localStorage.setItem('currentUserId', foundUser.id);
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In real app, hash password and create user in database
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        avatarUrl: '/images/default-avatar.png',
        avatarHint: 'default avatar',
        profile: data.profile,
        passwordHash: data.password, // In real app, hash this
      };
      
      // Save to registeredUsers in localStorage for admin context
      const storedRegisteredUsers = localStorage.getItem('registeredUsers');
      const registeredUsers: User[] = storedRegisteredUsers ? JSON.parse(storedRegisteredUsers) : [];
      registeredUsers.push(newUser);
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
      
      // Trigger custom event to notify admin context
      window.dispatchEvent(new CustomEvent('userRegistered', { detail: newUser }));
      
      setUser(newUser);
      localStorage.setItem('currentUserId', newUser.id);
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('currentUserId');
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    loginWithOAuth,
    register,
    logout,
    isAuthenticated: !!user,
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

