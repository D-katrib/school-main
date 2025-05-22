import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { courseService, assignmentService } from '@/services/api';
import * as DocumentPicker from 'expo-document-picker';

interface Course {
  _id: string;
  name: string;
  code: string;
}

// Assignment types matching the web version
type AssignmentType = 'Homework' | 'Quiz' | 'Exam' | 'Project' | 'Other';

export default function AddAssignmentScreen() {
  // Basic assignment info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('Homework');
  const [dueDate, setDueDate] = useState(new Date());
  const [totalPoints, setTotalPoints] = useState('100');
  
  // Late submission options
  const [allowLateSubmissions, setAllowLateSubmissions] = useState(false);
  const [latePenalty, setLatePenalty] = useState('0');
  
  // Publishing option
  const [publishAssignment, setPublishAssignment] = useState(true);
  
  // File attachments
  const [attachments, setAttachments] = useState<any[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  
  // Data
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Assignment types for dropdown
  const assignmentTypes: AssignmentType[] = ['Homework', 'Quiz', 'Exam', 'Project', 'Other'];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const coursesData = await courseService.getAllCourses();
      console.log('Courses data received:', coursesData);
      
      if (Array.isArray(coursesData)) {
        setCourses(coursesData);
        if (coursesData.length > 0) {
          setSelectedCourse(coursesData[0]._id);
        }
      } else {
        console.error('Unexpected API response format:', coursesData);
        Alert.alert('Error', 'Failed to load courses. Unexpected data format.');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setCoursesLoading(false);
    }
  };

  const handlePickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true
      });

      if (!result.canceled && result.assets) {
        // Add the new assets to the existing attachments
        setAttachments([...attachments, ...result.assets]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!selectedCourse) {
      Alert.alert('Error', 'Please select a course');
      return;
    }

    try {
      setLoading(true);
      
      // Create assignment data
      const assignmentData = {
        title,
        description,
        type: assignmentType,
        dueDate: dueDate.toISOString(),
        totalPoints: parseInt(totalPoints) || 0,
        course: selectedCourse,
        allowLateSubmissions,
        latePenalty: parseInt(latePenalty) || 0,
        published: publishAssignment
      };
      
      // If we have file attachments, use FormData
      if (attachments.length > 0) {
        const formData = new FormData();
        
        // Add assignment data to FormData
        formData.append('title', title);
        formData.append('description', description);
        formData.append('type', assignmentType);
        formData.append('dueDate', dueDate.toISOString());
        formData.append('totalPoints', totalPoints);
        formData.append('course', selectedCourse);
        formData.append('allowLateSubmissions', allowLateSubmissions.toString());
        formData.append('latePenalty', latePenalty);
        formData.append('published', publishAssignment.toString());
        
        // Add file attachments
        attachments.forEach((file, index) => {
          formData.append('files', {
            uri: file.uri,
            type: file.mimeType,
            name: file.name,
          } as any);
        });
        
        // Create assignment with files
        await assignmentService.createAssignment(formData, true);
      } else {
        // Create assignment without files
        await assignmentService.createAssignment(assignmentData);
      }
      
      // Show success message and navigate back
      Alert.alert(
        'Success',
        'Assignment created successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error creating assignment:', error);
      Alert.alert('Error', 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  // Format date to string in YYYY-MM-DD format
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Parse date string from input (YYYY-MM-DD) to Date object
  const parseDateFromInput = (dateString: string): Date => {
    if (!dateString) return new Date();
    try {
      const [year, month, day] = dateString.split('-').map(num => parseInt(num));
      return new Date(year, month - 1, day);
    } catch (error) {
      return new Date();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <ThemedText type="title">Create New Assignment</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Title Field - Required */}
        <ThemedView style={styles.formGroup}>
          <View style={styles.labelContainer}>
            <ThemedText style={styles.label}>Title</ThemedText>
            <ThemedText style={styles.requiredStar}>*</ThemedText>
          </View>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter assignment title"
          />
        </ThemedView>

        {/* Description Field - Required */}
        <ThemedView style={styles.formGroup}>
          <View style={styles.labelContainer}>
            <ThemedText style={styles.label}>Description</ThemedText>
            <ThemedText style={styles.requiredStar}>*</ThemedText>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter assignment description"
            multiline
            numberOfLines={4}
          />
        </ThemedView>

        {/* Two columns layout for Course and Assignment Type */}
        <View style={styles.rowContainer}>
          {/* Course Selection - Required */}
          <ThemedView style={[styles.formGroup, styles.halfWidth]}>
            <View style={styles.labelContainer}>
              <ThemedText style={styles.label}>Course</ThemedText>
              <ThemedText style={styles.requiredStar}>*</ThemedText>
            </View>
            {coursesLoading ? (
              <ActivityIndicator size="small" />
            ) : (
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => Alert.alert('Select a course', '', [
                  {text: 'Cancel', style: 'cancel'},
                  ...courses.map(course => ({
                    text: course.name,
                    onPress: () => setSelectedCourse(course._id)
                  }))
                ])}
              >
                <ThemedText>
                  {selectedCourse ? courses.find(c => c._id === selectedCourse)?.name || 'Select a course' : 'Select a course'}
                </ThemedText>
                <Ionicons name="chevron-down" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </ThemedView>

          {/* Assignment Type */}
          <ThemedView style={[styles.formGroup, styles.halfWidth]}>
            <ThemedText style={styles.label}>Assignment Type</ThemedText>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => Alert.alert('Select assignment type', '', [
                {text: 'Cancel', style: 'cancel'},
                ...assignmentTypes.map(type => ({
                  text: type,
                  onPress: () => setAssignmentType(type)
                }))
              ])}
            >
              <ThemedText>{assignmentType}</ThemedText>
              <Ionicons name="chevron-down" size={20} color="#888" />
            </TouchableOpacity>
          </ThemedView>
        </View>

        {/* Two columns layout for Due Date and Total Points */}
        <View style={styles.rowContainer}>
          {/* Due Date - Required */}
          <ThemedView style={[styles.formGroup, styles.halfWidth]}>
            <View style={styles.labelContainer}>
              <ThemedText style={styles.label}>Due Date</ThemedText>
              <ThemedText style={styles.requiredStar}>*</ThemedText>
            </View>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => {
                // On real implementation, use a date picker appropriate for the platform
                // For now, just use the text input approach
                Alert.alert('Enter date in YYYY-MM-DD format');
              }}
            >
              <TextInput
                style={styles.dateTextInput}
                value={formatDateForInput(dueDate)}
                onChangeText={(text) => setDueDate(parseDateFromInput(text))}
                placeholder="YYYY-MM-DD"
                keyboardType="numeric"
              />
              <Ionicons name="calendar-outline" size={20} color="#888" />
            </TouchableOpacity>
          </ThemedView>

          {/* Total Points */}
          <ThemedView style={[styles.formGroup, styles.halfWidth]}>
            <ThemedText style={styles.label}>Total Points</ThemedText>
            <TextInput
              style={styles.input}
              value={totalPoints}
              onChangeText={setTotalPoints}
              keyboardType="numeric"
              placeholder="100"
            />
          </ThemedView>
        </View>

        {/* Late Submissions Options */}
        <ThemedView style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Switch
              value={allowLateSubmissions}
              onValueChange={setAllowLateSubmissions}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={allowLateSubmissions ? '#007AFF' : '#f4f3f4'}
            />
            <ThemedText style={styles.switchLabel}>Allow Late Submissions</ThemedText>
          </View>
          
          {allowLateSubmissions && (
            <View style={styles.indentedSection}>
              <ThemedText style={styles.label}>Late Penalty (%)</ThemedText>
              <TextInput
                style={[styles.input, styles.halfWidth]}
                value={latePenalty}
                onChangeText={setLatePenalty}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          )}
        </ThemedView>

        {/* Publish Assignment Option */}
        <ThemedView style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Switch
              value={publishAssignment}
              onValueChange={setPublishAssignment}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={publishAssignment ? '#007AFF' : '#f4f3f4'}
            />
            <ThemedText style={styles.switchLabel}>Publish Assignment (visible to students)</ThemedText>
          </View>
        </ThemedView>

        {/* File Attachments */}
        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.label}>Attachments (optional)</ThemedText>
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={handlePickDocuments}
          >
            <Ionicons name="document-attach" size={24} color="#007AFF" />
            <ThemedText style={styles.uploadButtonText}>Select Files</ThemedText>
          </TouchableOpacity>
          
          <ThemedText style={styles.helperText}>
            You can upload multiple files (max 5MB each).
          </ThemedText>
          
          {attachments.length > 0 && (
            <View style={styles.attachmentsList}>
              {attachments.map((file, index) => (
                <View key={index} style={styles.attachmentItem}>
                  <Ionicons name="document" size={20} color="#007AFF" />
                  <ThemedText style={styles.attachmentName} numberOfLines={1}>
                    {file.name}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => handleRemoveAttachment(index)}
                    style={styles.removeAttachmentButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ThemedView>

        {/* Submit Button */}
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.submitButtonText}>Create Assignment</ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  // Label styles
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
  },
  requiredStar: {
    color: '#FF3B30',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  // Input styles
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  // Layout styles
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  // Dropdown styles
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  // Date input styles
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 0,
    paddingRight: 12,
  },
  dateTextInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  // Switch styles
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchLabel: {
    marginLeft: 10,
  },
  indentedSection: {
    marginLeft: 30,
    marginTop: 10,
  },
  // File upload styles
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  uploadButtonText: {
    marginLeft: 8,
    color: '#007AFF',
  },
  attachmentsList: {
    marginTop: 10,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  attachmentName: {
    flex: 1,
    marginLeft: 8,
  },
  removeAttachmentButton: {
    padding: 4,
  },
  // Submit button styles
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
