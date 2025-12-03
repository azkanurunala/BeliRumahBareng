'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { Property, User, Project, PropertyInterest, Watchlist, PropertySubmission } from '@/lib/types';
import { mockProperties, mockUsers, mockProjects, mockInterests, mockPropertySubmissions } from '@/lib/mock-data';
import { apiClient } from '@/lib/api-client';
import { getUsers, createUser as createUserAction, updateUser as updateUserAction, deleteUser as deleteUserAction } from '@/lib/actions/user.actions';
import { getProperties, createProperty as createPropertyAction, updateProperty as updatePropertyAction, deleteProperty as deletePropertyAction } from '@/lib/actions/property.actions';
import { getProjects, createProject as createProjectAction, updateProject as updateProjectAction, deleteProject as deleteProjectAction } from '@/lib/actions/project.actions';
import { verifyPayment as verifyPaymentAction } from '@/lib/actions/payment.actions';
import { getPropertyInterests, updatePropertyInterest, reviewPropertyInterest } from '@/lib/actions/property-interest.actions';
import { getPropertySubmissions, createPropertySubmission as createPropertySubmissionAction, updatePropertySubmission as updatePropertySubmissionAction, deletePropertySubmission as deletePropertySubmissionAction } from '@/lib/actions/property-submission.actions';

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
  interestsLoading: boolean;
  updateInterest: (id: string, interest: Partial<PropertyInterest>) => Promise<void>;
  getInterestsByProperty: (propertyId: string) => PropertyInterest[];
  
  // Watchlists
  watchlists: Watchlist[];
  
  // Property Submissions
  propertySubmissions: PropertySubmission[];
  propertySubmissionsLoading: boolean;
  createPropertySubmission: (submission: PropertySubmission) => Promise<void>;
  updatePropertySubmission: (id: string, submission: Partial<PropertySubmission>) => Promise<void>;
  deletePropertySubmission: (id: string) => Promise<boolean>;
  getPropertySubmission: (id: string) => PropertySubmission | undefined;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  
  const [interests, setInterests] = useState<PropertyInterest[]>([]);
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  
  const [propertySubmissions, setPropertySubmissions] = useState<PropertySubmission[]>([]);
  const [propertySubmissionsLoading, setPropertySubmissionsLoading] = useState(true);

  // Load interests from API
  const loadInterests = useCallback(async () => {
    try {
      setInterestsLoading(true);
      const result = await getPropertyInterests({ limit: 1000 }); // Get all interests
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
  }, []);

  // Load property submissions from API
  const loadPropertySubmissions = useCallback(async () => {
    try {
      setPropertySubmissionsLoading(true);
      const result = await getPropertySubmissions({ limit: 1000 }); // Get all submissions
      if (result.success && result.data) {
        setPropertySubmissions(result.data);
      } else {
        console.error('Failed to load property submissions:', result.error);
        setPropertySubmissions([]);
      }
    } catch (error) {
      console.error('Error loading property submissions:', error);
      setPropertySubmissions([]);
    } finally {
      setPropertySubmissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInterests();
    loadPropertySubmissions();
  }, [loadInterests, loadPropertySubmissions]);

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

  // Polling for interests and submissions changes (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      loadInterests();
      loadPropertySubmissions();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadInterests, loadPropertySubmissions]);

  // Load properties from API
  const loadProperties = useCallback(async () => {
    try {
      setPropertiesLoading(true);
      const result = await getProperties({ page: 1, limit: 1000 });
      if (result.success && result.data) {
        setProperties(result.data);
      } else {
        console.error('Failed to load properties:', result.error);
        // Fallback to mock data on error
        setProperties(mockProperties);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      setProperties(mockProperties);
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  // Load properties on mount
  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Properties CRUD
  const createProperty = useCallback(async (property: Property) => {
    try {
      // Transform Property type ke createPropertySchema format
      const propertyData = {
        name: property.name,
        description: property.description,
        price: property.price,
        totalArea: property.totalArea,
        location: property.location,
        type: property.type,
        totalUnits: property.totalUnits,
        unitName: property.unitName,
        unitSize: property.unitSize,
        unitMeasure: property.unitMeasure,
        sitePlanUrl: property.planningInfo?.sitePlanUrl || '',
        sitePlanHint: property.planningInfo?.sitePlanHint,
        developmentPlan: property.planningInfo?.developmentPlan,
        environmentalAnalysis: property.planningInfo?.environmentalAnalysis,
        images: property.images.map((img, index) => ({
          url: img.url,
          hint: img.hint,
          order: index,
        })),
      };

      const result = await createPropertyAction(propertyData);
      if (result.success && result.data) {
        setProperties(prev => [...prev, result.data!]);
        return;
      }
      throw new Error(result.error?.message || 'Failed to create property');
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  }, []);

  const updateProperty = useCallback(async (id: string, updates: Partial<Property>) => {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.totalArea !== undefined) updateData.totalArea = updates.totalArea;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.totalUnits !== undefined) updateData.totalUnits = updates.totalUnits;
      if (updates.unitName !== undefined) updateData.unitName = updates.unitName;
      if (updates.unitSize !== undefined) updateData.unitSize = updates.unitSize;
      if (updates.unitMeasure !== undefined) updateData.unitMeasure = updates.unitMeasure;
      if (updates.planningInfo) {
        updateData.sitePlanUrl = updates.planningInfo.sitePlanUrl || '';
        updateData.sitePlanHint = updates.planningInfo.sitePlanHint;
        updateData.developmentPlan = updates.planningInfo.developmentPlan;
        updateData.environmentalAnalysis = updates.planningInfo.environmentalAnalysis;
      }
      if (updates.images !== undefined) {
        updateData.images = updates.images.map((img, index) => ({
          url: img.url,
          hint: img.hint,
          order: index,
        }));
      }

      const result = await updatePropertyAction(id, updateData);
      if (result.success && result.data) {
        setProperties(prev => prev.map(p => p.id === id ? result.data! : p));
        return;
      }
      throw new Error(result.error?.message || 'Failed to update property');
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  }, []);

  const deleteProperty = useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = await deletePropertyAction(id);
      if (result.success) {
        setProperties(prev => prev.filter(p => p.id !== id));
        return true;
      }
      // If conflict (property is used in project), return false
      if (result.error?.code === 'CONFLICT') {
        return false;
      }
      throw new Error(result.error?.message || 'Failed to delete property');
    } catch (error) {
      console.error('Error deleting property:', error);
      return false;
    }
  }, []);

  const getProperty = useCallback((id: string) => {
    return properties.find(p => p.id === id);
  }, [properties]);

  // Load users from API
  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const result = await getUsers({ page: 1, limit: 1000 });
      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        console.error('Failed to load users:', result.error);
        // Fallback to mock data on error
        setUsers(mockUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers(mockUsers);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Users CRUD
  const createUser = useCallback(async (user: User) => {
    try {
      // Transform User type ke createUserSchema format
      const userData = {
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        avatarHint: user.avatarHint,
        locationPreference: user.profile.locationPreference,
        priceRange: user.profile.priceRange,
        investmentGoals: user.profile.investmentGoals,
        financialCapacity: user.profile.financialCapacity,
        timeHorizon: user.profile.timeHorizon,
        passwordHash: undefined,
        oauthProvider: user.oauthProvider || null,
        oauthId: undefined,
      };

      const result = await createUserAction(userData);
      if (result.success && result.data) {
        setUsers(prev => [...prev, result.data!]);
        return;
      }
      throw new Error(result.error?.message || 'Failed to create user');
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.phoneNumber !== undefined) updateData.phoneNumber = updates.phoneNumber;
      if (updates.avatarUrl !== undefined) updateData.avatarUrl = updates.avatarUrl;
      if (updates.avatarHint !== undefined) updateData.avatarHint = updates.avatarHint;
      if (updates.profile) {
        if (updates.profile.locationPreference !== undefined) updateData.locationPreference = updates.profile.locationPreference;
        if (updates.profile.priceRange !== undefined) updateData.priceRange = updates.profile.priceRange;
        if (updates.profile.investmentGoals !== undefined) updateData.investmentGoals = updates.profile.investmentGoals;
        if (updates.profile.financialCapacity !== undefined) updateData.financialCapacity = updates.profile.financialCapacity;
        if (updates.profile.timeHorizon !== undefined) updateData.timeHorizon = updates.profile.timeHorizon;
      }
      if (updates.oauthProvider !== undefined) updateData.oauthProvider = updates.oauthProvider;

      const result = await updateUserAction(id, updateData);
      if (result.success && result.data) {
        setUsers(prev => prev.map(u => u.id === id ? result.data! : u));
        return;
      }
      throw new Error(result.error?.message || 'Failed to update user');
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }, []);

  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = await deleteUserAction(id);
      if (result.success) {
        setUsers(prev => prev.filter(u => u.id !== id));
        return true;
      }
      // If conflict (user is member of project), return false
      if (result.error?.code === 'CONFLICT') {
        return false;
      }
      throw new Error(result.error?.message || 'Failed to delete user');
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }, []);

  const getUser = useCallback((id: string) => {
    return users.find(u => u.id === id);
  }, [users]);

  // Projects CRUD
  // Load projects from API
  const loadProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      const result = await getProjects({ page: 1, limit: 1000 });
      if (result.success && result.data) {
        setProjects(result.data);
      } else {
        console.error('Failed to load projects:', result.error);
        // Fallback to mock data on error
        setProjects(mockProjects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects(mockProjects);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Projects CRUD
  const createProject = useCallback(async (project: Project) => {
    try {
      // Transform Project type ke createProjectSchema format
      const projectData = {
        propertyId: project.propertyId,
        propertyName: project.propertyName,
        propertyImageUrl: project.propertyImageUrl,
        propertyImageHint: project.propertyImageHint,
        status: project.status,
        kycProgress: project.progress.kyc,
        fundingProgress: project.progress.funding,
        legalProgress: project.progress.legal,
        closingProgress: project.progress.closing,
      };

      const result = await createProjectAction(projectData);
      if (result.success && result.data) {
        setProjects(prev => [...prev, result.data!]);
        return;
      }
      throw new Error(result.error?.message || 'Failed to create project');
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      const updateData: any = {};
      if (updates.propertyId !== undefined) updateData.propertyId = updates.propertyId;
      if (updates.propertyName !== undefined) updateData.propertyName = updates.propertyName;
      if (updates.propertyImageUrl !== undefined) updateData.propertyImageUrl = updates.propertyImageUrl;
      if (updates.propertyImageHint !== undefined) updateData.propertyImageHint = updates.propertyImageHint;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.progress) {
        if (updates.progress.kyc !== undefined) updateData.kycProgress = updates.progress.kyc;
        if (updates.progress.funding !== undefined) updateData.fundingProgress = updates.progress.funding;
        if (updates.progress.legal !== undefined) updateData.legalProgress = updates.progress.legal;
        if (updates.progress.closing !== undefined) updateData.closingProgress = updates.progress.closing;
      }

      const result = await updateProjectAction(id, updateData);
      if (result.success && result.data) {
        setProjects(prev => prev.map(p => p.id === id ? result.data! : p));
        return;
      }
      throw new Error(result.error?.message || 'Failed to update project');
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }, []);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = await deleteProjectAction(id);
      if (result.success) {
        setProjects(prev => prev.filter(p => p.id !== id));
        return true;
      }
      throw new Error(result.error?.message || 'Failed to delete project');
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }, []);

  const getProject = useCallback((id: string) => {
    return projects.find(p => p.id === id);
  }, [projects]);

  const verifyPayment = useCallback(async (projectId: string, planId: string, paymentId: string, adminUserId: string) => {
    try {
      const result = await verifyPaymentAction({
        paymentId,
        verifiedBy: adminUserId,
      });

      if (result.success && result.data) {
        // Reload projects untuk mendapatkan data terbaru
        await loadProjects();
        return true;
      }
      throw new Error(result.error?.message || 'Failed to verify payment');
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }, [loadProjects]);

  // Interests
  const updateInterest = useCallback(async (id: string, updates: Partial<PropertyInterest>) => {
    try {
      const result = await updatePropertyInterest(id, updates);
      if (result.success && result.data) {
        setInterests(prev => prev.map(i => i.id === id ? result.data! : i));
        // Trigger custom event to notify user context
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('interestUpdated'));
        }
        return;
      }
      throw new Error(result.error?.message || 'Failed to update interest');
    } catch (error) {
      console.error('Error updating interest:', error);
      throw error;
    }
  }, []);

  const getInterestsByProperty = useCallback((propertyId: string) => {
    return interests.filter(i => i.propertyId === propertyId);
  }, [interests]);

  // Property Submissions
  const createPropertySubmission = useCallback(async (submission: PropertySubmission) => {
    try {
      const result = await createPropertySubmissionAction({
        submittedBy: submission.submittedBy,
        type: submission.type,
        name: submission.name,
        description: submission.description,
        location: submission.location,
        totalArea: submission.totalArea,
        totalUnits: submission.totalUnits,
        unitSize: submission.unitSize,
        unitMeasure: submission.unitMeasure,
        askingPrice: submission.askingPrice,
        contactPerson: submission.contactPerson,
        contactPhone: submission.contactPhone,
        contactEmail: submission.contactEmail,
        images: submission.images?.map(img => ({ url: img.url, hint: img.hint })),
      });
      if (result.success && result.data) {
        setPropertySubmissions(prev => [...prev, result.data!]);
        return;
      }
      throw new Error(result.error?.message || 'Failed to create property submission');
    } catch (error) {
      console.error('Error creating property submission:', error);
      throw error;
    }
  }, []);

  const updatePropertySubmission = useCallback(async (id: string, updates: Partial<PropertySubmission>) => {
    try {
      const result = await updatePropertySubmissionAction(id, {
        ...updates,
        images: updates.images?.map(img => ({ url: img.url, hint: img.hint })),
      });
      if (result.success && result.data) {
        setPropertySubmissions(prev => prev.map(s => s.id === id ? result.data! : s));
        return;
      }
      throw new Error(result.error?.message || 'Failed to update property submission');
    } catch (error) {
      console.error('Error updating property submission:', error);
      throw error;
    }
  }, []);

  const deletePropertySubmission = useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = await deletePropertySubmissionAction(id);
      if (result.success) {
        setPropertySubmissions(prev => prev.filter(s => s.id !== id));
        return true;
      }
      throw new Error(result.error?.message || 'Failed to delete property submission');
    } catch (error) {
      console.error('Error deleting property submission:', error);
      return false;
    }
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
    interestsLoading,
    updateInterest,
    getInterestsByProperty,
    watchlists,
    propertySubmissions,
    propertySubmissionsLoading,
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

