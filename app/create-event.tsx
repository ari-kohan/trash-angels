import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Switch
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';

export default function CreateEventScreen() {
  const { userLocation, isAuthenticated, session } = useAppContext();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().getTime() + 2 * 60 * 60 * 1000)); // Default to 2 hours later
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [latitude, setLatitude] = useState(userLocation?.latitude || 0);
  const [longitude, setLongitude] = useState(userLocation?.longitude || 0);
  const [loading, setLoading] = useState(false);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handle date changes
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      
      // If end date is before start date, update end date
      if (endDate < selectedDate) {
        const newEndDate = new Date(selectedDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours after start
        setEndDate(newEndDate);
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  // Get location from address
  const getLocationFromAddress = async () => {
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return false;
    }

    try {
      const result = await Location.geocodeAsync(location);
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

  // Validate form
  const validateForm = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the event');
      return false;
    }

    if (!organizerName.trim()) {
      Alert.alert('Error', 'Please enter an organizer name');
      return false;
    }

    if (startDate >= endDate) {
      Alert.alert('Error', 'End time must be after start time');
      return false;
    }

    if (!useCurrentLocation) {
      return await getLocationFromAddress();
    }

    if (useCurrentLocation && (!userLocation?.latitude || !userLocation?.longitude)) {
      Alert.alert('Error', 'Current location is not available. Please enter a location manually.');
      setUseCurrentLocation(false);
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
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

    const isValid = await validateForm();
    if (!isValid) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          title,
          location: location.trim() || 'Current Location',
          latitude: useCurrentLocation ? userLocation?.latitude : latitude,
          longitude: useCurrentLocation ? userLocation?.longitude : longitude,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          organizer_id: session?.user.id,
          organizer_name: organizerName.trim(),
          description: description.trim() || null
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

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter event title"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Organizer Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter organizer name"
              value={organizerName}
              onChangeText={setOrganizerName}
              maxLength={100}
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Use Current Location</Text>
            <Switch
              value={useCurrentLocation}
              onValueChange={setUseCurrentLocation}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={useCurrentLocation ? '#2196F3' : '#f4f3f4'}
            />
          </View>

          {!useCurrentLocation && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter address"
                value={location}
                onChangeText={setLocation}
              />
            </View>
          )}

          <View style={styles.dateContainer}>
            <Text style={styles.label}>Start Time *</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#2196F3" />
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="datetime"
                display="default"
                onChange={onStartDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.dateContainer}>
            <Text style={styles.label}>End Time *</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#2196F3" />
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="datetime"
                display="default"
                onChange={onEndDateChange}
                minimumDate={startDate}
              />
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter event description, details, what to bring, etc."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Event</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.noteText}>
            * Required fields
          </Text>
        </View>
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
    width: 34, // Same width as the back button for proper centering
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
