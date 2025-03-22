import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Event } from '../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { sqlFound, profanityFound } from '@/utils/text_parsing';
import { Platform } from "react-native";

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { isAuthenticated, session } = useAppContext();
  const userId = session?.user?.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [attending, setAttending] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  
  // Edit form state
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [organizerName, setOrganizerName] = useState('');
  const [description, setDescription] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setEvent(data);
        
        // Check if user is the organizer
        if (userId && data.organizer_id === userId) {
          setIsOrganizer(true);
        }
        
        // Check if user is attending
        if (userId && data.attendees && data.attendees.includes(userId)) {
          setAttending(true);
        }
        
        // Set attendee count
        setAttendeeCount(data.attendees ? data.attendees.length : 0);
        
        // Initialize form data for editing
        setTitle(data.title);
        setLocation(data.location);
        setStartDate(new Date(data.start_time));
        setEndDate(new Date(data.end_time));
        setOrganizerName(data.organizer_name);
        setDescription(data.description || '');
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async () => {
    if (!isAuthenticated || !userId || !event) {
      Alert.alert('Error', 'You must be logged in to RSVP');
      return;
    }
    
    setSubmitting(true);
    try {
      const currentAttendees = event.attendees || [];
      let updatedAttendees;
      
      if (attending) {
        // Remove user from attendees
        updatedAttendees = currentAttendees.filter(id => id !== userId);
      } else {
        // Add user to attendees
        updatedAttendees = [...currentAttendees, userId];
      }
      
      const { error } = await supabase
        .from('events')
        .update({ attendees: updatedAttendees })
        .eq('id', event.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setAttending(!attending);
      setAttendeeCount(updatedAttendees.length);
      setEvent({
        ...event,
        attendees: updatedAttendees
      });
      
      Alert.alert(
        'Success', 
        attending ? 'You have cancelled your RSVP' : 'You have RSVP\'d to this event'
      );
    } catch (error) {
      console.error('Error updating RSVP:', error);
      Alert.alert('Error', 'Failed to update your RSVP');
    } finally {
      setSubmitting(false);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return false;
    }

    if (sqlFound(title) || profanityFound(title)) {
      Alert.alert('Error', 'Invalid title detected');
      return false;
    }

    if (!organizerName.trim()) {
      Alert.alert('Error', 'Please enter an organizer name');
      return false;
    }

    if (sqlFound(organizerName) || profanityFound(organizerName)) {
      Alert.alert('Error', 'Invalid organizer name detected');
      return false;
    }

    if (startDate >= endDate) {
      Alert.alert('Error', 'End time must be after start time');
      return false;
    }

    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return false;
    }

    if (sqlFound(location) || profanityFound(location)) {
      Alert.alert('Error', 'Invalid location detected');
      return false;
    }

    if (description && (sqlFound(description) || profanityFound(description))) {
      Alert.alert('Error', 'Invalid description detected');
      return false;
    }

    return true;
  };

  const handleUpdateEvent = async () => {
    if (!isAuthenticated || !isOrganizer || !event) {
      Alert.alert('Error', 'You must be the organizer to update this event');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({
          title,
          location,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          organizer_name: organizerName,
          description,
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setEvent({
        ...event,
        title,
        location,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        organizer_name: organizerName,
        description,
        updated_at: new Date().toISOString()
      });
      
      setEditMode(false);
      Alert.alert('Success', 'Event updated successfully');
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventStatus = () => {
    if (!event) return '';
    
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);
    
    if (now < startTime) {
      return 'Upcoming';
    } else if (now >= startTime && now <= endTime) {
      return 'Ongoing';
    } else {
      return 'Past';
    }
  };

  const getStatusColor = () => {
    const status = getEventStatus();
    switch (status) {
      case 'Upcoming':
        return '#2196F3'; // Blue
      case 'Ongoing':
        return '#4CAF50'; // Green
      case 'Past':
        return '#9E9E9E'; // Gray
      default:
        return '#000000';
    }
  };

  const toggleEditMode = () => {
    if (editMode) {
      // Exit edit mode without saving
      setEditMode(false);
    } else {
      // Enter edit mode and initialize form with current event data
      if (event) {
        setTitle(event.title);
        setDescription(event.description || '');
        setLocation(event.location);
        setStartDate(new Date(event.start_time));
        setEndDate(new Date(event.end_time));
        setOrganizerName(event.organizer_name);
        setEditMode(true);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: editMode ? 'Edit Event' : 'Event Details',
          headerRight: () => (
            isOrganizer && !editMode ? (
              <TouchableOpacity
                onPress={toggleEditMode}
                style={styles.headerButton}
              >
                <Ionicons name="create-outline" size={24} color="#4CAF50" />
              </TouchableOpacity>
            ) : null
          ),
        }}
      />
      
      <ScrollView style={styles.container}>
        {editMode ? (
          // Edit Mode Form
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Event Title"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Organizer Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                value={organizerName}
                onChangeText={setOrganizerName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter address"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.dateContainer}>
              <Text style={styles.label}>Start Time *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="datetime"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowStartDatePicker(false);
                    if (selectedDate) {
                      setStartDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.dateContainer}>
              <Text style={styles.label}>End Time *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {endDate.toLocaleDateString()} {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate}
                  mode="datetime"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowEndDatePicker(false);
                    if (selectedDate) {
                      setEndDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the event..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setEditMode(false)}
                disabled={submitting}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleUpdateEvent}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.buttonText}>Update Event</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // View Mode
          <View style={styles.detailsContainer}>
            <View style={styles.headerSection}>
              <Text style={styles.title}>{event.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.statusText}>{getEventStatus()}</Text>
              </View>
            </View>
            
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoText}>
                  {formatDate(event.start_time)} at {formatTime(event.start_time)}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoText}>
                  Until {formatDate(event.end_time)} at {formatTime(event.end_time)}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoText}>{event.location}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoText}>Organized by {event.organizer_name}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="people-outline" size={20} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoText}>{attendeeCount} people attending</Text>
              </View>
            </View>
            
            {event.description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>{event.description}</Text>
              </View>
            )}
            
            {isAuthenticated && (
              <View style={styles.actionSection}>
                {isOrganizer ? (
                  <TouchableOpacity 
                    style={styles.rsvpButton} 
                    onPress={toggleEditMode}
                  >
                    <Text style={styles.rsvpButtonText}>
                      Edit Event
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.rsvpButton} 
                    onPress={handleRSVP}
                  >
                    <Text style={styles.rsvpButtonText}>
                      {attending ? "Cancel RSVP" : "RSVP to this Event"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4CAF50',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerButton: {
    padding: 8,
  },
  detailsContainer: {
    padding: 16,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  descriptionSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  actionSection: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  rsvpButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 30,
    backgroundColor: '#4CAF50', 
  },
  attendButton: {
    backgroundColor: '#4CAF50',
  },
  cancelRsvpButton: {
    backgroundColor: '#F44336',
  },
  rsvpIcon: {
    marginRight: 8,
  },
  rsvpButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    marginTop: Platform.OS === 'ios' ? 40 : 0,
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
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
  dateContainer: {
    marginBottom: 16,
  },
  dateButton: {
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
