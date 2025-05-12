import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Course {
  id: string;
  name: string;
  teacher: string;
  code: string;
}

// Mock data - replace with API call to your backend
const MOCK_COURSES: Course[] = [
  { id: '1', name: 'Mathematics', teacher: 'Prof. Johnson', code: 'MATH101' },
  { id: '2', name: 'Physics', teacher: 'Dr. Smith', code: 'PHYS201' },
  { id: '3', name: 'Computer Science', teacher: 'Dr. Garcia', code: 'CS301' },
  { id: '4', name: 'Biology', teacher: 'Prof. Wilson', code: 'BIO101' },
  { id: '5', name: 'Chemistry', teacher: 'Dr. Lee', code: 'CHEM201' },
];

export default function CoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating API call with setTimeout
    const timer = setTimeout(() => {
      setCourses(MOCK_COURSES);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
    
    // When connecting to real backend:
    // async function fetchCourses() {
    //   try {
    //     const response = await fetch('http://your-backend-url/api/courses');
    //     const data = await response.json();
    //     setCourses(data);
    //   } catch (error) {
    //     console.error('Error fetching courses:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // }
    // fetchCourses();
  }, []);

  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity 
      style={styles.courseCard}
      onPress={() => {
        // For now, just navigate back to home as a placeholder
        // In a real app, you'd implement a course detail page
        router.push('/(tabs)');
      }}
    >
      <ThemedView style={styles.courseContent}>
        <ThemedText type="subtitle">{item.name}</ThemedText>
        <ThemedText>{item.code}</ThemedText>
        <ThemedText style={styles.teacherText}>{item.teacher}</ThemedText>
      </ThemedView>
      <Ionicons name="chevron-forward" size={24} color="#888" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Courses</ThemedText>
      </ThemedView>
      
      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </ThemedView>
      ) : (
        <FlatList
          data={courses}
          renderItem={renderCourseItem}
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
  courseCard: {
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
  courseContent: {
    flex: 1,
  },
  teacherText: {
    marginTop: 4,
    color: '#666',
  },
}); 