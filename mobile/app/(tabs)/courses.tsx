import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { courseService } from '@/services/api';

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Course {
  _id: string;
  name: string;
  teacher: Teacher;
  code: string;
  description: string;
}

export default function CoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await courseService.getAllCourses();
      console.log('Courses data received:', coursesData);
      
      if (Array.isArray(coursesData)) {
        setCourses(coursesData);
      } else {
        console.error('Unexpected API response format:', coursesData);
        Alert.alert('Error', 'Failed to load courses. Unexpected data format.');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity 
      style={styles.courseCard}
      onPress={() => {
        // Navigate to course detail screen
        // Using a simpler approach that works with TypeScript
        // @ts-ignore - Expo Router types are sometimes too strict
        router.push(`/course/${item._id}`);
      }}
    >
      <ThemedView style={styles.courseContent}>
        <ThemedText type="subtitle">{item.name}</ThemedText>
        <ThemedText>{item.code}</ThemedText>
        <ThemedText style={styles.teacherText}>
          {item.teacher ? `${item.teacher.firstName} ${item.teacher.lastName}` : 'Unknown Teacher'}
        </ThemedText>
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