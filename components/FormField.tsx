import React from 'react';
import { StyleSheet, View, Text, TextInput, TextInputProps } from 'react-native';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  error, 
  style, 
  ...textInputProps 
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, textInputProps.multiline && styles.textArea, style]}
        {...textInputProps}
        textAlignVertical={textInputProps.multiline ? "top" : "center"}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
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
  errorText: {
    color: '#F44336',
    marginTop: 4,
    fontSize: 14,
  },
});

export default FormField;
