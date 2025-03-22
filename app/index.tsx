import React from "react";
import { StyleSheet, View, Text, ActivityIndicator, Image, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import TrashMap from "../components/TrashMap";
import { useAppContext } from "../context/AppContext";
import { Ionicons } from "@expo/vector-icons";

export default function Index() {
  const { loading, error } = useAppContext();

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <Image 
          source={require('../assets/images/Raccoon in Garden.png')} 
          style={styles.loadingLogo} 
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading Trash Angels...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <TrashMap />
      
      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.fabEvents]}
          onPress={() => router.push('/events')}
        >
          <Ionicons name="list" size={24} color="white" />
          <Text style={styles.fabText}>View Events</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.fab, styles.fabCreate]}
          onPress={() => router.push('/create-event')}
        >
          <Ionicons name="calendar" size={24} color="white" />
          <Text style={styles.fabText}>Create Event</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  loadingLogo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'flex-end',
  },
  fab: {
    borderRadius: 28,
    width: 'auto',
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginBottom: 10,
  },
  fabCreate: {
    backgroundColor: '#4CAF50',
  },
  fabEvents: {
    backgroundColor: '#2196F3',
  },
  fabText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
  },
});
