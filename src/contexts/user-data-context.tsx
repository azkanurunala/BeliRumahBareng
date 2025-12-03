'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { PropertyInterest, Watchlist } from '@/lib/types';
import { useAuth } from './auth-context';
import { getWatchlists, addToWatchlist as addToWatchlistAction, removeFromWatchlist as removeFromWatchlistAction, isInWatchlist as isInWatchlistAction } from '@/lib/actions/watchlist.actions';
import { getPropertyInterests, createPropertyInterest, deletePropertyInterest } from '@/lib/actions/property-interest.actions';

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
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);

  // Load interests from API
  const loadInterests = useCallback(async () => {
    if (!user?.id) {
      setInterests([]);
      setInterestsLoading(false);
      return;
    }

    try {
      setInterestsLoading(true);
      const result = await getPropertyInterests({
        userId: user.id,
        limit: 1000,
      });

      if (result.success && result.data) {
        setInterests(result.data);
      } else {
        console.error('Failed to load interests:', result.error);
        setInterests([]);
      }
    } catch (error) {
      console.error('Error loading interests:', error);
      setInterests([]);
    } finally {
      setInterestsLoading(false);
    }
  }, [user?.id]);

  // Load watchlists from API
  const loadWatchlists = useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await getWatchlists({
        userId: user.id,
        page: 1,
        limit: 1000,
      });

      if (result.success && result.data) {
        setWatchlists(result.data);
      } else {
        console.error('Failed to load watchlists:', result.error);
      }
    } catch (error) {
      console.error('Error loading watchlists:', error);
    }
  }, [user?.id]);

  // Load watchlists and interests on mount and when user changes
  useEffect(() => {
    loadWatchlists();
    loadInterests();
  }, [loadWatchlists, loadInterests]);

  // Listen for custom events (for interest status updates from admin)
  React.useEffect(() => {
    if (!user) return;

    const handleInterestUpdate = () => {
      loadInterests();
    };

    window.addEventListener('interestUpdated', handleInterestUpdate);

    return () => {
      window.removeEventListener('interestUpdated', handleInterestUpdate);
    };
  }, [user, loadInterests]);

  // Watchlists are now managed via API, no need to save to localStorage

  // Interests
  const addInterest = useCallback(async (interestData: Omit<PropertyInterest, 'id' | 'createdAt' | 'status'>) => {
    if (!user?.id) return;
    
    try {
      // Auto-fill email and phoneNumber from user data if not provided
      const email = interestData.email || user.email || '';
      const phoneNumber = interestData.phoneNumber || user.phoneNumber || '';
      
      const result = await createPropertyInterest({
        propertyId: interestData.propertyId,
        userId: user.id,
        unitId: interestData.unitId,
        unitSize: interestData.unitSize,
        isFirstHome: interestData.isFirstHome,
        willOccupy: interestData.willOccupy,
        email,
        phoneNumber,
      });

      if (result.success && result.data) {
        setInterests(prev => [...prev, result.data!]);
        // Dispatch event to notify admin context
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('adminInterestAdded'));
        }
        return;
      }
      throw new Error(result.error?.message || 'Failed to create interest');
    } catch (error) {
      console.error('Error adding interest:', error);
      throw error;
    }
  }, [user]);

  const removeInterest = useCallback(async (interestId: string) => {
    try {
      const result = await deletePropertyInterest(interestId);
      if (result.success) {
        setInterests(prev => prev.filter(i => i.id !== interestId));
        return;
      }
      throw new Error(result.error?.message || 'Failed to delete interest');
    } catch (error) {
      console.error('Error removing interest:', error);
      throw error;
    }
  }, []);

  const getInterestsByProperty = useCallback((propertyId: string) => {
    return interests.filter(i => i.propertyId === propertyId);
  }, [interests]);

  const getUserInterests = useCallback(() => {
    if (!user) return [];
    return interests.filter(i => i.userId === user.id);
  }, [interests, user]);

  // Watchlist
  const addToWatchlist = useCallback(async (propertyId: string) => {
    if (!user?.id) return;
    
    try {
      // Check if already in watchlist
      if (watchlists.some(w => w.propertyId === propertyId && w.userId === user.id)) {
        return;
      }

      const result = await addToWatchlistAction({
        propertyId,
        userId: user.id,
      });

      if (result.success && result.data) {
        setWatchlists(prev => [...prev, result.data!]);
      } else {
        console.error('Failed to add to watchlist:', result.error);
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  }, [user?.id, watchlists]);

  const removeFromWatchlist = useCallback(async (propertyId: string) => {
    if (!user?.id) return;

    try {
      const result = await removeFromWatchlistAction({
        propertyId,
        userId: user.id,
      });

      if (result.success) {
        setWatchlists(prev => prev.filter(w => !(w.propertyId === propertyId && w.userId === user.id)));
      } else {
        console.error('Failed to remove from watchlist:', result.error);
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  }, [user?.id]);

  const isInWatchlist = useCallback((propertyId: string) => {
    if (!user?.id) return false;
    return watchlists.some(w => w.propertyId === propertyId && w.userId === user.id);
  }, [user?.id, watchlists]);

  const getUserWatchlists = useCallback(() => {
    if (!user) return [];
    return watchlists.filter(w => w.userId === user.id);
  }, [watchlists, user]);

  const value: UserDataContextType = {
    interests,
    interestsLoading,
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

