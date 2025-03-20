import React, { useState } from "react";
import { Button, Text, View, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";
import { router } from "expo-router";

WebBrowser.maybeCompleteAuthSession(); // required for web only
const redirectTo = makeRedirectUri();

const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) throw new Error(errorCode);
  const { access_token, refresh_token } = params;

  if (!access_token) return;

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return data.session;
};

interface AuthProps {
  email: string;
}

export default function Auth({ email }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle linking into app from email app.
  const url = Linking.useURL();
  if (url) {
    try {
      createSessionFromUrl(url).then(session => {
        if (session) {
          // Successfully authenticated, navigate back to profile
          router.push('/profile');
        }
      }).catch(err => {
        setError(err.message);
      });
    } catch (err: any) {
      setError(err.message);
    }
  }

  const sendMagicLink = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;
      
      // Magic link sent successfully
      return true;
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Error', err.message || 'Failed to send magic link');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button 
        onPress={sendMagicLink} 
        title={loading ? "Sending..." : "Send Magic Link"} 
        disabled={loading}
      />
      {loading && <ActivityIndicator style={styles.loader} color="#2196F3" />}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  loader: {
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  }
});