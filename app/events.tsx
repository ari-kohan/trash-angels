import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { Event } from '../types';
import { supabase } from '../lib/supabase';

export default function EventsScreen() {
  const { events, fetchEvents, isAuthenticated } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    loadEvents();
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);
  
  useEffect(() => {
    const subscription = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchEvents();
        }
      )
      .subscribe();
      
    subscriptionRef.current = subscription;
    
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchEvents]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      await fetchEvents();
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchEvents();
    } catch (error) {
      console.error('Error refreshing events:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchEvents]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get event status (upcoming, ongoing, past)
  const getEventStatus = (event: Event) => {
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

  // Get status color based on event status
  const getStatusColor = (status: string) => {
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

  // Navigate to event details
  const navigateToEventDetails = (eventId: string) => {
    router.push(`/event-details?id=${eventId}`);
  };

  // Render individual event item
  const renderEventItem = ({ item }: { item: Event }) => {
    const status = getEventStatus(item);
    const statusColor = getStatusColor(status);
    
    return (
      <TouchableOpacity 
        style={styles.eventCard}
        onPress={() => navigateToEventDetails(item.id)}
      >
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>
        
        <View style={styles.eventInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>{formatDate(item.start_time)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>{formatTime(item.start_time)} - {formatTime(item.end_time)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>Organized by {item.organizer_name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={16} color="#666" style={styles.infoIcon} />
            <Text style={styles.infoText}>{item.attendees ? item.attendees.length : 0} attending</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Trash Pickup Events</Text>
        <View style={styles.emptySpace} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : (
        <>
          {events.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No events found</Text>
              <Text style={styles.emptySubtext}>Be the first to organize a trash pickup event!</Text>
              
              {isAuthenticated && (
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => router.push('/create-event')}
                >
                  <Text style={styles.createButtonText}>Create Event</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              {isAuthenticated && (
                <TouchableOpacity 
                  style={styles.createEventButton}
                  onPress={() => router.push('/create-event')}
                >
                  <Ionicons name="add-circle" size={20} color="white" style={styles.createEventIcon} />
                  <Text style={styles.createEventText}>Create New Event</Text>
                </TouchableOpacity>
              )}
              
              <FlatList
                data={events}
                renderItem={renderEventItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#4CAF50']}
                    tintColor="#4CAF50"
                  />
                }
              />
            </>
          )}
          
          {events.length > 0 && (
            <TouchableOpacity
              style={[
                styles.fab,
                !isAuthenticated && styles.fabDisabled
              ]}
              onPress={() => router.push('/create-event')}
              disabled={!isAuthenticated}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    width: 34, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4CAF50',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, 
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventInfo: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  createEventButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  createEventIcon: {
    marginRight: 8,
  },
  createEventText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabDisabled: {
    opacity: 0.5,
  },
});
