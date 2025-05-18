import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { assignmentService } from '@/services/api';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';

// Assignment type definitions
interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Course {
  _id: string;
  name: string;
  code: string;
}

interface Attachment {
  _id?: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  uploadDate?: string;
}

interface Submission {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  content: string;
  attachments: Attachment[];
  submittedAt: string;
  score?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
  isLate: boolean;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  course: Course;
  dueDate: string;
  totalPoints: number;
  attachments: Attachment[];
  createdBy: Teacher;
  createdAt: string;
  submissions?: Submission[];
}

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submission, setSubmission] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await assignmentService.getAssignmentById(id as string);
      if (response.data && response.data.data) {
        setAssignment(response.data.data);
      } else {
        setError('Failed to load assignment details');
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      setError('Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true
      });

      if (!result.canceled && result.assets.length > 0) {
        // Check file sizes (max 5MB per file)
        const oversizedFiles = result.assets.filter(file => file.size && file.size > 5 * 1024 * 1024);
        
        if (oversizedFiles.length > 0) {
          Alert.alert('Error', 'Some files exceed the 5MB size limit');
          return;
        }
        
        setSelectedFiles(result.assets);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const handleSubmit = async () => {
    if (!submission.trim() && selectedFiles.length === 0) {
      Alert.alert('Error', 'Please provide either a text answer or upload files');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      // Create FormData for submission with files
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('content', submission);
        
        // Append files
        selectedFiles.forEach(file => {
          formData.append('files', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream',
          } as any);
        });
        
        await assignmentService.submitAssignment(id as string, formData, true);
      } else {
        // Text-only submission
        await assignmentService.submitAssignment(id as string, { content: submission });
      }
      
      // Show success message
      Alert.alert('Success', 'Assignment submitted successfully!');
      
      // Refresh assignment data to show submission
      fetchAssignment();
      setSubmission('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      Alert.alert('Error', 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isPastDue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const openAttachment = async (attachment: Attachment) => {
    try {
      await Linking.openURL(attachment.fileUrl);
    } catch (error) {
      console.error('Error opening attachment:', error);
      Alert.alert('Error', 'Failed to open attachment');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={{ marginTop: 16 }}>Loading assignment details...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (error || !assignment) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <ThemedText style={{ marginTop: 16 }}>{error || 'Assignment not found'}</ThemedText>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.back()}
          >
            <ThemedText style={styles.buttonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <ThemedText type="title">{assignment.title}</ThemedText>
          <ThemedText>{assignment.course.name} ({assignment.course.code})</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Description</ThemedText>
          <ThemedText style={styles.description}>{assignment.description}</ThemedText>
        </ThemedView>

        {assignment.attachments && assignment.attachments.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Attachments</ThemedText>
            {assignment.attachments.map((attachment, index) => (
              <TouchableOpacity 
                key={attachment._id || index} 
                style={styles.attachmentItem}
                onPress={() => openAttachment(attachment)}
              >
                <Ionicons name="document-outline" size={24} color="#007AFF" />
                <ThemedText style={styles.attachmentName}>{attachment.fileName}</ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        )}

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Assignment Details</ThemedText>
          <ThemedView style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Due Date:</ThemedText>
            <ThemedText style={isPastDue(assignment.dueDate) ? styles.pastDue : styles.upcoming}>
              {formatDate(assignment.dueDate)}
              {isPastDue(assignment.dueDate) ? ' (Past Due)' : ''}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Points:</ThemedText>
            <ThemedText>{assignment.totalPoints}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Created By:</ThemedText>
            <ThemedText>{`${assignment.createdBy.firstName} ${assignment.createdBy.lastName}`}</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Submit Assignment</ThemedText>
          
          <TextInput
            style={styles.textInput}
            multiline
            placeholder="Enter your answer here..."
            value={submission}
            onChangeText={setSubmission}
            editable={!submitting}
          />

          <ThemedView style={styles.fileSection}>
            <TouchableOpacity 
              style={styles.fileButton}
              onPress={handlePickDocument}
              disabled={submitting}
            >
              <Ionicons name="document-attach" size={20} color="#fff" />
              <ThemedText style={styles.fileButtonText}>Select Files</ThemedText>
            </TouchableOpacity>

            {selectedFiles.length > 0 && (
              <ThemedView style={styles.selectedFiles}>
                <ThemedText style={styles.selectedFilesTitle}>Selected Files:</ThemedText>
                {selectedFiles.map((file, index) => (
                  <ThemedView key={index} style={styles.selectedFileItem}>
                    <Ionicons name="document" size={16} color="#666" />
                    <ThemedText style={styles.selectedFileName}>{file.name}</ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            )}
          </ThemedView>

          <TouchableOpacity 
            style={[styles.submitButton, (submitting || (!submission.trim() && selectedFiles.length === 0)) && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={submitting || (!submission.trim() && selectedFiles.length === 0)}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.submitButtonText}>Submit Assignment</ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginBottom: 8,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  description: {
    marginTop: 8,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  infoLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    width: 100,
  },
  pastDue: {
    color: '#ff6b6b',
  },
  upcoming: {
    color: '#4caf50',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  attachmentName: {
    marginLeft: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    marginTop: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  fileSection: {
    marginBottom: 16,
  },
  fileButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  fileButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  selectedFiles: {
    marginTop: 12,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  selectedFilesTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectedFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedFileName: {
    marginLeft: 8,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
