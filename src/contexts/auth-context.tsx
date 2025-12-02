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
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: check if user is logged in (from localStorage or session)
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
        // Check both mockUsers and registeredUsers
        let foundUser = mockUsers.find(u => u.id === storedUserId);
        
        if (!foundUser) {
          const storedRegisteredUsers = localStorage.getItem('registeredUsers');
          if (storedRegisteredUsers) {
            try {
              const registeredUsers: User[] = JSON.parse(storedRegisteredUsers);
              foundUser = registeredUsers.find(u => u.id === storedUserId);
            } catch (e) {
              console.error('Failed to parse registeredUsers', e);
            }
          }
        }
        
      if (foundUser) {
        setUser(foundUser);
      }
    }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
    setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (emailOrPhone: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find user by email or phone in mockUsers
      let foundUser = mockUsers.find(u => 
        u.email === emailOrPhone || u.phoneNumber === emailOrPhone
      );
      
      // If not found in mockUsers, check registeredUsers
      if (!foundUser && typeof window !== 'undefined') {
        const storedRegisteredUsers = localStorage.getItem('registeredUsers');
        if (storedRegisteredUsers) {
          try {
            const registeredUsers: User[] = JSON.parse(storedRegisteredUsers);
            foundUser = registeredUsers.find(u => 
              u.email === emailOrPhone || u.phoneNumber === emailOrPhone
            );
          } catch (e) {
            console.error('Failed to parse registeredUsers', e);
          }
        }
      }
      
      if (foundUser) {
        // Verify password (in real app, compare hashed password)
        if (foundUser.passwordHash && foundUser.passwordHash !== password) {
          setIsLoading(false);
          return false;
        }
        
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

  // Check if current user is admin (based on email)
  const isAdmin = user?.email === 'admin@mail.com';

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

