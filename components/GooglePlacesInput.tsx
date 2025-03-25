import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

interface GooglePlacesInputProps {
  placeholder?: string;
  initialValue?: string;
  onPlaceSelect: (address: string, latitude?: number, longitude?: number) => void;
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
        <GooglePlacesAutocomplete
          ref={googlePlacesRef}
          placeholder={placeholder}
          fetchDetails={true}
          disableScroll={true}
          onPress={(data, details = null) => {
            onPlaceSelect(data.description);
          }}
          query={{
            key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            language: 'en',
          }}
          textInputProps={{
            autoCapitalize: 'none',
            autoCorrect: false,
            onChangeText: (text) => {
              console.log('Input text changed:', text);
            },
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
          listViewDisplayed="auto"
          minLength={2}
          nearbyPlacesAPI="GooglePlacesSearch"
          debounce={300}
          keyboardShouldPersistTaps="always"
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 0,
    position: 'relative',
    zIndex: 10000,
    elevation: 10000,
  },
  autocompleteContainer: {
    flex: 0,
    width: '100%',
    zIndex: 10000,
    elevation: 10000,
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
    zIndex: 10000,
    elevation: 10000,
    position: 'absolute',
    width: '100%',
    top: 50,
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
