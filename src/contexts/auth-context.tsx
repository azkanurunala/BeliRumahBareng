'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { User } from '@/lib/types';
import { createUser as createUserAction } from '@/lib/actions/user.actions';
import { login as loginAction, getUserById, loginWithGoogle as loginWithGoogleAction } from '@/lib/actions/auth.actions';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
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
        setUser(result.data as User);
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

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;

      if (firebaseUser && firebaseUser.email) {
        // Sync with backend
        const result = await loginWithGoogleAction({
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL,
          googleId: firebaseUser.uid,
        });

        if (result.success && result.data) {
           setUser(result.data as User);
           localStorage.setItem('currentUserId', result.data.id);
           setIsLoading(false);
           return true;
        }
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Error logging in with Google:', error);
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
        role: 1,
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

  const logout = useCallback(async () => {
    setIsLoading(true);
    
    // Clear local state immediately (Optimistic)
    setUser(null);
    localStorage.removeItem('currentUserId');

    // Trigger Firebase signout in background (don't block UI)
    firebaseSignOut(auth).catch((e) => {
      console.error("Error signing out from firebase", e);
    });

    // Short aesthetic delay to show the transition, then unblock
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  // Check if current user is admin (based on role)
  const isAdmin = user?.role === 2;

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    loginWithGoogle,
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

