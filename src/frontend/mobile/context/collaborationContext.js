// collaborationContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateCollaborationStatus } from '../backend/db/API';

const CollaborationContext = createContext();

export const CollaborationProvider = ({ children }) => {
  const [collaborationStatuses, setCollaborationStatuses] = useState({});

  // Load saved statuses on app start
  useEffect(() => {
    const loadSavedStatuses = async () => {
      try {
        const savedData = await AsyncStorage.getItem('collaboration_statuses');
        if (savedData) {
          setCollaborationStatuses(JSON.parse(savedData));
        }
      } catch (error) {
        console.error('Error loading collaboration statuses:', error);
      }
    };
    
    loadSavedStatuses();
  }, []);

  const updateCollaborationStatus = async (sellerId, influencerId, status) => {
    try {
      // Create a unique key for this collaboration
      const key = `${sellerId}_${influencerId}`;
      
      // Update local state
      const updatedStatuses = {
        ...collaborationStatuses,
        [key]: status
      };
      setCollaborationStatuses(updatedStatuses);
      
      // Persist to AsyncStorage
      await AsyncStorage.setItem('collaboration_statuses', JSON.stringify(updatedStatuses));
      
      // Also update the backend
      try {
        // Call your existing backend update function 
        await updateCollaborationStatus(sellerId, influencerId, status);
      } catch (apiError) {
        console.error('Backend update failed:', apiError);
      }
      
      return status;
    } catch (error) {
      console.error('Error updating collaboration status:', error);
      throw error;
    }
  };

  const getCollaborationStatus = (sellerId, influencerId) => {
    const key = `${sellerId}_${influencerId}`;
    return collaborationStatuses[key] || null;
  };

  return (
    <CollaborationContext.Provider value={{ 
      updateCollaborationStatus, 
      getCollaborationStatus,
      collaborationStatuses
    }}>
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = () => useContext(CollaborationContext);