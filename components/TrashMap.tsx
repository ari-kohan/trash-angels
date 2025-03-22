import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert, Platform, Image } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { TrashLocation } from '../types';
import { router } from 'expo-router';
import * as Location from 'expo-location';

interface TrashMapProps {
  initialRegion?: Region;
}

const TrashMap: React.FC<TrashMapProps> = ({ 
  initialRegion = {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }
}) => {
  const { userLocation, trashLocations, addTrashLocation, markTrashAsPickedUp } = useAppContext();
  const [region, setRegion] = useState<Region>(initialRegion);
  const [selectedTrash, setSelectedTrash] = useState<TrashLocation | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState<boolean>(false);
  const mapRef = useRef<MapView>(null);

  // Request location permission and update map region when user location changes
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationPermissionDenied(true);
          Alert.alert(
            'Location Permission Denied',
            'To use your current location on the map, please enable location permissions in your device settings.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
      }
    };

    requestLocationPermission();
  }, []);

  // Update map region when user location changes
  useEffect(() => {
    if (userLocation && !locationPermissionDenied && mapRef.current) {
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      
      // Only animate to the user's location on the first location update
      // This prevents the map from constantly jumping back to the user's location
      if (region === initialRegion) {
        mapRef.current.animateToRegion(newRegion);
      }
    }
  }, [userLocation, locationPermissionDenied]);

  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
  };

  const handleAddTrash = () => {
    if (!userLocation) {
      Alert.alert(
        'Location Not Available',
        'Unable to determine your current location. Please try again later.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.prompt(
      'Log Trash',
      'Please provide a brief description of the trash',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Add',
          onPress: (description?: string) => {
            // Use the user's current location to add trash
            addTrashLocation(
              userLocation.latitude,
              userLocation.longitude,
              description || 'Trash needs to be picked up'
            );
            
            // Center the map on the new trash location
            if (mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
            }
            
            // Show confirmation
            Alert.alert(
              'Trash Logged',
              'Thank you for logging trash! Nearby angels will be notified.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const handleTrashPress = (trash: TrashLocation) => {
    setSelectedTrash(trash);
  };

  const handleMarkAsPickedUp = () => {
    if (selectedTrash) {
      Alert.alert(
        'Confirm Pickup',
        'Have you picked up this trash?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Yes, I picked it up',
            onPress: () => {
              markTrashAsPickedUp(selectedTrash.id);
              setSelectedTrash(null);
              
              // Show thank you message
              Alert.alert(
                'Thank You!',
                'You\'re a Trash Angel! Thank you for making the world cleaner.',
                [{ text: 'OK' }]
              );
            },
          },
        ]
      );
    }
  };

  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      Alert.alert(
        'Location Not Available',
        'Unable to determine your current location. Please make sure location services are enabled.',
        [{ text: 'OK' }]
      );
    }
  };

  const navigateToProfile = () => {
    router.push('/profile');
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={true}
      >
        {trashLocations.map((trash) => (
          <Marker
            key={trash.id}
            coordinate={{
              latitude: trash.latitude,
              longitude: trash.longitude,
            }}
            pinColor="red"
            onPress={() => handleTrashPress(trash)}
          />
        ))}
      </MapView>

      {/* Header with title and profile button */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Image 
            source={require('../assets/images/icon.png')} 
            style={styles.logoImage} 
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Trash Angels</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={navigateToProfile}
        >
          <Ionicons name="person-circle" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Floating action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={centerOnUserLocation}
        >
          <Ionicons name="locate" size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.floatingButton, styles.addButton]}
          onPress={handleAddTrash}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Selected trash info */}
      {selectedTrash && (
        <View style={styles.trashInfoContainer}>
          <Text style={styles.trashInfoText}>
            {selectedTrash.description || 'Trash needs to be picked up here'}
          </Text>
          <Text style={styles.trashInfoDate}>
            Reported: {new Date(selectedTrash.created_at).toLocaleDateString()}
          </Text>
          <TouchableOpacity
            style={styles.pickupButton}
            onPress={handleMarkAsPickedUp}
          >
            <Text style={styles.pickupButtonText}>Mark as Picked Up</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 30,
    height: 30,
    marginRight: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 5,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  trashInfoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 90,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  trashInfoText: {
    fontSize: 16,
    marginBottom: 8,
  },
  trashInfoDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  pickupButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  pickupButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default TrashMap;
