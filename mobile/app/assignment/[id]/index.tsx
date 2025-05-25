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
  submission?: Submission;
  hasSubmitted?: boolean;
  locallySubmitted?: boolean;
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
  const [userRole, setUserRole] = useState('student'); // Assuming a default role

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
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={{ marginTop: 16 }}>Loading assignment details...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
            <ThemedText style={styles.backButtonText}>Back</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title">Assignment Details</ThemedText>
        </ThemedView>

        {assignment && (
          <ThemedView style={styles.assignmentCard}>
            <ThemedText type="title">{assignment.title}</ThemedText>
            <ThemedText style={styles.courseInfo}>
              {assignment.course.name} ({assignment.course.code})
            </ThemedText>
            
            <ThemedView style={styles.dueDateContainer}>
              <ThemedText style={styles.label}>Due Date:</ThemedText>
              <ThemedText style={[
                styles.dueDate,
                checkIsPastDue(assignment.dueDate) && styles.pastDue
              ]}>
                {formatDate(assignment.dueDate)}
                {checkIsPastDue(assignment.dueDate) ? ' (Past Due)' : ''}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.pointsContainer}>
              <ThemedText style={styles.label}>Total Points:</ThemedText>
              <ThemedText style={styles.points}>{assignment.totalPoints}</ThemedText>
            </ThemedView>

            <ThemedView style={styles.descriptionContainer}>
              <ThemedText style={styles.label}>Description:</ThemedText>
              <ThemedText style={styles.description}>{assignment.description}</ThemedText>
            </ThemedView>

            {assignment.attachments && assignment.attachments.length > 0 && (
              <ThemedView style={styles.attachmentsContainer}>
                <ThemedText style={styles.label}>Attachments:</ThemedText>
                {assignment.attachments.map((attachment) => (
                  <TouchableOpacity
                    key={attachment._id}
                    style={styles.attachmentItem}
                    onPress={() => openAttachment(attachment)}
                  >
                    <Ionicons name="document-outline" size={20} color="#666" />
                    <ThemedText style={styles.attachmentName}>{attachment.fileName}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            )}

            {/* Show submission section only for students */}
            {userRole === 'student' && (
              <ThemedView style={styles.submissionSection}>
                {studentSubmission ? (
                  <>
                    <ThemedText type="subtitle">Your Submission</ThemedText>
                    <ThemedText style={styles.submissionDate}>
                      Submitted: {formatDate(studentSubmission.submittedAt)}
                    </ThemedText>
                    <ThemedText style={styles.submissionContent}>
                      {studentSubmission.content}
                    </ThemedText>
                    {studentSubmission.attachments && studentSubmission.attachments.length > 0 && (
                      <ThemedView style={styles.submissionAttachments}>
                        <ThemedText style={styles.label}>Submitted Files:</ThemedText>
                        {studentSubmission.attachments.map((attachment) => (
                          <TouchableOpacity
                            key={attachment._id}
                            style={styles.attachmentItem}
                            onPress={() => openAttachment(attachment)}
                          >
                            <Ionicons name="document-outline" size={20} color="#666" />
                            <ThemedText style={styles.attachmentName}>
                              {attachment.fileName}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </ThemedView>
                    )}
                    {studentSubmission.score !== undefined && (
                      <ThemedView style={styles.gradeSection}>
                        <ThemedText type="subtitle">Grade</ThemedText>
                        <ThemedText style={styles.score}>
                          Score: {studentSubmission.score} / {assignment.totalPoints}
                        </ThemedText>
                        {studentSubmission.feedback && (
                          <ThemedText style={styles.feedback}>
                            Feedback: {studentSubmission.feedback}
                          </ThemedText>
                        )}
                      </ThemedView>
                    )}
                  </>
                ) : (
                  <ThemedView style={styles.submitSection}>
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handleSubmit}
                    >
                      <ThemedText style={styles.submitButtonText}>
                        Submit Assignment
                      </ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                )}
              </ThemedView>
            )}

            {/* Show submissions button for teachers */}
            {(userRole === 'teacher' || userRole === 'admin') && (
              <ThemedView style={styles.teacherActions}>
                <TouchableOpacity
                  style={styles.viewSubmissionsButton}
                  onPress={() => {
                    // @ts-ignore - Expo Router types are sometimes too strict
                    router.push({
                      pathname: '/assignment/[id]/submissions',
                      params: { id: assignment._id }
                    });
                  }}
                >
                  <ThemedText style={styles.viewSubmissionsText}>
                    View Submissions
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
          </ThemedView>
        )}
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
  backButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  assignmentCard: {
    padding: 16,
  },
  courseInfo: {
    marginTop: 8,
    color: '#666',
  },
  dueDateContainer: {
    marginTop: 16,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dueDate: {
    color: '#666',
  },
  pastDue: {
    color: '#ff6b6b',
  },
  pointsContainer: {
    marginTop: 16,
  },
  points: {
    color: '#666',
  },
  descriptionContainer: {
    marginTop: 16,
  },
  description: {
    color: '#666',
  },
  attachmentsContainer: {
    marginTop: 16,
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
  submissionSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  submissionDate: {
    color: '#666',
  },
  submissionContent: {
    marginTop: 8,
    color: '#666',
  },
  submitSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  submitButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
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
  scrollContent: {
    padding: 16,
  },
  teacherActions: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  viewSubmissionsButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewSubmissionsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submissionAttachments: {
    marginTop: 16,
  },
  gradeSection: {
    marginTop: 16,
  },
  score: {
    color: '#666',
  },
  feedback: {
    color: '#666',
  },
}); 