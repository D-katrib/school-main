import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { assignmentService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Submission {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  content: string;
  attachments: Array<{
    _id: string;
    filename: string;
    url: string;
  }>;
  submittedAt: string;
  status: string;
  score?: number;
  feedback?: string;
  gradedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  gradedAt?: string;
}

export default function SubmissionsScreen() {
  const { id } = useLocalSearchParams();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  
  // New state for editing
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [editingScore, setEditingScore] = useState('');
  const [editingFeedback, setEditingFeedback] = useState('');

  useEffect(() => {
    const loadUserRole = async () => {
      const role = await AsyncStorage.getItem('userRole');
      setUserRole(role || '');
    };
    loadUserRole();
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [id]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.getSubmissions(id as string);
      setSubmissions(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId: string, score: number, feedback: string) => {
    try {
      await assignmentService.gradeSubmission(submissionId, {
        score,
        feedback,
        publishGrade: true
      });
      Alert.alert('Success', 'Submission graded successfully');
      setEditingSubmissionId(null);
      setEditingScore('');
      setEditingFeedback('');
      fetchSubmissions(); // Refresh the list
    } catch (err) {
      console.error('Error grading submission:', err);
      Alert.alert('Error', 'Failed to grade submission');
    }
  };

  const startEditing = (submission: Submission) => {
    setEditingSubmissionId(submission._id);
    setEditingScore(submission.score?.toString() || '');
    setEditingFeedback(submission.feedback || '');
  };

  const cancelEditing = () => {
    setEditingSubmissionId(null);
    setEditingScore('');
    setEditingFeedback('');
  };

  const saveGrade = (submissionId: string) => {
    const numericScore = parseFloat(editingScore);
    if (isNaN(numericScore)) {
      Alert.alert('Error', 'Please enter a valid score');
      return;
    }
    handleGradeSubmission(submissionId, numericScore, editingFeedback);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderSubmission = (submission: Submission) => {
    const isEditing = editingSubmissionId === submission._id;

    return (
      <ThemedView key={submission._id} style={styles.submissionCard}>
        <ThemedView style={styles.submissionHeader}>
          <ThemedText type="subtitle">
            {submission.student.firstName} {submission.student.lastName}
          </ThemedText>
          <ThemedText style={styles.submissionDate}>
            Submitted: {formatDate(submission.submittedAt)}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.submissionContent}>
          <ThemedText>{submission.content}</ThemedText>
          
          {submission.attachments.length > 0 && (
            <ThemedView style={styles.attachments}>
              <ThemedText type="subtitle">Attachments:</ThemedText>
              {submission.attachments.map(attachment => (
                <TouchableOpacity 
                  key={attachment._id}
                  style={styles.attachment}
                  onPress={() => {/* Handle attachment view */}}
                >
                  <Ionicons name="document-outline" size={20} color="#666" />
                  <ThemedText style={styles.attachmentName}>{attachment.filename}</ThemedText>
                </TouchableOpacity>
              ))}
            </ThemedView>
          )}
        </ThemedView>

        {(userRole === 'teacher' || userRole === 'admin') && (
          <ThemedView style={styles.gradingSection}>
            {isEditing ? (
              <>
                <ThemedView style={styles.gradeInputContainer}>
                  <ThemedText>Score:</ThemedText>
                  <TextInput
                    style={styles.scoreInput}
                    value={editingScore}
                    onChangeText={setEditingScore}
                    keyboardType="numeric"
                    placeholder="Enter score"
                  />
                </ThemedView>
                <ThemedView style={styles.feedbackInputContainer}>
                  <ThemedText>Feedback:</ThemedText>
                  <TextInput
                    style={styles.feedbackInput}
                    value={editingFeedback}
                    onChangeText={setEditingFeedback}
                    multiline
                    placeholder="Enter feedback"
                  />
                </ThemedView>
                <ThemedView style={styles.gradeActions}>
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]}
                    onPress={() => saveGrade(submission._id)}
                  >
                    <ThemedText style={styles.buttonText}>Save</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]}
                    onPress={cancelEditing}
                  >
                    <ThemedText style={styles.buttonText}>Cancel</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </>
            ) : (
              <ThemedView style={styles.gradeDisplay}>
                {submission.score !== undefined ? (
                  <>
                    <ThemedText type="subtitle">Grade: {submission.score}</ThemedText>
                    {submission.feedback && (
                      <ThemedText style={styles.feedback}>Feedback: {submission.feedback}</ThemedText>
                    )}
                    <TouchableOpacity 
                      style={[styles.button, styles.editButton]}
                      onPress={() => startEditing(submission)}
                    >
                      <ThemedText style={styles.buttonText}>Edit Grade</ThemedText>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity 
                    style={[styles.button, styles.gradeButton]}
                    onPress={() => startEditing(submission)}
                  >
                    <ThemedText style={styles.buttonText}>Grade Submission</ThemedText>
                  </TouchableOpacity>
                )}
              </ThemedView>
            )}
          </ThemedView>
        )}
      </ThemedView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading submissions...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
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
          <ThemedText type="title">Submissions</ThemedText>
        </ThemedView>

        {submissions.length === 0 ? (
          <ThemedView style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#888" />
            <ThemedText style={styles.emptyText}>No submissions yet</ThemedText>
          </ThemedView>
        ) : (
          submissions.map(renderSubmission)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    marginLeft: 8,
    color: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    color: '#ff6b6b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    color: '#888',
  },
  submissionCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submissionHeader: {
    marginBottom: 12,
  },
  submissionDate: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  submissionContent: {
    marginBottom: 16,
  },
  attachments: {
    marginTop: 12,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  attachmentName: {
    marginLeft: 8,
    color: '#666',
  },
  gradingSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  gradeInputContainer: {
    marginBottom: 12,
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
  },
  feedbackInputContainer: {
    marginBottom: 16,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  gradeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  gradeButton: {
    backgroundColor: '#007AFF',
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
  gradeDisplay: {
    alignItems: 'flex-start',
  },
  feedback: {
    marginTop: 8,
    marginBottom: 12,
  },
}); 