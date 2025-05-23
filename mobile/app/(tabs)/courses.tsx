import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { courseService, userService } from '@/services/api';
import CourseForm from '@/components/CourseForm';

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
  grade?: number;
  academicYear?: string;
  semester?: string;
  syllabus?: string;
  schedule?: { day: string; startTime: string; endTime: string; room: string }[];
}

export default function CoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    fetchUserProfile();
    fetchCourses();
  }, []);
  
  const fetchUserProfile = async () => {
    try {
      const userData = await userService.getProfile();
      setUserRole(userData.role);
      setUserId(userData._id);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

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
  
  const handleCreateCourse = async (courseData: { 
    name: string; 
    code: string; 
    description: string;
    grade: string;
    academicYear: string;
    semester: string;
    syllabusUrl: string;
    schedule: { day: string; startTime: string; endTime: string; room: string }[];
  }) => {
    try {
      setLoading(true);
      await courseService.createCourse(courseData);
      setModalVisible(false);
      fetchCourses();
      Alert.alert('Success', 'Course created successfully');
    } catch (error: any) {
      console.error('Error creating course:', error);
      Alert.alert('Error', 'Failed to create course');
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (courseData: { 
    name: string; 
    code: string; 
    description: string;
    grade: string;
    academicYear: string;
    semester: string;
    syllabusUrl: string;
    schedule: { day: string; startTime: string; endTime: string; room: string }[];
  }) => {
    if (!selectedCourse) return;
    
    try {
      setLoading(true);
      await courseService.updateCourse(selectedCourse._id, courseData);
      setModalVisible(false);
      setSelectedCourse(null);
      fetchCourses();
      Alert.alert('Success', 'Course updated successfully');
    } catch (error: any) {
      console.error('Error updating course:', error);
      Alert.alert('Error', 'Failed to update course');
      setLoading(false);
    }
  };

  const handleDeleteCourse = (course: Course) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete ${course.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await courseService.deleteCourse(course._id);
              fetchCourses();
              Alert.alert('Success', 'Course deleted successfully');
            } catch (error: any) {
              console.error('Error deleting course:', error);
              
              // Check if it's a permission error
              if (error.response && error.response.status === 403) {
                Alert.alert(
                  'Permission Denied',
                  'You can only delete courses that you teach. This course is taught by another teacher.'
                );
              } else {
                Alert.alert('Error', 'Failed to delete course');
              }
              
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Check if the user is allowed to edit/delete this course
  const isTeacherOfCourse = (course: Course) => {
    // Admin can edit/delete any course
    if (userRole === 'admin') {
      return true;
    }
    
    // Teachers can only edit/delete their own courses
    if (userRole === 'teacher' && course.teacher && course.teacher._id === userId) {
      return true;
    }
    
    return false;
  };

  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity 
      style={styles.courseCard}
      onPress={() => {
        // Navigate to course detail screen
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
      <ThemedView style={styles.courseActions}>
        {isTeacherOfCourse(item) && (
          <>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setSelectedCourse(item);
                setModalVisible(true);
              }}
            >
              <Ionicons name="pencil" size={20} color="#2196F3" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteCourse(item)}
            >
              <Ionicons name="trash" size={20} color="#F44336" />
            </TouchableOpacity>
          </>
        )}
        <Ionicons name="chevron-forward" size={24} color="#888" />
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Courses</ThemedText>
        {userRole !== 'student' && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              setSelectedCourse(null);
              setModalVisible(true);
            }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
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

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedCourse(null);
        }}
      >
        <CourseForm
          initialValues={selectedCourse ? {
            name: selectedCourse.name,
            code: selectedCourse.code,
            description: selectedCourse.description || '',
            grade: selectedCourse.grade?.toString() || '',
            academicYear: selectedCourse.academicYear || '',
            semester: selectedCourse.semester || 'Fall',
            syllabusUrl: selectedCourse.syllabus || '',
            schedule: selectedCourse.schedule || [],
            teacher: selectedCourse.teacher?._id
          } : undefined}
          onSubmit={selectedCourse ? handleUpdateCourse : handleCreateCourse}
          onCancel={() => {
            setModalVisible(false);
            setSelectedCourse(null);
          }}
          isAdmin={userRole === 'admin'}
        />
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  courseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 8,
  },
  teacherText: {
    marginTop: 4,
    color: '#666',
  },
}); 