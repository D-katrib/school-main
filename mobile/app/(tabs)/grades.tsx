import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { assignmentService } from '../../services/api';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

// Define interfaces for type safety
interface Submission {
  _id: string;
  assignment: {
    _id: string;
    title: string;
    description?: string;
    dueDate: string;
    course?: {
      _id: string;
      name: string;
    };
    maxScore?: number;
  };
  score?: number;
  feedback?: string;
  submittedAt: string;
  status: string;
  graded?: boolean;
}

export default function GradesScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const colorScheme = useColorScheme();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch student's submissions with grades
  const fetchGrades = async () => {
    if (!isAuthenticated) return;
    
    try {
      setError(null);
      console.log('Fetching student submissions...');
      const mySubmissions = await assignmentService.getMySubmissions();
      console.log('Received submissions:', JSON.stringify(mySubmissions));
      
      // Sort submissions by date (newest first)
      const sortedSubmissions = mySubmissions.sort((a: Submission, b: Submission) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      setSubmissions(sortedSubmissions);
    } catch (err: any) {
      console.error('Error fetching grades:', err);
      // Show more detailed error information
      let errorMessage = 'An error occurred while loading grades. Please try again later.';
      
      if (err.response) {
        console.log('Error response:', JSON.stringify(err.response.data));
        errorMessage += ' (Server response: ' + (err.response.data?.message || err.response.status) + ')';
      } else if (err.request) {
        console.log('Error request:', err.request);
        errorMessage += ' (Request error: No response from server)';
      } else {
        console.log('Error message:', err.message);
        errorMessage += ' (Error: ' + err.message + ')';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch grades on component mount and when auth state changes
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchGrades();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);
  
  // Pull-to-refresh functionality
  const onRefresh = () => {
    setRefreshing(true);
    fetchGrades();
  };

  // Calculate GPA and statistics
  const calculateStats = () => {
    if (!submissions || submissions.length === 0) return { gpa: 0, totalGraded: 0, averageScore: 0 };
    
    const gradedSubmissions = submissions.filter(sub => sub.graded && sub.score !== undefined);
    const totalGraded = gradedSubmissions.length;
    
    if (totalGraded === 0) return { gpa: 0, totalGraded: 0, averageScore: 0 };
    
    const totalScore = gradedSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
    const averageScore = totalScore / totalGraded;
    
    // Calculate GPA on a 4.0 scale (simplified)
    let gpa = 0;
    if (averageScore >= 90) gpa = 4.0;
    else if (averageScore >= 80) gpa = 3.0;
    else if (averageScore >= 70) gpa = 2.0;
    else if (averageScore >= 60) gpa = 1.0;
    
    return { gpa, totalGraded, averageScore };
  };
  
  const stats = calculateStats();
  
  // Get letter grade based on score
  const getLetterGrade = (score?: number) => {
    if (score === undefined) return '-';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };
  
  // Get color based on score
  const getScoreColor = (score?: number) => {
    if (score === undefined) return '#888';
    if (score >= 90) return '#4CAF50'; // Green
    if (score >= 80) return '#8BC34A'; // Light Green
    if (score >= 70) return '#FFC107'; // Amber
    if (score >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Grades
        </Text>
      </View>
      
      {authLoading || loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Loading grades...
          </Text>
        </View>
      ) : !isAuthenticated ? (
        <View style={styles.content}>
          <MaterialIcons name="lock" size={48} color="#888" />
          <Text style={[styles.message, { color: Colors[colorScheme ?? 'light'].text }]}>
            Please log in to view your grades.
          </Text>
        </View>
      ) : error ? (
        <View style={styles.content}>
          <MaterialIcons name="error" size={48} color="#F44336" />
          <Text style={[styles.message, { color: Colors[colorScheme ?? 'light'].text }]}>
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchGrades}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : submissions.length === 0 ? (
        <View style={styles.content}>
          <MaterialIcons name="assignment" size={48} color="#888" />
          <Text style={[styles.message, { color: Colors[colorScheme ?? 'light'].text }]}>
            No graded assignments or exams found yet.
          </Text>
        </View>
      ) : (
        <View style={styles.gradesContainer}>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Average Score</Text>
              <Text style={styles.summaryValue}>
                {stats.averageScore.toFixed(1)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>GPA</Text>
              <Text style={styles.summaryValue}>{stats.gpa.toFixed(1)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Graded</Text>
              <Text style={styles.summaryValue}>{stats.totalGraded}</Text>
            </View>
          </View>
          
          {/* Grades List */}
          <View style={styles.gradesList}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              All Grades
            </Text>
            
            {submissions.map((submission) => (
              <View key={submission._id} style={styles.gradeItem}>
                <View style={styles.gradeHeader}>
                  <Text style={styles.gradeTitle}>
                    {submission.assignment?.title || 'Untitled Assignment'}
                  </Text>
                  {submission.assignment?.course && (
                    <Text style={styles.courseTag}>
                      {submission.assignment.course.name}
                    </Text>
                  )}
                </View>
                
                <View style={styles.gradeDetails}>
                  <View style={styles.gradeInfo}>
                    <Text style={styles.gradeLabel}>Submission Date:</Text>
                    <Text style={styles.gradeValue}>
                      {new Date(submission.submittedAt).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                  
                  <View style={styles.gradeInfo}>
                    <Text style={styles.gradeLabel}>Status:</Text>
                    <Text style={styles.gradeValue}>
                      {submission.graded ? 'Graded' : 'Pending'}
                    </Text>
                  </View>
                  
                  {submission.graded && (
                    <View style={styles.scoreContainer}>
                      <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(submission.score) }]}>
                        <Text style={styles.scoreText}>
                          {getLetterGrade(submission.score)}
                        </Text>
                      </View>
                      <Text style={[styles.scoreValue, { color: getScoreColor(submission.score) }]}>
                        {submission.score !== undefined ? `${submission.score}/${submission.assignment?.maxScore || 100}` : '-'}
                      </Text>
                    </View>
                  )}
                </View>
                
                {submission.feedback && (
                  <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackLabel}>Feedback:</Text>
                    <Text style={styles.feedbackText}>{submission.feedback}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  gradesContainer: {
    padding: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  gradesList: {
    marginBottom: 20,
  },
  gradeItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  gradeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  courseTag: {
    fontSize: 12,
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: 8,
  },
  gradeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeInfo: {
    marginRight: 16,
    marginBottom: 8,
  },
  gradeLabel: {
    fontSize: 12,
    color: '#666',
  },
  gradeValue: {
    fontSize: 14,
    color: '#333',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  scoreText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  feedbackContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
