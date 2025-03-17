import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, ScrollView, TouchableOpacity, Image } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { 
    userLocation, 
    notificationsEnabled, 
    toggleNotifications, 
    notificationRadius,
    updateNotificationRadius,
    userStats,
    pickupHistory
  } = useAppContext();
  
  // Local state to track slider value before committing the change
  const [sliderValue, setSliderValue] = useState(notificationRadius);

  const handleRadiusChange = (value: number) => {
    setSliderValue(value);
  };

  const handleRadiusChangeComplete = (value: number) => {
    updateNotificationRadius(value);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Image 
            source={require('../assets/images/Raccoon in Garden.png')} 
            style={styles.profileImage} 
            resizeMode="contain"
          />
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.trashPickedCount}</Text>
          <Text style={styles.statLabel}>Trash Picked</Text>
        </View>
      </View>
      
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Notifications</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={notificationsEnabled ? "#4CAF50" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleNotifications}
            value={notificationsEnabled}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Notification Radius</Text>
          <Text style={styles.settingValue}>{sliderValue.toFixed(1)} miles</Text>
        </View>
        
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={1.0}
            step={0.1}
            value={sliderValue}
            onValueChange={handleRadiusChange}
            onSlidingComplete={handleRadiusChangeComplete}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor="#4CAF50"
            disabled={!notificationsEnabled}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>0.1</Text>
            <Text style={styles.sliderLabel}>1.0</Text>
          </View>
        </View>
        
        {userLocation && (
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Current Location</Text>
            <Text style={styles.settingValue}>
              {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Pickup History</Text>
        
        {pickupHistory.length > 0 ? (
          pickupHistory.map(item => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyDot} />
              <View style={styles.historyContent}>
                <Text style={styles.historyDate}>{item.date}</Text>
                <Text style={styles.historyLocation}>{item.location}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyHistoryText}>No pickup history yet</Text>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Back to Map</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  profileImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  settingsSection: {
    backgroundColor: 'white',
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  sliderContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#999',
  },
  historySection: {
    backgroundColor: 'white',
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginTop: 5,
    marginRight: 10,
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  historyLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 15,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 30,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
