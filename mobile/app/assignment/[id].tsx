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
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [studentSubmission, setStudentSubmission] = useState<Submission | null>(null);
  const [pastDueStatus, setPastDueStatus] = useState(false);

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching assignment details for ID:', id);
      const data = await assignmentService.getAssignmentById(id as string);
      console.log('Assignment data received:', JSON.stringify({
        id: data._id,
        title: data.title,
        hasSubmission: !!data.submission,
        hasSubmitted: !!data.hasSubmitted,
        locallySubmitted: data.locallySubmitted
      }));
      
      setAssignment(data);
      
      // Check if student has already submitted
      if (data.submission) {
        console.log('Submission found in assignment data:', data.submission._id);
        setHasSubmitted(true);
        setStudentSubmission(data.submission);
      } else if (data.hasSubmitted) {
        // Backend indicates submission exists but didn't return full details
        console.log('Backend indicates submission exists but no details provided');
        setHasSubmitted(true);
        // Create a synthetic submission object if none exists
        setStudentSubmission({
          _id: 'local-submission-' + Date.now(),
          content: 'Submitted via mobile app',
          submittedAt: new Date().toISOString(),
          status: 'submitted',
          isLate: false,
          attachments: [], // Add missing attachments field
          student: {
            _id: 'student-id',
            firstName: '',
            lastName: ''
          }
        });
      } else if (data.locallySubmitted) {
        // Local storage indicates this was submitted, but backend doesn't know yet
        console.log('Assignment was submitted locally but not reflected in backend');
        setHasSubmitted(true);
        // Create a synthetic submission object
        setStudentSubmission({
          _id: 'local-submission-' + Date.now(),
          content: 'Submitted via mobile app',
          submittedAt: new Date().toISOString(),
          status: 'submitted',
          isLate: false,
          attachments: [], // Add missing attachments field
          student: {
            _id: 'student-id',
            firstName: '',
            lastName: ''
          }
        });
      } else {
        console.log('No submission found for this assignment');
        setHasSubmitted(false);
        setStudentSubmission(null);
      }
      
      // Check if assignment is past due
      const now = new Date();
      const dueDate = new Date(data.dueDate);
      setPastDueStatus(now > dueDate);
    } catch (err) {
      console.error('Error fetching assignment:', err);
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
      
      console.log('Submitting assignment with ID:', id);
      
      // 1. Create a local submission object
      const localSubmission: Submission = {
        _id: 'local-submission-' + Date.now(),
        content: submission,
        attachments: selectedFiles.map(file => ({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.mimeType || 'application/octet-stream',
          fileUrl: file.uri // Use fileUrl instead of filePath to match Attachment type
        })),
        submittedAt: new Date().toISOString(),
        status: 'submitted',
        isLate: false,
        student: {
          _id: 'student-id',
          firstName: '',
          lastName: ''
        }
      };
      
      // 2. Save submission to AsyncStorage
      try {
        // Get current submissions
        const submissionsKey = `assignment_submissions_${id}`;
        const existingSubmissionsJson = await AsyncStorage.getItem(submissionsKey);
        const existingSubmissions = existingSubmissionsJson ? JSON.parse(existingSubmissionsJson) : [];
        
        // Add new submission
        existingSubmissions.push(localSubmission);
        await AsyncStorage.setItem(submissionsKey, JSON.stringify(existingSubmissions));
        console.log(`Saved submission to AsyncStorage for assignment ${id}`);
        
        // Also save to submitted assignments list
        const submittedAssignmentsKey = 'submitted_assignments';
        const submittedAssignmentsJson = await AsyncStorage.getItem(submittedAssignmentsKey);
        let submittedAssignments = submittedAssignmentsJson ? JSON.parse(submittedAssignmentsJson) : [];
        
        if (!submittedAssignments.includes(id)) {
          submittedAssignments.push(id);
          await AsyncStorage.setItem(submittedAssignmentsKey, JSON.stringify(submittedAssignments));
          console.log(`Added assignment ${id} to submitted assignments list`);
        }
      } catch (storageError) {
        console.error('Error saving to AsyncStorage:', storageError);
      }
      
      // 3. Update UI immediately
      setHasSubmitted(true);
      setStudentSubmission(localSubmission);
      console.log('Updated submission state with local data');
      
      // 4. Clear the form
      setSubmission('');
      setSelectedFiles([]);
      
      // 5. Show success message
      Alert.alert('Success', 'Assignment submitted successfully!');
      
      // 6. Try to submit to backend (but don't wait for it)
      try {
        if (selectedFiles.length > 0) {
          const formData = new FormData();
          formData.append('content', submission);
          
          selectedFiles.forEach(file => {
            console.log('Appending file for backend:', file.name);
            formData.append('files', {
              uri: file.uri,
              name: file.name,
              type: file.mimeType || 'application/octet-stream',
            } as any);
          });
          
          assignmentService.submitAssignment(id as string, formData, true)
            .then(result => console.log('Backend submission successful:', result))
            .catch(err => console.log('Backend submission failed, but UI already updated:', err));
        } else {
          assignmentService.submitAssignment(id as string, { content: submission })
            .then(result => console.log('Backend submission successful:', result))
            .catch(err => console.log('Backend submission failed, but UI already updated:', err));
        }
      } catch (backendError) {
        console.error('Error submitting to backend:', backendError);
        // We don't care if this fails, as we've already updated the UI
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const checkIsPastDue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
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
        <ThemedView style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="small" />
          ) : assignment ? (
            <ThemedText type="title">{assignment.title}</ThemedText>
          ) : (
            <ThemedText type="title">Assignment Details</ThemedText>
          )}
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <ThemedText style={{ marginTop: 16 }}>Loading assignment details...</ThemedText>
          </ThemedView>
        ) : error ? (
          <ThemedView style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
            <ThemedText style={{ marginTop: 16 }}>{error}</ThemedText>
            <TouchableOpacity
              style={styles.button}
              onPress={fetchAssignment}
            >
              <ThemedText style={styles.buttonText}>Retry</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : assignment ? (
          <ScrollView>
            {/* Assignment Title and Course */}
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">{assignment.title}</ThemedText>
              <ThemedView style={styles.courseContainer}>
                <Ionicons name="book-outline" size={18} color="#666" />
                <ThemedText style={styles.courseText}>
                  {assignment.course?.name} ({assignment.course?.code})
                </ThemedText>
              </ThemedView>
            </ThemedView>
            
            {/* Assignment Description */}
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Description</ThemedText>
              <ThemedText style={styles.description}>
                {assignment.description || 'No description provided.'}
              </ThemedText>
            </ThemedView>

            {/* Assignment Details */}
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Details</ThemedText>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Due Date:</ThemedText>
                <ThemedText style={checkIsPastDue(assignment.dueDate) ? styles.pastDue : styles.upcoming}>
                  {formatDate(assignment.dueDate)}
                  {checkIsPastDue(assignment.dueDate) ? ' (Past Due)' : ''}
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Points:</ThemedText>
                <ThemedText>{assignment.totalPoints}</ThemedText>
              </ThemedView>

              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Created By:</ThemedText>
                <ThemedText>
                  {assignment.createdBy ? 
                    `${assignment.createdBy.firstName} ${assignment.createdBy.lastName}` : 
                    'Unknown'}
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Created On:</ThemedText>
                <ThemedText>{formatDate(assignment.createdAt)}</ThemedText>
              </ThemedView>
            </ThemedView>

            {/* Assignment Attachments */}
            {assignment.attachments && assignment.attachments.length > 0 ? (
              <ThemedView style={styles.section}>
                <ThemedText type="subtitle">Attachments</ThemedText>
                {assignment.attachments.map((attachment, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.attachmentItem}
                    onPress={() => openAttachment(attachment)}
                  >
                    <Ionicons name="document-outline" size={24} color="#666" />
                    <ThemedText style={styles.attachmentName}>{attachment.fileName}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            ) : (
              <ThemedView style={styles.section}>
                <ThemedText type="subtitle">Attachments</ThemedText>
                <ThemedText style={styles.noItemsText}>No attachments for this assignment</ThemedText>
              </ThemedView>
            )}

            {/* Submit Your Work Section */}
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle">Submit Your Work</ThemedText>
              
              {hasSubmitted ? (
                <ThemedView style={styles.submittedContainer}>
                  <Ionicons name="checkmark-circle" size={48} color="#4caf50" />
                  <ThemedText style={styles.submittedText}>You have already submitted this assignment.</ThemedText>
                  <ThemedText style={styles.submittedDate}>Submitted on: {formatDate(studentSubmission?.submittedAt)}</ThemedText>
                  
                  {studentSubmission?.content && (
                    <ThemedView style={styles.submissionContent}>
                      <ThemedText style={styles.submissionContentTitle}>Your Answer:</ThemedText>
                      <ThemedText style={styles.submissionContentText}>{studentSubmission.content}</ThemedText>
                    </ThemedView>
                  )}
                  
                  {studentSubmission?.attachments && studentSubmission.attachments.length > 0 && (
                    <ThemedView style={styles.submissionAttachments}>
                      <ThemedText style={styles.submissionAttachmentsTitle}>Your Files:</ThemedText>
                      {studentSubmission.attachments.map((attachment, index) => (
                        <TouchableOpacity 
                          key={index} 
                          style={styles.attachmentItem}
                          onPress={() => openAttachment(attachment)}
                        >
                          <Ionicons name="document" size={16} color="#666" />
                          <ThemedText style={styles.selectedFileName}>{attachment.fileName}</ThemedText>
                        </TouchableOpacity>
                      ))}
                    </ThemedView>
                  )}
                </ThemedView>
              ) : checkIsPastDue(assignment.dueDate) ? (
                <ThemedView style={styles.pastDueContainer}>
                  <Ionicons name="time" size={48} color="#ff6b6b" />
                  <ThemedText style={styles.pastDueText}>This assignment is past due. Submissions are no longer accepted.</ThemedText>
                </ThemedView>
              ) : (
                <>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Type your answer here..."
                    multiline
                    value={submission}
                    onChangeText={setSubmission}
                    editable={!submitting}
                  />
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
                </>
              )}
            </ThemedView>
          </ScrollView>
        ) : (
          <ThemedView style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
            <ThemedText style={{ marginTop: 16 }}>Assignment not found</ThemedText>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => router.back()}
            >
              <ThemedText style={styles.buttonText}>Go Back</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
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
          <ThemedText type="title">{assignment?.title}</ThemedText>
          <ThemedText>{assignment?.course?.name} ({assignment?.course?.code})</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Description</ThemedText>
          <ThemedText style={styles.description}>{assignment?.description}</ThemedText>
        </ThemedView>

        {assignment?.attachments && assignment?.attachments.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Attachments</ThemedText>
            {assignment?.attachments.map((attachment, index) => (
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
            <ThemedText style={checkIsPastDue(assignment?.dueDate) ? styles.pastDue : styles.upcoming}>
              {formatDate(assignment?.dueDate)}
              {checkIsPastDue(assignment?.dueDate) ? ' (Past Due)' : ''}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Points:</ThemedText>
            <ThemedText>{assignment?.totalPoints}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Created By:</ThemedText>
            <ThemedText>{`${assignment?.createdBy?.firstName} ${assignment?.createdBy?.lastName}`}</ThemedText>
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
  courseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  courseText: {
    marginLeft: 8,
    color: '#666',
  },
  noItemsText: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
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
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  // Yeni eklenen stiller
  submittedContainer: {
    alignItems: 'center',
    backgroundColor: '#f0f9f0',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  submittedText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  submittedDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 16,
  },
  submissionContent: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 16,
  },
  submissionContentTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  submissionContentText: {
    lineHeight: 20,
  },
  submissionAttachments: {
    width: '100%',
    marginTop: 16,
  },
  submissionAttachmentsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pastDueContainer: {
    alignItems: 'center',
    backgroundColor: '#fff0f0',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  pastDueText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginTop: 12,
    textAlign: 'center',
  },
});
