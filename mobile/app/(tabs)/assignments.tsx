import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { assignmentService } from '../../services/api';

// Assignment type definitions
interface Course {
  _id: string;
  name: string;
  code: string;
}

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  course: Course;
  dueDate: string;
  totalPoints: number;
  createdBy: Teacher;
  createdAt: string;
  hasSubmitted?: boolean;
}

export default function AssignmentsScreen() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentService.getAssignments();
      if (response.data && response.data.data) {
        setAssignments(response.data.data);
      } else {
        setErrorMessage('Failed to load assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setErrorMessage('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isPastDue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const renderAssignmentItem = ({ item }: { item: Assignment }) => (
    <TouchableOpacity 
      style={styles.assignmentCard}
      onPress={() => {
        // Navigate to assignment detail screen
        // @ts-ignore - Expo Router types are sometimes too strict
        router.push(`/assignment/${item._id}`);
      }}
    >
      <ThemedView style={styles.assignmentContent}>
        <ThemedText type="subtitle">{item.title}</ThemedText>
        <ThemedText style={styles.courseText}>
          {item.course.name} ({item.course.code})
        </ThemedText>
        <ThemedView style={styles.assignmentFooter}>
          <ThemedText style={isPastDue(item.dueDate) ? styles.pastDue : styles.upcoming}>
            Due: {formatDate(item.dueDate)}
            {isPastDue(item.dueDate) ? ' (Past Due)' : ''}
          </ThemedText>
          {item.hasSubmitted && (
            <ThemedView style={styles.submittedBadge}>
              <ThemedText style={styles.submittedText}>Submitted</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>
      <Ionicons name="chevron-forward" size={24} color="#888" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Assignments</ThemedText>
      </ThemedView>

      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={{ marginTop: 16 }}>Loading assignments...</ThemedText>
        </ThemedView>
      ) : errorMessage ? (
        <ThemedView style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <ThemedText style={{ marginTop: 16 }}>{errorMessage}</ThemedText>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={fetchAssignments}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : assignments.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={48} color="#888" />
          <ThemedText style={{ marginTop: 16 }}>No assignments found</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={assignments}
          renderItem={renderAssignmentItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
        />
      )}
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
  emptyContainer: {
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
  listContainer: {
    padding: 16,
  },
  assignmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  assignmentContent: {
    flex: 1,
  },
  courseText: {
    marginTop: 4,
    color: '#666',
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  pastDue: {
    color: '#ff6b6b',
  },
  upcoming: {
    color: '#4caf50',
  },
  submittedBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  submittedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 