import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  status: 'completed' | 'pending' | 'overdue';
}

// Mock data - replace with API call to your backend
const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: '1', title: 'Algebra Homework', course: 'Mathematics', dueDate: '2023-11-15', status: 'completed' },
  { id: '2', title: 'Physics Lab Report', course: 'Physics', dueDate: '2023-11-18', status: 'pending' },
  { id: '3', title: 'Programming Exercise', course: 'Computer Science', dueDate: '2023-11-10', status: 'overdue' },
  { id: '4', title: 'Biology Research Paper', course: 'Biology', dueDate: '2023-11-20', status: 'pending' },
  { id: '5', title: 'Chemistry Quiz Preparation', course: 'Chemistry', dueDate: '2023-11-22', status: 'pending' },
];

export default function AssignmentsScreen() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating API call with setTimeout
    const timer = setTimeout(() => {
      setAssignments(MOCK_ASSIGNMENTS);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
    
    // When connecting to real backend:
    // async function fetchAssignments() {
    //   try {
    //     const response = await fetch('http://your-backend-url/api/assignments');
    //     const data = await response.json();
    //     setAssignments(data);
    //   } catch (error) {
    //     console.error('Error fetching assignments:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // }
    // fetchAssignments();
  }, []);

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FFC107';
      case 'overdue':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status: Assignment['status']) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'pending':
        return 'schedule';
      case 'overdue':
        return 'error';
      default:
        return 'help';
    }
  };

  const renderAssignmentItem = ({ item }: { item: Assignment }) => (
    <TouchableOpacity style={styles.assignmentCard}>
      <ThemedView style={styles.assignmentContent}>
        <ThemedText type="subtitle">{item.title}</ThemedText>
        <ThemedText>{item.course}</ThemedText>
        <ThemedText style={styles.dueDateText}>Due: {item.dueDate}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.statusContainer}>
        <MaterialIcons 
          name={getStatusIcon(item.status)} 
          size={24} 
          color={getStatusColor(item.status)} 
        />
        <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </ThemedText>
      </ThemedView>
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
        </ThemedView>
      ) : (
        <FlatList
          data={assignments}
          renderItem={renderAssignmentItem}
          keyExtractor={(item) => item.id}
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
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assignmentContent: {
    flex: 1,
  },
  dueDateText: {
    marginTop: 4,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
}); 