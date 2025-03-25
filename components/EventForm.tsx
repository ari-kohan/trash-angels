import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  InputAccessoryView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../types';
import { sqlFound, profanityFound } from '@/utils/text_parsing';
import 'react-native-get-random-values';
import GooglePlacesInput, { GooglePlacesInputRef } from './GooglePlacesInput';
import DatePicker from 'react-native-date-picker';
import FormField from './FormField';
import DateTimeField from './DateTimeField';

interface EventFormProps {
  initialData?: Partial<Event>;
  onSubmit: (data: Partial<Event>) => void;
  onCancel?: () => void;
  submitButtonText?: string;
  isLoading?: boolean;
}

const EventForm: React.FC<EventFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  submitButtonText,
  isLoading = false
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [latitude, setLatitude] = useState<number | undefined>(initialData?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(initialData?.longitude);
  const [startDate, setStartDate] = useState(initialData?.start_time ? new Date(initialData.start_time) : new Date());
  const [endDate, setEndDate] = useState(initialData?.end_time ? new Date(initialData.end_time) : new Date(new Date().getTime() + 2 * 60 * 60 * 1000));
  const [organizerName, setOrganizerName] = useState(initialData?.organizer_name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Reference to GooglePlacesInput component
  const googlePlacesRef = useRef<GooglePlacesInputRef>(null);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle start date change
  const handleStartDateChange = (selectedDate: Date) => {
    // Preserve the time from the existing startDate
    const newDate = new Date(selectedDate);
    newDate.setHours(startDate.getHours());
    newDate.setMinutes(startDate.getMinutes());
    newDate.setSeconds(startDate.getSeconds());
    setStartDate(newDate);
    
    // If end date is before start date, update end date
    if (endDate < newDate) {
      const newEndDate = new Date(newDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours after start
      setEndDate(newEndDate);
    }
    
    validateField('startDate', newDate);
    validateField('endDate', endDate);
  };

  // Handle start time change
  const handleStartTimeChange = (selectedTime: Date) => {
    // Preserve the date from the existing startDate
    const newDate = new Date(startDate);
    newDate.setHours(selectedTime.getHours());
    newDate.setMinutes(selectedTime.getMinutes());
    setStartDate(newDate);
    
    // If end date is before start date, update end date
    if (endDate < newDate) {
      const newEndDate = new Date(newDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours after start
      setEndDate(newEndDate);
    }
    
    validateField('startDate', newDate);
    validateField('endDate', endDate);
  };

  // Handle end date change
  const handleEndDateChange = (selectedDate: Date) => {
    // Preserve the time from the existing endDate
    const newDate = new Date(selectedDate);
    newDate.setHours(endDate.getHours());
    newDate.setMinutes(endDate.getMinutes());
    newDate.setSeconds(endDate.getSeconds());
    setEndDate(newDate);
    
    validateField('endDate', newDate);
  };

  // Handle end time change
  const handleEndTimeChange = (selectedTime: Date) => {
    // Preserve the date from the existing endDate
    const newDate = new Date(endDate);
    newDate.setHours(selectedTime.getHours());
    newDate.setMinutes(selectedTime.getMinutes());
    setEndDate(newDate);
    
    validateField('endDate', newDate);
  };

  // Validate a single field
  const validateField = (field: string, value: any) => {
    let errors = { ...formErrors };
    
    switch (field) {
      case 'title':
        if (!value.trim()) {
          errors.title = 'Please enter a title';
        } else if (sqlFound(value) || profanityFound(value)) {
          errors.title = 'Invalid title detected';
        } else {
          delete errors.title;
        }
        break;
        
      case 'organizerName':
        if (!value.trim()) {
          errors.organizerName = 'Please enter an organizer name';
        } else if (sqlFound(value) || profanityFound(value)) {
          errors.organizerName = 'Invalid organizer name detected';
        } else {
          delete errors.organizerName;
        }
        break;
        
      case 'location':
        if (!value.trim()) {
          errors.location = 'Please enter a location';
        } else if (sqlFound(value) || profanityFound(value)) {
          errors.location = 'Invalid location detected';
        } else {
          delete errors.location;
        }
        break;
        
      case 'startDate':
      case 'endDate':
        if (startDate >= endDate) {
          errors.endDate = 'End time must be after start time';
        } else {
          delete errors.endDate;
        }
        break;
        
      case 'description':
        if (value && (sqlFound(value) || profanityFound(value))) {
          errors.description = 'Invalid description detected';
          delete errors.description;
        }
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate all fields
  const validateForm = () => {
    // Validate all fields
    const titleValid = validateField('title', title);
    const organizerNameValid = validateField('organizerName', organizerName);
    const locationValid = validateField('location', location);
    const datesValid = validateField('endDate', endDate);
    const descriptionValid = validateField('description', description);
    
    return titleValid && organizerNameValid && locationValid && datesValid && descriptionValid;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      Alert.alert('Error', 'Please fix the errors in the form');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Submit form data
      await onSubmit({
        title: title.trim(),
        location: location.trim(),
        // latitude: latitude,
        // longitude: longitude,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        organizer_name: organizerName.trim(),
        description: description.trim() || undefined
      });
    } catch (error: any) {
      console.error('Error submitting event form:', error);
      Alert.alert('Error', error.message || 'Failed to submit event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.formContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        <FormField
          label="Event Title *"
          placeholder="Enter event title"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            validateField('title', text);
          }}
          error={formErrors.title}
        />

        <FormField
          label="Organizer Name *"
          placeholder="Enter organizer name"
          value={organizerName}
          onChangeText={(text) => {
            setOrganizerName(text);
            validateField('organizerName', text);
          }}
          error={formErrors.organizerName}
        />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location *</Text>
          <GooglePlacesInput
            ref={googlePlacesRef}
            initialValue={location}
            onPlaceSelect={(address, lat, lng) => {
              setLocation(address);
              setLatitude(lat);
              setLongitude(lng);
              validateField('location', address);
            }}
          />
          {formErrors.location && <Text style={styles.errorText}>{formErrors.location}</Text>}
        </View>

        <DateTimeField
          label="Start Date and Time *"
          date={startDate}
          onDateChange={handleStartDateChange}
          onTimeChange={handleStartTimeChange}
        />

        <DateTimeField
          label="End Date and Time *"
          date={endDate}
          onDateChange={handleEndDateChange}
          onTimeChange={handleEndTimeChange}
          error={formErrors.endDate}
          minDate={startDate}
        />

        <FormField
          label="Description (Optional)"
          placeholder="Enter event description, details, what to bring, etc."
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            validateField('description', text);
          }}
          multiline={true}
          numberOfLines={4}
          error={formErrors.description}
        />
        
        <View style={styles.buttonRow}>
          {onCancel && (
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={submitting || isLoading}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.button, styles.submitButton, onCancel ? { flex: 1 } : { width: '100%' }]}
            onPress={handleSubmit}
            disabled={submitting || isLoading}
          >
            {(submitting || isLoading) ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{submitButtonText || 'Submit'}</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.noteText}>
          * Required fields
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeColumn: {
    flex: 1,
    marginRight: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#F44336',
    marginTop: 4,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
    marginRight: 8,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flex: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  noteText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default EventForm;
