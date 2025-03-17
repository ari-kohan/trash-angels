import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { TrashLocation, UserLocation } from '../types';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types for user stats and pickup history
export interface UserStats {
  trashPickedCount: number;
  lastPickup: string;
}

export interface PickupHistoryItem {
  id: string;
  date: string;
  location: string;
}

interface AppContextType {
  userLocation: UserLocation | null;
  trashLocations: TrashLocation[];
  addTrashLocation: (latitude: number, longitude: number, description?: string) => Promise<void>;
  markTrashAsPickedUp: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  notificationRadius: number; // in miles
  updateNotificationRadius: (radius: number) => void;
  userStats: UserStats;
  pickupHistory: PickupHistoryItem[];
  updateUserStats: (stats: Partial<UserStats>) => Promise<void>;
  addPickupHistoryItem: (item: PickupHistoryItem) => Promise<void>;
}

// Storage keys
const USER_STATS_KEY = '@trash_angels:user_stats';
const PICKUP_HISTORY_KEY = '@trash_angels:pickup_history';
const NOTIFICATIONS_ENABLED_KEY = '@trash_angels:notifications_enabled';
const NOTIFICATION_RADIUS_KEY = '@trash_angels:notification_radius';

// Initial sample data
const initialUserStats: UserStats = {
  trashPickedCount: 0,
  lastPickup: '',
};

const initialPickupHistory: PickupHistoryItem[] = [];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [trashLocations, setTrashLocations] = useState<TrashLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [notificationRadius, setNotificationRadius] = useState<number>(0.2); // Default to 0.2 miles
  const [userStats, setUserStats] = useState<UserStats>({
    trashPickedCount: 0,
    lastPickup: '',
  });
  const [pickupHistory, setPickupHistory] = useState<PickupHistoryItem[]>([]);

  // Initialize local storage with sample data if it doesn't exist
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Check if user stats exist
        const storedUserStats = await AsyncStorage.getItem(USER_STATS_KEY);
        if (!storedUserStats) {
          // Initialize with sample data
          await AsyncStorage.setItem(USER_STATS_KEY, JSON.stringify(initialUserStats));
          setUserStats(initialUserStats);
        } else {
          setUserStats(JSON.parse(storedUserStats));
        }

        // Check if pickup history exists
        const storedPickupHistory = await AsyncStorage.getItem(PICKUP_HISTORY_KEY);
        if (!storedPickupHistory) {
          // Initialize with sample data
          await AsyncStorage.setItem(PICKUP_HISTORY_KEY, JSON.stringify(initialPickupHistory));
          setPickupHistory(initialPickupHistory);
        } else {
          setPickupHistory(JSON.parse(storedPickupHistory));
        }

        // Load notification settings
        const storedNotificationsEnabled = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
        if (storedNotificationsEnabled !== null) {
          setNotificationsEnabled(JSON.parse(storedNotificationsEnabled));
        } else {
          await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, JSON.stringify(true));
        }

        const storedNotificationRadius = await AsyncStorage.getItem(NOTIFICATION_RADIUS_KEY);
        if (storedNotificationRadius !== null) {
          setNotificationRadius(JSON.parse(storedNotificationRadius));
        } else {
          await AsyncStorage.setItem(NOTIFICATION_RADIUS_KEY, JSON.stringify(0.2));
        }
      } catch (err) {
        console.error('Error initializing stored data:', err);
      }
    };

    initializeStorage();
  }, []);

  // Update user stats
  const updateUserStats = async (stats: Partial<UserStats>) => {
    try {
      const updatedStats = { ...userStats, ...stats };
      setUserStats(updatedStats);
      await AsyncStorage.setItem(USER_STATS_KEY, JSON.stringify(updatedStats));
    } catch (err) {
      console.error('Error updating user stats:', err);
    }
  };

  // Add pickup history item
  const addPickupHistoryItem = async (item: PickupHistoryItem) => {
    try {
      const updatedHistory = [item, ...pickupHistory];
      setPickupHistory(updatedHistory);
      await AsyncStorage.setItem(PICKUP_HISTORY_KEY, JSON.stringify(updatedHistory));
      
      // Also update the user stats
      await updateUserStats({
        trashPickedCount: userStats.trashPickedCount + 1,
        lastPickup: item.date
      });
    } catch (err) {
      console.error('Error adding pickup history item:', err);
    }
  };

  const toggleNotifications = async () => {
    try {
      const newValue = !notificationsEnabled;
      setNotificationsEnabled(newValue);
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, JSON.stringify(newValue));
    } catch (err) {
      console.error('Error toggling notifications:', err);
    }
  };

  const updateNotificationRadius = async (radius: number) => {
    try {
      setNotificationRadius(radius);
      await AsyncStorage.setItem(NOTIFICATION_RADIUS_KEY, JSON.stringify(radius));
    } catch (err) {
      console.error('Error updating notification radius:', err);
    }
  };

  // Setup notifications
  useEffect(() => {
    async function setupNotifications() {
      try {
        await registerForPushNotificationsAsync();
        
        // Listen for notifications
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
          console.log(notification);
        });

        return () => {
          Notifications.removeNotificationSubscription(notificationListener);
        };
      } catch (err) {
        console.error('Error setting up notifications:', err);
      }
    }

    setupNotifications();
  }, []);

  // Get user location
  useEffect(() => {
    async function setupLocation() {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        
        setUserLocation({
          id: 'current-user', // This would be the actual user ID in a real app
          latitude,
          longitude,
          last_updated: new Date().toISOString(),
        });

        // Start watching position
        const locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10, // Update every 10 meters
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            setUserLocation(prev => prev ? {
              ...prev,
              latitude,
              longitude,
              last_updated: new Date().toISOString(),
            } : null);
          }
        );

        return () => {
          if (locationSubscription) {
            locationSubscription.remove();
          }
        };
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Failed to get location');
      } finally {
        setLoading(false);
      }
    }

    setupLocation();
  }, []);

  // Fetch trash locations from Supabase
  useEffect(() => {
    fetchTrashLocations();

    // Set up realtime subscription for new trash locations
    const trashSubscription = supabase
      .channel('trash_locations_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trash_locations',
        },
        (payload) => {
          console.log('New trash location added:', payload);
          
          // Add the new trash location to the state
          const newTrash = payload.new as TrashLocation;
          setTrashLocations(prev => [...prev, newTrash]);
          
          // Only check if we should notify if we have user location
          if (userLocation && notificationsEnabled) {
            // Check if the new trash is within notification radius
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              newTrash.latitude,
              newTrash.longitude
            );
            
            // Convert notification radius from miles to meters
            const radiusInMeters = notificationRadius * 1609.34;
            
            // If within radius, send notification
            if (distance <= radiusInMeters) {
              sendTrashNotification(newTrash);
            }
          }
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(trashSubscription);
    };
  }, [userLocation, notificationsEnabled, notificationRadius]);

  const fetchTrashLocations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('trash_locations')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      
      setTrashLocations(data || []);
    } catch (err) {
      console.error('Error fetching trash locations:', err);
      setError('Failed to fetch trash locations');
    } finally {
      setLoading(false);
    }
  };

  const addTrashLocation = async (latitude: number, longitude: number, description?: string) => {
    try {
      setLoading(true);
      
      // Create a new trash location      
      console.log('Adding new trash location:', { latitude, longitude, description });
      const { data, error } = await supabase
        .from('trash_locations')
        .insert([{
          latitude,
          longitude,
          created_at: new Date().toISOString(),
          status: 'active',
          description,
        }])
        .select();
      
      if (error) throw error;
      
    } catch (err) {
      console.error('Error adding trash location:', err);
      setError('Failed to add trash location');
    } finally {
      setLoading(false);
    }
  };

  const markTrashAsPickedUp = async (id: string) => {
    try {
      setLoading(true);
      
      // Get the trash location details before updating
      const { data: trashData, error: fetchError } = await supabase
        .from('trash_locations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update the trash location status in Supabase
      const { error } = await supabase
        .from('trash_locations')
        .update({ status: 'picked_up' })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setTrashLocations(prev => prev.filter(item => item.id !== id));
      
      // Add to pickup history
      if (trashData) {
        await addPickupHistoryItem({
          id: trashData.id,
          date: new Date().toISOString().split('T')[0],
          location: trashData.description || `Location (${trashData.latitude.toFixed(4)}, ${trashData.longitude.toFixed(4)})`
        });

      }
      
    } catch (err) {
      console.error('Error marking trash as picked up:', err);
      setError('Failed to mark trash as picked up');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    // Haversine formula to calculate distance between two points
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // in meters
  };

  const sendTrashNotification = async (trash: TrashLocation) => {
    // Double-check that notifications are enabled before sending
    if (!notificationsEnabled) return;
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Trash Nearby!',
          body: `There's trash that needs to be picked up nearby. Be an angel and help clean up!`,
          data: { trash },
        },
        trigger: null, // Send immediately
      });
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };

  async function registerForPushNotificationsAsync() {
    let token;
  
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
  
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
  
    if (finalStatus !== 'granted') {
      Alert.alert('Failed to get push token for push notification!');
      return;
    }
  
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log(token);
    } catch (err) {
      console.error('Error getting push token:', err);
    }
  
    return token;
  }

  return (
    <AppContext.Provider value={{
      userLocation,
      trashLocations,
      addTrashLocation,
      markTrashAsPickedUp,
      loading,
      error,
      notificationsEnabled,
      toggleNotifications,
      notificationRadius,
      updateNotificationRadius,
      userStats,
      pickupHistory,
      updateUserStats,
      addPickupHistoryItem
    }}>
      {children}
    </AppContext.Provider>
  );
};
