import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { assignmentService } from '../../../services/api';
import * as Linking from 'expo-linking';

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
    fileName: string;
    fileUrl: string;
  }>;
  submittedAt: string;
  score?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
  isLate: boolean;
}

interface Assignment {
  _id: string;
  title: string;
  totalPoints: number;
  submissions: Submission[];
}

export default function SubmissionsScreen() {
  const { id } = useLocalSearchParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    fetchAssignment();
  }, []);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.getAssignmentById(id as string);
      setAssignment(data);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;

    if (!score || isNaN(Number(score))) {
      Alert.alert('Error', 'Please enter a valid score');
      return;
    }

    const numericScore = Number(score);
    if (numericScore < 0 || numericScore > (assignment?.totalPoints || 0)) {
      Alert.alert('Error', `Score must be between 0 and ${assignment?.totalPoints}`);
      return;
    }

    try {
      setGrading(true);
      await assignmentService.gradeSubmission(selectedSubmission._id, {
        score: numericScore,
        feedback,
        publishGrade: true
      });

      Alert.alert('Success', 'Submission graded successfully');
      setSelectedSubmission(null);
      setScore('');
      setFeedback('');
      fetchAssignment(); // Refresh the submissions list
    } catch (error) {
      console.error('Error grading submission:', error);
      Alert.alert('Error', 'Failed to grade submission');
    } finally {
      setGrading(false);
    }
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

  const openAttachment = async (url: string) => {
    try {
      await Linking.openURL(url);
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
          <ThemedText style={{ marginTop: 16 }}>Loading submissions...</ThemedText>
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
            style={styles.retryButton}
            onPress={fetchAssignment}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
            <ThemedText style={styles.backButtonText}>Back</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title">Submissions</ThemedText>
          {assignment && (
            <ThemedText style={styles.assignmentTitle}>{assignment.title}</ThemedText>
          )}
        </ThemedView>

        {selectedSubmission ? (
          <ThemedView style={styles.gradingSection}>
            <ThemedText type="subtitle">Grade Submission</ThemedText>
            <ThemedText style={styles.studentName}>
              Student: {selectedSubmission.student.firstName} {selectedSubmission.student.lastName}
            </ThemedText>
            
            <ThemedView style={styles.submissionContent}>
              <ThemedText style={styles.label}>Submission:</ThemedText>
              <ThemedText style={styles.content}>{selectedSubmission.content}</ThemedText>
              
              {selectedSubmission.attachments.length > 0 && (
                <ThemedView style={styles.attachments}>
                  <ThemedText style={styles.label}>Attachments:</ThemedText>
                  {selectedSubmission.attachments.map((attachment, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.attachmentItem}
                      onPress={() => openAttachment(attachment.fileUrl)}
                    >
                      <Ionicons name="document-outline" size={20} color="#666" />
                      <ThemedText style={styles.attachmentName}>{attachment.fileName}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ThemedView>
              )}
            </ThemedView>

            <ThemedView style={styles.gradingForm}>
              <ThemedText style={styles.label}>Score (out of {assignment?.totalPoints}):</ThemedText>
              <TextInput
                style={styles.scoreInput}
                value={score}
                onChangeText={setScore}
                keyboardType="numeric"
                placeholder="Enter score"
                placeholderTextColor="#666"
              />

              <ThemedText style={styles.label}>Feedback:</ThemedText>
              <TextInput
                style={styles.feedbackInput}
                value={feedback}
                onChangeText={setFeedback}
                multiline
                placeholder="Enter feedback for student"
                placeholderTextColor="#666"
              />

              <ThemedView style={styles.gradingButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setSelectedSubmission(null);
                    setScore('');
                    setFeedback('');
                  }}
                >
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.gradeButton, grading && styles.gradingButtonDisabled]}
                  onPress={handleGradeSubmission}
                  disabled={grading}
                >
                  {grading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={styles.gradeButtonText}>Submit Grade</ThemedText>
                  )}
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        ) : (
          <ThemedView style={styles.submissionsList}>
            {assignment?.submissions?.length === 0 ? (
              <ThemedView style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#666" />
                <ThemedText style={styles.emptyStateText}>No submissions yet</ThemedText>
              </ThemedView>
            ) : (
              assignment?.submissions?.map((submission) => (
                <TouchableOpacity
                  key={submission._id}
                  style={styles.submissionCard}
                  onPress={() => setSelectedSubmission(submission)}
                >
                  <ThemedView style={styles.submissionHeader}>
                    <ThemedText style={styles.studentName}>
                      {submission.student.firstName} {submission.student.lastName}
                    </ThemedText>
                    {submission.status === 'graded' && (
                      <ThemedText style={styles.score}>
                        Score: {submission.score}/{assignment.totalPoints}
                      </ThemedText>
                    )}
                  </ThemedView>

                  <ThemedView style={styles.submissionDetails}>
                    <ThemedText style={styles.submissionDate}>
                      Submitted: {formatDate(submission.submittedAt)}
                      {submission.isLate && (
                        <ThemedText style={styles.lateTag}> (Late)</ThemedText>
                      )}
                    </ThemedText>
                    <ThemedText style={styles.submissionStatus}>
                      Status: {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </ThemedText>
                  </ThemedView>

                  <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>
              ))
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 16,
  },
  assignmentTitle: {
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  submissionsList: {
    padding: 16,
  },
  submissionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  submissionHeader: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  submissionDetails: {
    marginRight: 8,
  },
  submissionDate: {
    color: '#666',
    fontSize: 14,
  },
  submissionStatus: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  lateTag: {
    color: '#ff6b6b',
  },
  score: {
    color: '#4caf50',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    color: '#666',
    marginTop: 16,
    fontSize: 16,
  },
  gradingSection: {
    padding: 16,
  },
  submissionContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  content: {
    color: '#333',
    marginBottom: 16,
  },
  attachments: {
    marginTop: 16,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  attachmentName: {
    marginLeft: 8,
    color: '#333',
  },
  gradingForm: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#000',
    backgroundColor: '#fff',
  },
  gradingButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  gradeButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  gradeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  gradingButtonDisabled: {
    opacity: 0.7,
  },
}); 