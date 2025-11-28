'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { Property, User, Project, PropertyInterest, Watchlist, PropertySubmission } from '@/lib/types';
import { mockProperties, mockUsers, mockProjects, mockInterests, mockPropertySubmissions } from '@/lib/mock-data';

interface AdminDataContextType {
  // Properties
  properties: Property[];
  createProperty: (property: Property) => void;
  updateProperty: (id: string, property: Partial<Property>) => void;
  deleteProperty: (id: string) => boolean;
  getProperty: (id: string) => Property | undefined;
  
  // Users
  users: User[];
  createUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => boolean;
  getUser: (id: string) => User | undefined;
  
  // Projects
  projects: Project[];
  createProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => boolean;
  getProject: (id: string) => Project | undefined;
  verifyPayment: (projectId: string, planId: string, paymentId: string, adminUserId: string) => void;
  
  // Interests
  interests: PropertyInterest[];
  updateInterest: (id: string, interest: Partial<PropertyInterest>) => void;
  getInterestsByProperty: (propertyId: string) => PropertyInterest[];
  
  // Watchlists
  watchlists: Watchlist[];
  
  // Property Submissions
  propertySubmissions: PropertySubmission[];
  createPropertySubmission: (submission: PropertySubmission) => void;
  updatePropertySubmission: (id: string, submission: Partial<PropertySubmission>) => void;
  deletePropertySubmission: (id: string) => boolean;
  getPropertySubmission: (id: string) => PropertySubmission | undefined;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(() => {
    // Load from localStorage, fallback to mock data
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_properties');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse admin_properties from localStorage', e);
        }
      }
    }
    return mockProperties;
  });
  
  const [users, setUsers] = useState<User[]>(() => {
    // Load from localStorage, fallback to mock data
    let allUsers: User[] = [];
    
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_users');
      if (stored) {
        try {
          allUsers = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse admin_users from localStorage', e);
        }
      }
    }
    
    // If no stored data, use mock data
    if (allUsers.length === 0) {
      allUsers = [...mockUsers];
    }
    
    // Also merge registered users from localStorage
    if (typeof window !== 'undefined') {
      const storedRegisteredUsers = localStorage.getItem('registeredUsers');
      if (storedRegisteredUsers) {
        try {
          const registeredUsers: User[] = JSON.parse(storedRegisteredUsers);
          registeredUsers.forEach(regUser => {
            if (!allUsers.find(u => u.id === regUser.id)) {
              allUsers.push(regUser);
            }
          });
        } catch (e) {
          console.error('Failed to parse registeredUsers from localStorage', e);
        }
      }
    }
    
    return allUsers;
  });
  
  const [projects, setProjects] = useState<Project[]>(() => {
    // Load from localStorage, fallback to mock data
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_projects');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse admin_projects from localStorage', e);
        }
      }
    }
    return mockProjects;
  });
  
  const [interests, setInterests] = useState<PropertyInterest[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  
  const [propertySubmissions, setPropertySubmissions] = useState<PropertySubmission[]>(() => {
    // Load from localStorage, fallback to mock data
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_property_submissions');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse admin_property_submissions from localStorage', e);
        }
      }
      // Also check old key for backward compatibility
      const oldStored = localStorage.getItem('propertySubmissions');
      if (oldStored) {
        try {
          return JSON.parse(oldStored);
        } catch (e) {
          console.error('Failed to parse propertySubmissions from localStorage', e);
        }
      }
    }
    return mockPropertySubmissions;
  });

  // Load interests and watchlists from localStorage (aggregate from all users)
  const loadInterestsAndWatchlists = useCallback(() => {
    const allInterests: PropertyInterest[] = [];
    const allWatchlists: Watchlist[] = [];
    
    // First, try to load from admin_interests (global interests from seeding)
    if (typeof window !== 'undefined') {
      const adminInterests = localStorage.getItem('admin_interests');
      if (adminInterests) {
        try {
          const parsed = JSON.parse(adminInterests);
          allInterests.push(...parsed);
        } catch (e) {
          console.error('Failed to parse admin_interests from localStorage', e);
        }
      }
    }
    
    // Also collect from all users' localStorage (for backward compatibility)
    users.forEach(user => {
      const storedInterests = localStorage.getItem(`interests_${user.id}`);
      const storedWatchlists = localStorage.getItem(`watchlists_${user.id}`);
      
      if (storedInterests) {
        try {
          const userInterests = JSON.parse(storedInterests);
          // Only add if not already in allInterests (avoid duplicates)
          userInterests.forEach((interest: PropertyInterest) => {
            if (!allInterests.find(i => i.id === interest.id)) {
              allInterests.push(interest);
            }
          });
        } catch (e) {
          console.error('Failed to parse interests', e);
        }
      }
      
      if (storedWatchlists) {
        try {
          const userWatchlists = JSON.parse(storedWatchlists);
          allWatchlists.push(...userWatchlists);
        } catch (e) {
          console.error('Failed to parse watchlists', e);
        }
      }
    });
    
    // If no interests found, use mock data
    if (allInterests.length === 0) {
      allInterests.push(...mockInterests);
    }
    
    setInterests(allInterests);
    setWatchlists(allWatchlists);
  }, [users]);

  useEffect(() => {
    loadInterestsAndWatchlists();
  }, [loadInterestsAndWatchlists]);

  // Listen for user registration events
  useEffect(() => {
    const handleUserRegistered = (event: CustomEvent<User>) => {
      const newUser = event.detail;
      setUsers(prev => {
        // Avoid duplicates
        if (prev.find(u => u.id === newUser.id)) {
          return prev;
        }
        return [...prev, newUser];
      });
    };

    window.addEventListener('userRegistered', handleUserRegistered as EventListener);
    return () => {
      window.removeEventListener('userRegistered', handleUserRegistered as EventListener);
    };
  }, []);

  // Polling for interests changes (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      loadInterestsAndWatchlists();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadInterestsAndWatchlists]);

  // Properties CRUD
  const createProperty = useCallback((property: Property) => {
    setProperties(prev => {
      const updated = [...prev, property];
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_properties', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const updateProperty = useCallback((id: string, updates: Partial<Property>) => {
    setProperties(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_properties', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const deleteProperty = useCallback((id: string) => {
    // Check if property is used in any project
    const isUsed = projects.some(p => p.propertyId === id);
    if (isUsed) {
      return false; // Cannot delete if used in project
    }
    setProperties(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_properties', JSON.stringify(updated));
      }
      return updated;
    });
    return true;
  }, [projects]);

  const getProperty = useCallback((id: string) => {
    return properties.find(p => p.id === id);
  }, [properties]);

  // Users CRUD
  const createUser = useCallback((user: User) => {
    setUsers(prev => {
      const updated = [...prev, user];
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_users', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers(prev => {
      const updated = prev.map(u => u.id === id ? { ...u, ...updates } : u);
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_users', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const deleteUser = useCallback((id: string) => {
    // Check if user is member of any project
    const isMember = projects.some(p => p.members.some(m => m.id === id));
    if (isMember) {
      return false; // Cannot delete if member of project
    }
    setUsers(prev => {
      const updated = prev.filter(u => u.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_users', JSON.stringify(updated));
      }
      return updated;
    });
    return true;
  }, [projects]);

  const getUser = useCallback((id: string) => {
    return users.find(u => u.id === id);
  }, [users]);

  // Projects CRUD
  const createProject = useCallback((project: Project) => {
    setProjects(prev => {
      const updated = [...prev, project];
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_projects', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          const updatedProject = { ...p, ...updates };
          // If propertyId changed, update propertyName and images
          if (updates.propertyId && updates.propertyId !== p.propertyId) {
            const property = properties.find(prop => prop.id === updates.propertyId);
            if (property) {
              updatedProject.propertyName = property.name;
              updatedProject.propertyImageUrl = property.images[0]?.url || '';
              updatedProject.propertyImageHint = property.images[0]?.hint || '';
            }
          }
          // If members changed, update members array
          if (updates.members) {
            const memberIds = updates.members as string[];
            const memberObjects = users.filter(u => memberIds.includes(u.id));
            updatedProject.members = memberObjects;
          }
          return updatedProject;
        }
        return p;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_projects', JSON.stringify(updated));
      }
      return updated;
    });
  }, [properties, users]);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_projects', JSON.stringify(updated));
      }
      return updated;
    });
    return true;
  }, []);

  const getProject = useCallback((id: string) => {
    return projects.find(p => p.id === id);
  }, [projects]);

  const verifyPayment = useCallback((projectId: string, planId: string, paymentId: string, adminUserId: string) => {
    setProjects(prev => {
      const updated = prev.map(project => {
        if (project.id === projectId && project.installmentPlans) {
          const updatedPlans = project.installmentPlans.map(plan => {
            if (plan.id === planId) {
              const updatedPayments = plan.payments.map(payment => {
                if (payment.id === paymentId) {
                  return {
                    ...payment,
                    status: 'paid' as const,
                    paymentDate: new Date().toISOString(),
                    verifiedBy: adminUserId,
                    verifiedAt: new Date().toISOString(),
                  };
                }
                return payment;
              });
              return {
                ...plan,
                payments: updatedPayments,
              };
            }
            return plan;
          });
          return {
            ...project,
            installmentPlans: updatedPlans,
          };
        }
        return project;
      });
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_projects', JSON.stringify(updated));
      }
      
      return updated;
    });
  }, []);

  // Interests
  const updateInterest = useCallback((id: string, updates: Partial<PropertyInterest>) => {
    setInterests(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, ...updates } : i);
      // Save to admin_interests
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_interests', JSON.stringify(updated));
      }
      return updated;
    });
    
    // Also update in user's localStorage
    const interest = interests.find(i => i.id === id);
    if (interest && typeof window !== 'undefined') {
      const storedInterests = localStorage.getItem(`interests_${interest.userId}`);
      if (storedInterests) {
        try {
          const userInterests: PropertyInterest[] = JSON.parse(storedInterests);
          const updated = userInterests.map(i => i.id === id ? { ...i, ...updates } : i);
          localStorage.setItem(`interests_${interest.userId}`, JSON.stringify(updated));
          
          // Trigger custom event to notify user context
          window.dispatchEvent(new CustomEvent('interestUpdated'));
        } catch (e) {
          console.error('Failed to update interest in localStorage', e);
        }
      }
    }
  }, [interests]);

  const getInterestsByProperty = useCallback((propertyId: string) => {
    return interests.filter(i => i.propertyId === propertyId);
  }, [interests]);

  // Property Submissions
  const createPropertySubmission = useCallback((submission: PropertySubmission) => {
    setPropertySubmissions(prev => {
      const updated = [...prev, submission];
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_property_submissions', JSON.stringify(updated));
        // Also save to old key for backward compatibility
        localStorage.setItem('propertySubmissions', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const updatePropertySubmission = useCallback((id: string, updates: Partial<PropertySubmission>) => {
    setPropertySubmissions(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_property_submissions', JSON.stringify(updated));
        // Also save to old key for backward compatibility
        localStorage.setItem('propertySubmissions', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const deletePropertySubmission = useCallback((id: string) => {
    setPropertySubmissions(prev => {
      const updated = prev.filter(s => s.id !== id);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_property_submissions', JSON.stringify(updated));
        // Also save to old key for backward compatibility
        localStorage.setItem('propertySubmissions', JSON.stringify(updated));
      }
      return updated;
    });
    return true;
  }, []);

  const getPropertySubmission = useCallback((id: string) => {
    return propertySubmissions.find(s => s.id === id);
  }, [propertySubmissions]);

  const value: AdminDataContextType = {
    properties,
    createProperty,
    updateProperty,
    deleteProperty,
    getProperty,
    users,
    createUser,
    updateUser,
    deleteUser,
    getUser,
    projects,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    verifyPayment,
    interests,
    updateInterest,
    getInterestsByProperty,
    watchlists,
    propertySubmissions,
    createPropertySubmission,
    updatePropertySubmission,
    deletePropertySubmission,
    getPropertySubmission,
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return context;
}

