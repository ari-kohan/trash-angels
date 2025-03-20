import { Stack, SplashScreen } from "expo-router";
import { AppProvider } from "../context/AppContext";
import * as Notifications from 'expo-notifications';
import { useEffect } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Configure the linking
export const scheme = "com.supabase";

export default function RootLayout() {
  useEffect(() => {
    // Configure for iOS
    if (Platform.OS === 'ios') {
      Notifications.setNotificationCategoryAsync('trash', [
        {
          identifier: 'mark-picked',
          buttonTitle: 'Mark as Picked Up',
          options: {
            opensAppToForeground: true,
          },
        },
      ]);
    }
    
    // Hide the splash screen
    SplashScreen.hideAsync();
  }, []);

  return (
    <AppProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShown: false, // Hide the default header since we have a custom one
        }}
      />
    </AppProvider>
  );
}
