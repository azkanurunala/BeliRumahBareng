'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Property, User, Project } from '@/lib/types';
import { mockProperties, mockUsers, mockProjects } from '@/lib/mock-data';

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
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [projects, setProjects] = useState<Project[]>(mockProjects);

  // Properties CRUD
  const createProperty = useCallback((property: Property) => {
    setProperties(prev => [...prev, property]);
  }, []);

  const updateProperty = useCallback((id: string, updates: Partial<Property>) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProperty = useCallback((id: string) => {
    // Check if property is used in any project
    const isUsed = projects.some(p => p.propertyId === id);
    if (isUsed) {
      return false; // Cannot delete if used in project
    }
    setProperties(prev => prev.filter(p => p.id !== id));
    return true;
  }, [projects]);

  const getProperty = useCallback((id: string) => {
    return properties.find(p => p.id === id);
  }, [properties]);

  // Users CRUD
  const createUser = useCallback((user: User) => {
    setUsers(prev => [...prev, user]);
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }, []);

  const deleteUser = useCallback((id: string) => {
    // Check if user is member of any project
    const isMember = projects.some(p => p.members.some(m => m.id === id));
    if (isMember) {
      return false; // Cannot delete if member of project
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    return true;
  }, [projects]);

  const getUser = useCallback((id: string) => {
    return users.find(u => u.id === id);
  }, [users]);

  // Projects CRUD
  const createProject = useCallback((project: Project) => {
    setProjects(prev => [...prev, project]);
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        // If propertyId changed, update propertyName and images
        if (updates.propertyId && updates.propertyId !== p.propertyId) {
          const property = properties.find(prop => prop.id === updates.propertyId);
          if (property) {
            updated.propertyName = property.name;
            updated.propertyImageUrl = property.images[0]?.url || '';
            updated.propertyImageHint = property.images[0]?.hint || '';
          }
        }
        // If members changed, update members array
        if (updates.members) {
          const memberIds = updates.members as string[];
          const memberObjects = users.filter(u => memberIds.includes(u.id));
          updated.members = memberObjects;
        }
        return updated;
      }
      return p;
    }));
  }, [properties, users]);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    return true;
  }, []);

  const getProject = useCallback((id: string) => {
    return projects.find(p => p.id === id);
  }, [projects]);

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

