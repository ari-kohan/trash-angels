import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  InputAccessoryView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
//import DateTimePicker from '@react-native-community/datetimepicker';
import { Event } from '../types';
import { sqlFound, profanityFound } from '@/utils/text_parsing';
import 'react-native-get-random-values';
import GooglePlacesInput, { GooglePlacesInputRef } from './GooglePlacesInput';
import DatePicker from 'react-native-date-picker'

// print package version of react-native-date-picker to console



interface EventFormProps {
  initialData?: Partial<Event>;
  onSubmit: (eventData: Partial<Event>) => Promise<void>;
  onCancel?: () => void;
  submitButtonText: string;
  isLoading?: boolean;
}

const EventForm: React.FC<EventFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  submitButtonText,
  isLoading = false
}) => {
  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [organizerName, setOrganizerName] = useState(initialData?.organizer_name || '');
  const [startDate, setStartDate] = useState(initialData?.start_time ? new Date(initialData.start_time) : new Date());
  const [endDate, setEndDate] = useState(initialData?.end_time ? new Date(initialData.end_time) : new Date(new Date().getTime() + 2 * 60 * 60 * 1000));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handle date changes
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(startDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setStartDate(newDate);
      
      // If end date is before start date, update end date
      if (endDate < newDate) {
        const newEndDate = new Date(newDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours after start
        setEndDate(newEndDate);
      }
    }
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(startDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setStartDate(newDate);
      
      // If end date is before start date, update end date
      if (endDate < newDate) {
        const newEndDate = new Date(newDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours after start
        setEndDate(newEndDate);
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(endDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setEndDate(newDate);
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(endDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setEndDate(newDate);
    }
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
        } else {
          delete errors.description;
        }
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Please enter a title for the event';
    } else if (sqlFound(title) || profanityFound(title)) {
      errors.title = 'Invalid title detected';
    }

    if (!organizerName.trim()) {
      errors.organizerName = 'Please enter an organizer name';
    } else if (sqlFound(organizerName) || profanityFound(organizerName)) {
      errors.organizerName = 'Invalid organizer name detected';
    }

    if (!location.trim()) {
      errors.location = 'Please enter a location';
    } else if (sqlFound(location) || profanityFound(location)) {
      errors.location = 'Invalid location detected';
    }

    if (startDate >= endDate) {
      errors.endDate = 'End time must be after start time';
    }

    if (description && (sqlFound(description) || profanityFound(description))) {
      errors.description = 'Invalid description detected';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      // Show first error
      const firstError = Object.values(formErrors)[0];
      if (firstError) {
        Alert.alert('Error', firstError);
      }
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        title: title.trim(),
        location: location.trim(),
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        organizer_name: organizerName.trim(),
        description: description.trim() || undefined
      });
    } catch (error: any) {
      console.error('Error submitting event form:', error);
      Alert.alert('Error', error.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Create ref for GooglePlacesInput
  const googlePlacesRef = useRef<GooglePlacesInputRef>(null);

  return (
    <KeyboardAvoidingView
      style={styles.formContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      //keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 40}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Event Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter event title"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              validateField('title', text);
            }}
          />
          {formErrors.title && <Text style={styles.errorText}>{formErrors.title}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Organizer Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter organizer name"
            value={organizerName}
            onChangeText={(text) => {
              setOrganizerName(text);
              validateField('organizerName', text);
            }}
          />
          {formErrors.organizerName && <Text style={styles.errorText}>{formErrors.organizerName}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location *</Text>
          <GooglePlacesInput
            ref={googlePlacesRef}
            initialValue={location}
            onPlaceSelect={(address) => {
              setLocation(address);
              validateField('location', address);
            }}
          />
          {formErrors.location && <Text style={styles.errorText}>{formErrors.location}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Start Date and Time *</Text>
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeColumn}>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
                <Ionicons name="calendar-outline" size={20} color="#2196F3" />
              </TouchableOpacity>
              {showStartDatePicker && (
                <DatePicker
                  modal
                  mode="date"
                  open={showStartDatePicker}
                  date={startDate}
                  onConfirm={(date) => {
                    setShowStartDatePicker(false);
                    // Preserve the time from the existing startDate
                    const newDate = new Date(date);
                    newDate.setHours(startDate.getHours());
                    newDate.setMinutes(startDate.getMinutes());
                    newDate.setSeconds(startDate.getSeconds());
                    setStartDate(newDate);
                    
                    // If end date is before start date, update end date
                    if (endDate < newDate) {
                      const newEndDate = new Date(newDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours after start
                      setEndDate(newEndDate);
                    }
                  }}
                  onCancel={() => setShowStartDatePicker(false)}
                />
              )}
            </View>
            <View style={styles.dateTimeColumn}>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={styles.dateButtonText}>{formatTime(startDate)}</Text>
                <Ionicons name="time-outline" size={20} color="#2196F3" />
              </TouchableOpacity>
              {showStartTimePicker && (
                <DatePicker
                  modal
                  mode="time"
                  open={showStartTimePicker}
                  date={startDate}
                  onConfirm={(date) => {
                    setShowStartTimePicker(false);
                    // Preserve the date from the existing startDate
                    const newDate = new Date(startDate);
                    newDate.setHours(date.getHours());
                    newDate.setMinutes(date.getMinutes());
                    setStartDate(newDate);
                    
                    // If end date is before start date, update end date
                    if (endDate < newDate) {
                      const newEndDate = new Date(newDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours after start
                      setEndDate(newEndDate);
                    }
                  }}
                  onCancel={() => setShowStartTimePicker(false)}
                />
              )}
            </View>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>End Date and Time *</Text>
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeColumn}>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
                <Ionicons name="calendar-outline" size={20} color="#2196F3" />
              </TouchableOpacity>
              {showEndDatePicker && (
                <DatePicker
                  modal
                  mode="date"
                  open={showEndDatePicker}
                  date={endDate}
                  minimumDate={startDate}
                  onConfirm={(date) => {
                    setShowEndDatePicker(false);
                    // Preserve the time from the existing endDate
                    const newDate = new Date(date);
                    newDate.setHours(endDate.getHours());
                    newDate.setMinutes(endDate.getMinutes());
                    newDate.setSeconds(endDate.getSeconds());
                    setEndDate(newDate);
                  }}
                  onCancel={() => setShowEndDatePicker(false)}
                />
              )}
            </View>
            <View style={styles.dateTimeColumn}>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.dateButtonText}>{formatTime(endDate)}</Text>
                <Ionicons name="time-outline" size={20} color="#2196F3" />
              </TouchableOpacity>
              {showEndTimePicker && (
                <DatePicker
                  modal
                  mode="time"
                  open={showEndTimePicker}
                  date={endDate}
                  onConfirm={(date) => {
                    setShowEndTimePicker(false);
                    // Preserve the date from the existing endDate
                    const newDate = new Date(endDate);
                    newDate.setHours(date.getHours());
                    newDate.setMinutes(date.getMinutes());
                    setEndDate(newDate);
                  }}
                  onCancel={() => setShowEndTimePicker(false)}
                />
              )}
            </View>
          </View>
          {formErrors.endDate && <Text style={styles.errorText}>{formErrors.endDate}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter event description, details, what to bring, etc."
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              validateField('description', text);
            }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {formErrors.description && <Text style={styles.errorText}>{formErrors.description}</Text>}
        </View>
        
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
              <Text style={styles.buttonText}>{submitButtonText}</Text>
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
    padding: 16,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingVertical: 16,
  },
  inputContainer: {
    marginTop: 20,
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
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
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flex: 2,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    marginRight: 12,
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginTop: 4,
  }
});

export default EventForm;
