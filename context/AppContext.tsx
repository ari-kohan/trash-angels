import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { TrashLocation, UserLocation } from '../types';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

interface AppContextType {
  userLocation: UserLocation | null;
  trashLocations: TrashLocation[];
  addTrashLocation: (latitude: number, longitude: number, description?: string) => Promise<void>;
  markTrashAsPickedUp: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

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
            
            // Check for nearby trash
            checkForNearbyTrash(latitude, longitude);
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
  }, []);

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
      
      if (data && data.length > 0) {
        setTrashLocations(prev => [...prev, data[0]]);
      }
      
      // Notify nearby users
      notifyNearbyUsers(latitude, longitude);
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
      
      const { error } = await supabase
        .from('trash_locations')
        .update({ status: 'picked_up' })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state after successful database update
      setTrashLocations(prev => prev.filter(trash => trash.id !== id));
    } catch (err) {
      console.error('Error marking trash as picked up:', err);
      setError('Failed to mark trash as picked up');
    } finally {
      setLoading(false);
    }
  };

  const checkForNearbyTrash = (latitude: number, longitude: number) => {
    // Calculate distance to each trash location
    // If within 0.5 miles (approximately 804 meters), send notification
    const NOTIFICATION_RADIUS = 804; // meters
    
    trashLocations.forEach(trash => {
      const distance = calculateDistance(
        latitude,
        longitude,
        trash.latitude,
        trash.longitude
      );
      
      if (distance <= NOTIFICATION_RADIUS) {
        // Send notification for nearby trash
        sendTrashNotification(trash);
      }
    });
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

  const notifyNearbyUsers = async (latitude: number, longitude: number) => {
    // In a real app, this would be done server-side
    // Here we're simulating it for the current user
    
    // Get all users within 0.5 miles
    // For demo purposes, we'll just notify the current user
    sendTrashNotification({
      id: 'new-trash',
      latitude,
      longitude,
      created_at: new Date().toISOString(),
      created_by: 'current-user',
      status: 'active',
    });
  };

  const sendTrashNotification = async (trash: TrashLocation) => {
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
    <AppContext.Provider
      value={{
        userLocation,
        trashLocations,
        addTrashLocation,
        markTrashAsPickedUp,
        loading,
        error,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
