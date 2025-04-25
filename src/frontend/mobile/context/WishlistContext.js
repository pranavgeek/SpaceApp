// ✅ WishlistContext.js (Per-user Wishlist support)
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProjectId } from './projectIdHelper';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState({});
  const [loading, setLoading] = useState(true);

  const userKey = user?.user_id ? `wishlist_user_${user.user_id}` : 'wishlist_default';

  // Load wishlist for current user
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const stored = await AsyncStorage.getItem(userKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          const cleaned = Object.entries(parsed).reduce((acc, [key, val]) => {
            const id = getProjectId(val.project);
            if (id) acc[id] = val;
            return acc;
          }, {});
          setWishlistItems(cleaned);
        } else {
          setWishlistItems({});
        }
      } catch (e) {
        console.error('Error loading wishlist:', e);
      } finally {
        setLoading(false);
      }
    };
    if (user?.user_id) loadWishlist();
  }, [user?.user_id]);

  // Save wishlist whenever it changes
  useEffect(() => {
    const saveWishlist = async () => {
      try {
        await AsyncStorage.setItem(userKey, JSON.stringify(wishlistItems));
      } catch (e) {
        console.error('Error saving wishlist:', e);
      }
    };
    if (!loading && user?.user_id) {
      saveWishlist();
    }
  }, [wishlistItems, loading, user?.user_id]);

  const toggleWishlistItem = (item) => {
    const projectId = getProjectId(item.project);
    if (!projectId) return;

    setWishlistItems((prev) => {
      const updated = { ...prev };
      if (updated[projectId]) {
        delete updated[projectId];
      } else {
        updated[projectId] = item;
      }
      return updated;
    });
  };

  const isInWishlist = (projectId) => {
    return Boolean(wishlistItems[projectId]);
  };

  const getWishlist = () => Object.values(wishlistItems);

  return (
    <WishlistContext.Provider
      value={{ wishlistItems, loading, toggleWishlistItem, isInWishlist, getWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
