import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import { courseService } from '@/services/api';
import * as FileSystem from 'expo-file-system';

// Course type definition
interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Schedule {
  _id: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface Material {
  _id: string;
  title: string;
  description?: string;
  type: 'file' | 'video' | 'link' | 'text' | 'other';
  url: string;
  content?: string;
  uploadDate: string;
  addedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface Course {
  _id: string;
  name: string;
  code: string;
  description: string;
  teacher: Teacher;
  grade: number;
  academicYear: string;
  semester: string;
  schedule: Schedule[];
  syllabus?: string;
  materials: Material[];
  students: any[];
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const courseData = await courseService.getCourseById(id as string);
      console.log('Course data received:', courseData);
      
      if (courseData) {
        setCourse(courseData);
        fetchMaterials();
      } else {
        console.error('Unexpected course data format:', courseData);
        setError('Failed to load course details. Unexpected data format.');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    if (!id) return;
    
    try {
      setMaterialsLoading(true);
      const materialsData = await courseService.getCourseMaterials(id as string);
      console.log('Materials data received:', materialsData);
      
      if (Array.isArray(materialsData)) {
        setMaterials(materialsData);
      } else {
        console.error('Unexpected materials data format:', materialsData);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleAddMaterial = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileName = result.assets[0].name;
      const fileType = result.assets[0].mimeType || 'application/octet-stream';

      // Create form data for upload
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: fileType,
      } as any);
      
      formData.append('title', fileName);
      formData.append('type', 'file');

      Alert.alert(
        'Upload Material',
        'Do you want to upload this file as course material?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Upload',
            onPress: async () => {
              try {
                setMaterialsLoading(true);
                await courseService.addCourseMaterial(id as string, formData as any);
                Alert.alert('Success', 'Material uploaded successfully');
                fetchMaterials();
              } catch (error) {
                console.error('Error uploading material:', error);
                Alert.alert('Error', 'Failed to upload material');
              } finally {
                setMaterialsLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const handleOpenMaterial = async (material: Material) => {
    if (Platform.OS === 'web') {
      window.open(material.url, '_blank');
    } else {
      // For mobile, use WebBrowser to open the URL directly
      try {
        await WebBrowser.openBrowserAsync(material.url);
      } catch (error) {
        console.error('Error opening material:', error);
        Alert.alert('Error', 'Failed to open material. The URL may be invalid.');
      }
    }
  };

  const formatSchedule = (schedule: Schedule) => {
    return `${schedule.day} ${schedule.startTime}-${schedule.endTime} (Room: ${schedule.room})`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={{ marginTop: 16 }}>Loading course details...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <ThemedText style={{ marginTop: 16 }}>{error || 'Course not found'}</ThemedText>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.back()}
          >
            <ThemedText style={styles.buttonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
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
          <ThemedText type="title">{course.name}</ThemedText>
          <ThemedText>{course.code}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Course Information</ThemedText>
          <ThemedView style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Teacher:</ThemedText>
            <ThemedText>{`${course.teacher.firstName} ${course.teacher.lastName}`}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Description:</ThemedText>
            <ThemedText>{course.description}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Academic Year:</ThemedText>
            <ThemedText>{course.academicYear}</ThemedText>
          </ThemedView>
          <ThemedView style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Semester:</ThemedText>
            <ThemedText>{course.semester}</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Schedule</ThemedText>
          {course.schedule.map((scheduleItem, index) => (
            <ThemedView key={scheduleItem._id || index} style={styles.scheduleItem}>
              <ThemedText>{formatSchedule(scheduleItem)}</ThemedText>
            </ThemedView>
          ))}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="subtitle">Course Materials</ThemedText>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddMaterial}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </ThemedView>

          {materialsLoading ? (
            <ThemedView style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <ThemedText style={{ marginTop: 8 }}>Loading materials...</ThemedText>
            </ThemedView>
          ) : materials.length > 0 ? (
            materials.map((material) => (
              <TouchableOpacity 
                key={material._id} 
                style={styles.materialItem}
                onPress={() => handleOpenMaterial(material)}
              >
                <ThemedView style={styles.materialContent}>
                  <ThemedText style={styles.materialTitle}>{material.title}</ThemedText>
                  {material.description && (
                    <ThemedText style={styles.materialDescription}>{material.description}</ThemedText>
                  )}
                  <ThemedText style={styles.materialMeta}>
                    Added on {new Date(material.uploadDate).toLocaleDateString()}
                  </ThemedText>
                </ThemedView>
                <Ionicons 
                  name={material.type === 'file' ? 'document' : material.type === 'video' ? 'videocam' : 'link'} 
                  size={24} 
                  color="#888" 
                />
              </TouchableOpacity>
            ))
          ) : (
            <ThemedView style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={48} color="#ccc" />
              <ThemedText style={{ marginTop: 8, color: '#888' }}>No materials available</ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Students</ThemedText>
          {course.students.length > 0 ? (
            course.students.map((student, index) => (
              <ThemedView key={student._id || index} style={styles.studentItem}>
                <ThemedView style={styles.studentAvatar}>
                  <ThemedText>{`${student.firstName?.charAt(0)}${student.lastName?.charAt(0)}`}</ThemedText>
                </ThemedView>
                <ThemedView>
                  <ThemedText>{`${student.firstName} ${student.lastName}`}</ThemedText>
                  <ThemedText style={styles.studentEmail}>{student.email}</ThemedText>
                </ThemedView>
              </ThemedView>
            ))
          ) : (
            <ThemedView style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <ThemedText style={{ marginTop: 8, color: '#888' }}>No students enrolled</ThemedText>
            </ThemedView>
          )}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    width: 100,
  },
  scheduleItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  materialItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    alignItems: 'center',
  },
  materialContent: {
    flex: 1,
  },
  materialTitle: {
    fontWeight: 'bold',
  },
  materialDescription: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  materialMeta: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 8,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentEmail: {
    color: '#888',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
