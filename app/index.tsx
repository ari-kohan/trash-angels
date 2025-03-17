import React from "react";
import { StyleSheet, View, Text, ActivityIndicator, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import TrashMap from "../components/TrashMap";
import { useAppContext } from "../context/AppContext";

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
});
