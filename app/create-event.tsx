import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import * as Location from 'expo-location';
import EventForm from '../components/EventForm';
import { Event } from '../types';

export default function CreateEventScreen() {
  const { userLocation, isAuthenticated, session } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [latitude, setLatitude] = useState(userLocation?.latitude || 0);
  const [longitude, setLongitude] = useState(userLocation?.longitude || 0);

  // Get location from address
  const getLocationFromAddress = async (address: string) => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return false;
    }

    try {
      const result = await Location.geocodeAsync(address);
      if (result.length > 0) {
        setLatitude(result[0].latitude);
        setLongitude(result[0].longitude);
        return true;
      } else {
        Alert.alert('Error', 'Could not find coordinates for this location. Please try a different address.');
        return false;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      Alert.alert('Error', 'Could not convert address to coordinates. Please try again.');
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (eventData: Partial<Event>) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required', 
        'You need to create an account to create events.',
        [
          { 
            text: 'Sign Up', 
            onPress: () => router.push('/register') 
          },
          { 
            text: 'Cancel', 
            style: 'cancel' 
          }
        ]
      );
      return;
    }

    // Process location if needed
    if (!useCurrentLocation) {
      const locationValid = await getLocationFromAddress(eventData.location || '');
      if (!locationValid) return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          latitude: useCurrentLocation ? userLocation?.latitude : latitude,
          longitude: useCurrentLocation ? userLocation?.longitude : longitude,
          organizer_id: session?.user.id,
        })
        .select();

      if (error) throw error;

      Alert.alert(
        'Success',
        'Your trash pickup event has been created!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert('Error', error.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Trash Pickup Event</Text>
          <View style={styles.emptySpace} />
        </View>

        <EventForm
          onSubmit={handleSubmit}
          submitButtonText="Create Event"
          isLoading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  emptySpace: {
    width: 30,
  },
});
