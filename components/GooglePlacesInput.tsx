import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Dimensions, ScrollView } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

interface GooglePlacesInputProps {
  placeholder?: string;
  initialValue?: string;
  onPlaceSelect: (address: string) => void;
}

export interface GooglePlacesInputRef {
  setAddressText: (address: string) => void;
  clear: () => void;
}

const GooglePlacesInput = forwardRef<GooglePlacesInputRef, GooglePlacesInputProps>(
  ({ placeholder = 'Enter address', initialValue = '', onPlaceSelect }, ref) => {
    const googlePlacesRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      setAddressText: (address: string) => {
        googlePlacesRef.current?.setAddressText(address);
      },
      clear: () => {
        googlePlacesRef.current?.clear();
      }
    }));

    useEffect(() => {
      if (initialValue && googlePlacesRef.current) {
        googlePlacesRef.current.setAddressText(initialValue);
      }
    }, [initialValue]);

    return (
      <View style={styles.container}>
<ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1 }}
    >
          <GooglePlacesAutocomplete
            ref={googlePlacesRef}
            placeholder={placeholder}
            fetchDetails={true}
            disableScroll={true}
            onPress={(data, details = null) => {
              onPlaceSelect(data.description);
            }}
            query={{
              key: process.env.EXPO_GOOGLE_MAPS_API_KEY,
              language: 'en',
            }}
            styles={{
              container: styles.autocompleteContainer,
              textInputContainer: styles.textInputContainer,
              textInput: styles.textInput,
              listView: styles.listView,
              row: styles.row,
              separator: styles.separator,
              description: styles.description,
              predefinedPlacesDescription: styles.predefinedPlacesDescription,
            }}
            enablePoweredByContainer={false}
            textInputProps={{
              autoCapitalize: 'none',
              autoCorrect: false,
            }}
            listViewDisplayed="auto"
            minLength={2}
            nearbyPlacesAPI="GooglePlacesSearch"
            debounce={300}
            keyboardShouldPersistTaps="handled"
          />
        </ScrollView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 0,
    position: 'relative',
    // zIndex: 9999,
    // elevation: 9999,
    //height: 200, // Fixed height for the container
  },
  scrollView: {
    flex: 1,
  },
  autocompleteContainer: {
    flex: 0,
    width: '100%',
    // zIndex: 9999,
    // elevation: 9999,
  },
  textInputContainer: {
    width: '100%',
  },
  textInput: {
    height: 50,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  listView: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    // zIndex: 9999,
    // elevation: 9999,
  },
  row: {
    padding: 13,
    height: 50,
    flexDirection: 'row',
  },
  separator: {
    height: 1,
    backgroundColor: '#c8c7cc',
  },
  description: {
    fontSize: 16,
  },
  predefinedPlacesDescription: {
    color: '#1faadb',
  },
});

export default GooglePlacesInput;
