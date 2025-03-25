import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatePicker from 'react-native-date-picker';

interface DateTimeFieldProps {
  label: string;
  date: Date;
  onDateChange: (date: Date) => void;
  onTimeChange: (date: Date) => void;
  error?: string;
  minDate?: Date;
}

const DateTimeField: React.FC<DateTimeFieldProps> = ({
  label,
  date,
  onDateChange,
  onTimeChange,
  error,
  minDate,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeColumn}>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
            <Ionicons name="calendar-outline" size={20} color="#2196F3" />
          </TouchableOpacity>
        </View>
        <View style={styles.dateTimeColumn}>
          <TouchableOpacity 
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.dateButtonText}>{formatTime(date)}</Text>
            <Ionicons name="time-outline" size={20} color="#2196F3" />
          </TouchableOpacity>
        </View>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Date Picker Modal */}
      <DatePicker
        modal
        mode="date"
        open={showDatePicker}
        date={date}
        minimumDate={minDate}
        onConfirm={(selectedDate) => {
          setShowDatePicker(false);
          onDateChange(selectedDate);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Time Picker Modal */}
      <DatePicker
        modal
        mode="time"
        open={showTimePicker}
        date={date}
        onConfirm={(selectedDate) => {
          setShowTimePicker(false);
          onTimeChange(selectedDate);
        }}
        onCancel={() => setShowTimePicker(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
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
});

export default DateTimeField;
