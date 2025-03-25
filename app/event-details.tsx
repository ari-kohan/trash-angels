import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView,
  Platform,
  Linking
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { Event } from '../types';
import EventForm from '../components/EventForm';

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isAuthenticated, session, updateEvent } = useAppContext();
  const userId = session?.user?.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [attending, setAttending] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
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

  const handleUpdateEvent = async (eventData: Partial<Event>) => {
    if (!event) return;
    
    try {
      setSubmitting(true);
      
      await updateEvent(event.id, eventData);
      
      // Update local state
      setEvent({ ...event, ...eventData });
      
      // Exit edit mode
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

  const openMaps = (location: string) => {
    if (!location) {
      Alert.alert('Error', 'Location address not available');
      return;
    }

    const encodedLocation = encodeURIComponent(location);
    
    let url;
    if (Platform.OS === 'ios') {
      url = `maps:?q=${encodedLocation}`;
    } else {
      url = `geo:0,0?q=${encodedLocation}`;
    }

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        const browser_url = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
        return Linking.openURL(browser_url);
      }
    }).catch(err => {
      console.error('An error occurred', err);
      Alert.alert('Error', 'Could not open map application');
    });
  };

  const getEventStatus = (event: Event) => {
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
    if (!event) return '#999'; // Default gray color
    
    const status = getEventStatus(event);
    switch (status) {
      case 'Upcoming':
        return '#2196F3'; // Blue
      case 'Ongoing':
        return '#4CAF50'; // Green
      case 'Past':
        return '#9E9E9E'; // Gray
      default:
        return '#999'; // Default gray
    }
  };

  const toggleEditMode = () => {
    if (editMode) {
      // Exit edit mode without saving
      setEditMode(false);
    } else {
      // Enter edit mode and initialize form with current event data
      if (event) {
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
      
      <View style={styles.container}>
        {editMode ? (
          // Edit Mode Form
          <EventForm
            initialData={event}
            onSubmit={handleUpdateEvent}
            onCancel={() => setEditMode(false)}
            submitButtonText="Update Event"
            isLoading={submitting}
          />
        ) : (
          // View Mode
          <View style={styles.detailsContainer}>
            <View style={styles.headerSection}>
              <Text style={styles.title}>{event.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.statusText}>{getEventStatus(event)}</Text>
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
              
              <TouchableOpacity 
                style={styles.infoRow}
                onPress={() => openMaps(event.location)}
              >
                <Ionicons name="location-outline" size={20} color="#666" style={styles.infoIcon} />
                <Text style={[styles.infoText, styles.linkText]}>{event.location}</Text>
                <Ionicons name="navigate-outline" size={16} color="#4CAF50" style={{marginLeft: 5}} />
              </TouchableOpacity>
              
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
            
            {isAuthenticated && event && getEventStatus(event) !== 'Past' && (
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
      </View>
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
  linkText: {
    color: '#2196F3',
    textDecorationLine: 'underline',
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
});
