'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { PropertyInterest, Watchlist } from '@/lib/types';
import { useAuth } from './auth-context';

interface UserDataContextType {
  // Interests
  interests: PropertyInterest[];
  addInterest: (interest: Omit<PropertyInterest, 'id' | 'createdAt' | 'status'>) => void;
  removeInterest: (interestId: string) => void;
  getInterestsByProperty: (propertyId: string) => PropertyInterest[];
  getUserInterests: () => PropertyInterest[];
  
  // Watchlist
  watchlists: Watchlist[];
  addToWatchlist: (propertyId: string) => void;
  removeFromWatchlist: (propertyId: string) => void;
  isInWatchlist: (propertyId: string) => boolean;
  getUserWatchlists: () => Watchlist[];
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [interests, setInterests] = useState<PropertyInterest[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);

  // Load from localStorage on mount
  React.useEffect(() => {
    if (user) {
      const storedInterests = localStorage.getItem(`interests_${user.id}`);
      const storedWatchlists = localStorage.getItem(`watchlists_${user.id}`);
      
      if (storedInterests) {
        try {
          setInterests(JSON.parse(storedInterests));
        } catch (e) {
          console.error('Failed to parse interests', e);
        }
      }
      
      if (storedWatchlists) {
        try {
          setWatchlists(JSON.parse(storedWatchlists));
        } catch (e) {
          console.error('Failed to parse watchlists', e);
        }
      }
    }
  }, [user]);

  // Save to localStorage whenever interests or watchlists change
  React.useEffect(() => {
    if (user) {
      localStorage.setItem(`interests_${user.id}`, JSON.stringify(interests));
    }
  }, [interests, user]);

  React.useEffect(() => {
    if (user) {
      localStorage.setItem(`watchlists_${user.id}`, JSON.stringify(watchlists));
    }
  }, [watchlists, user]);

  // Interests
  const addInterest = useCallback((interestData: Omit<PropertyInterest, 'id' | 'createdAt' | 'status'>) => {
    if (!user) return;
    
    const newInterest: PropertyInterest = {
      ...interestData,
      id: `interest-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    
    setInterests(prev => [...prev, newInterest]);
  }, [user]);

  const removeInterest = useCallback((interestId: string) => {
    setInterests(prev => prev.filter(i => i.id !== interestId));
  }, []);

  const getInterestsByProperty = useCallback((propertyId: string) => {
    return interests.filter(i => i.propertyId === propertyId);
  }, [interests]);

  const getUserInterests = useCallback(() => {
    if (!user) return [];
    return interests.filter(i => i.userId === user.id);
  }, [interests, user]);

  // Watchlist
  const addToWatchlist = useCallback((propertyId: string) => {
    if (!user) return;
    
    // Check if already in watchlist
    if (watchlists.some(w => w.propertyId === propertyId && w.userId === user.id)) {
      return;
    }
    
    const newWatchlist: Watchlist = {
      id: `watchlist-${Date.now()}`,
      propertyId,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    
    setWatchlists(prev => [...prev, newWatchlist]);
  }, [user, watchlists]);

  const removeFromWatchlist = useCallback((propertyId: string) => {
    if (!user) return;
    setWatchlists(prev => prev.filter(w => !(w.propertyId === propertyId && w.userId === user.id)));
  }, [user]);

  const isInWatchlist = useCallback((propertyId: string) => {
    if (!user) return false;
    return watchlists.some(w => w.propertyId === propertyId && w.userId === user.id);
  }, [user, watchlists]);

  const getUserWatchlists = useCallback(() => {
    if (!user) return [];
    return watchlists.filter(w => w.userId === user.id);
  }, [watchlists, user]);

  const value: UserDataContextType = {
    interests,
    addInterest,
    removeInterest,
    getInterestsByProperty,
    getUserInterests,
    watchlists,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    getUserWatchlists,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within UserDataProvider');
  }
  return context;
}

