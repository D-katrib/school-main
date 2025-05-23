import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface CourseFormProps {
  initialValues?: {
    name: string;
    code: string;
    description: string;
    grade?: string;
    academicYear?: string;
    semester?: string;
    syllabusUrl?: string;
    schedule?: ScheduleItem[];
    teacher?: string;
  };
  onSubmit: (values: {
    name: string;
    code: string;
    description: string;
    grade: string;
    academicYear: string;
    semester: string;
    syllabusUrl: string;
    schedule: ScheduleItem[];
    teacher?: string;
  }) => void;
  onCancel: () => void;
  isAdmin?: boolean;
}

export default function CourseForm({ initialValues, onSubmit, onCancel, isAdmin = false }: CourseFormProps) {
  const [name, setName] = useState(initialValues?.name || '');
  const [code, setCode] = useState(initialValues?.code || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [grade, setGrade] = useState(initialValues?.grade || '');
  const [academicYear, setAcademicYear] = useState(initialValues?.academicYear || '');
  const [semester, setSemester] = useState(initialValues?.semester || 'Fall');
  const [syllabusUrl, setSyllabusUrl] = useState(initialValues?.syllabusUrl || '');
  const [schedule, setSchedule] = useState<ScheduleItem[]>(initialValues?.schedule || []);
  const [teacher, setTeacher] = useState(initialValues?.teacher || '');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherModalVisible, setTeacherModalVisible] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // For schedule modal
  const [modalVisible, setModalVisible] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [semesterModalVisible, setSemesterModalVisible] = useState(false);
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [currentDay, setCurrentDay] = useState('Monday');
  const [currentStartTime, setCurrentStartTime] = useState('08:00');
  const [currentEndTime, setCurrentEndTime] = useState('09:30');
  const [currentRoom, setCurrentRoom] = useState('');
  
  // Fetch teachers if user is admin
  useEffect(() => {
    if (isAdmin) {
      const fetchTeachers = async () => {
        try {
          const { userService } = require('../services/api');
          const teachersData = await userService.getAllTeachers();
          setTeachers(teachersData);
        } catch (error) {
          console.error('Error fetching teachers:', error);
        }
      };
      
      fetchTeachers();
    }
  }, [isAdmin]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Course name is required';
    }
    
    if (!code.trim()) {
      newErrors.code = 'Course code is required';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!grade.trim()) {
      newErrors.grade = 'Grade level is required';
    } else {
      const gradeNum = parseInt(grade);
      if (isNaN(gradeNum)) {
        newErrors.grade = 'Grade level must be a number';
      } else if (gradeNum < 1 || gradeNum > 100) {
        newErrors.grade = 'Grade level must be between 1 and 100';
      }
    }
    
    if (!academicYear.trim()) {
      newErrors.academicYear = 'Academic year is required';
    }
    
    if (!semester.trim()) {
      newErrors.semester = 'Semester is required';
    }
    
    if (isAdmin && !teacher.trim()) {
      newErrors.teacher = 'Teacher is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const courseData: any = {
        name,
        code,
        description,
        grade,
        academicYear,
        semester,
        syllabusUrl,
        schedule
      };
      
      // Include teacher ID if admin user
      if (isAdmin && teacher) {
        courseData.teacher = teacher;
      }
      
      onSubmit(courseData);
    }
  };

  const addScheduleItem = () => {
    const newScheduleItem: ScheduleItem = {
      day: currentDay,
      startTime: currentStartTime,
      endTime: currentEndTime,
      room: currentRoom
    };
    
    setSchedule([...schedule, newScheduleItem]);
    setModalVisible(false);
    setCurrentRoom('');
  };

  const removeScheduleItem = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule.splice(index, 1);
    setSchedule(newSchedule);
  };

  return (
    <ScrollView>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">
            {initialValues ? 'Edit Course' : 'Add New Course'}
          </ThemedText>
          <TouchableOpacity onPress={onCancel}>
            <Ionicons name="close" size={24} color="#888" />
          </TouchableOpacity>
        </ThemedView>
        
        <ThemedView style={styles.form}>
          <ThemedView style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Course Name*</ThemedText>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              value={name}
              onChangeText={setName}
              placeholder="Enter course name"
            />
            {errors.name ? (
              <ThemedText style={styles.errorText}>{errors.name}</ThemedText>
            ) : null}
          </ThemedView>
          
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Course Code*</ThemedText>
            <TextInput
              style={[styles.input, errors.code ? styles.inputError : null]}
              value={code}
              onChangeText={setCode}
              placeholder="Enter course code"
            />
            {errors.code ? (
              <ThemedText style={styles.errorText}>{errors.code}</ThemedText>
            ) : null}
          </ThemedView>
          
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Description*</ThemedText>
            <TextInput
              style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }, errors.description ? styles.inputError : null]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter course description"
              multiline
              numberOfLines={4}
            />
            {errors.description ? (
              <ThemedText style={styles.errorText}>{errors.description}</ThemedText>
            ) : null}
          </ThemedView>
          
          <ThemedView style={styles.row}>
            <ThemedView style={[styles.formGroup, styles.halfWidth]}>
              <ThemedText style={styles.label}>Grade Level*</ThemedText>
              <TextInput
                style={[styles.input, errors.grade ? styles.inputError : null]}
                value={grade}
                onChangeText={setGrade}
                placeholder="e.g. 9"
                keyboardType="numeric"
              />
              {errors.grade ? (
                <ThemedText style={styles.errorText}>{errors.grade}</ThemedText>
              ) : null}
            </ThemedView>
            
            <ThemedView style={[styles.formGroup, styles.halfWidth]}>
              <ThemedText style={styles.label}>Academic Year*</ThemedText>
              <TextInput
                style={[styles.input, errors.academicYear ? styles.inputError : null]}
                value={academicYear}
                onChangeText={setAcademicYear}
                placeholder="e.g. 2023-2024"
              />
              {errors.academicYear ? (
                <ThemedText style={styles.errorText}>{errors.academicYear}</ThemedText>
              ) : null}
            </ThemedView>
          </ThemedView>
          
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Semester*</ThemedText>
            <TouchableOpacity 
              style={[styles.input, errors.semester ? styles.inputError : null]}
              onPress={() => setSemesterModalVisible(true)}
            >
              <ThemedText>{semester}</ThemedText>
            </TouchableOpacity>
            {errors.semester ? (
              <ThemedText style={styles.errorText}>{errors.semester}</ThemedText>
            ) : null}
            
            <Modal
              visible={semesterModalVisible}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setSemesterModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <ThemedText style={styles.modalTitle}>Select Semester</ThemedText>
                  
                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      setSemester('Fall');
                      setSemesterModalVisible(false);
                    }}
                  >
                    <ThemedText style={styles.modalOptionText}>Fall</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      setSemester('Spring');
                      setSemesterModalVisible(false);
                    }}
                  >
                    <ThemedText style={styles.modalOptionText}>Spring</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.modalOption}
                    onPress={() => {
                      setSemester('Summer');
                      setSemesterModalVisible(false);
                    }}
                  >
                    <ThemedText style={styles.modalOptionText}>Summer</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, { marginTop: 15 }]}
                    onPress={() => setSemesterModalVisible(false)}
                  >
                    <ThemedText style={styles.buttonText}>Cancel</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </ThemedView>
          
          {isAdmin && (
            <ThemedView style={styles.formGroup}>
              <ThemedText style={styles.label}>Teacher*</ThemedText>
              <TouchableOpacity 
                style={[styles.input, errors.teacher ? styles.inputError : null]}
                onPress={() => setTeacherModalVisible(true)}
              >
                <ThemedText>
                  {teacher ? teachers.find(t => t._id === teacher)?.firstName + ' ' + teachers.find(t => t._id === teacher)?.lastName : 'Select a teacher'}
                </ThemedText>
              </TouchableOpacity>
              {errors.teacher ? (
                <ThemedText style={styles.errorText}>{errors.teacher}</ThemedText>
              ) : null}
              
              <Modal
                visible={teacherModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setTeacherModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <ThemedText style={styles.modalTitle}>Select Teacher</ThemedText>
                    
                    <ScrollView style={{ maxHeight: 300 }}>
                      {teachers.map((teacherItem) => (
                        <TouchableOpacity 
                          key={teacherItem._id}
                          style={styles.modalOption}
                          onPress={() => {
                            setTeacher(teacherItem._id);
                            setTeacherModalVisible(false);
                          }}
                        >
                          <ThemedText style={styles.modalOptionText}>
                            {teacherItem.firstName} {teacherItem.lastName}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    
                    <TouchableOpacity 
                      style={[styles.button, { marginTop: 15 }]}
                      onPress={() => setTeacherModalVisible(false)}
                    >
                      <ThemedText style={styles.buttonText}>Cancel</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </ThemedView>
          )}
          
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>Syllabus URL (optional)</ThemedText>
            <TextInput
              style={styles.input}
              value={syllabusUrl}
              onChangeText={setSyllabusUrl}
              placeholder="https://example.com/syllabus.pdf"
            />
          </ThemedView>
          
          <ThemedView style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Schedule</ThemedText>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </ThemedView>
          
          {schedule.length > 0 ? (
            schedule.map((item, index) => (
              <ThemedView key={index} style={styles.scheduleItem}>
                <ThemedView style={styles.scheduleText}>
                  <ThemedText style={{ fontWeight: 'bold' }}>{item.day}</ThemedText>
                  <ThemedText>{item.startTime} - {item.endTime}</ThemedText>
                  <ThemedText style={{ color: '#666', fontSize: 14 }}>Room: {item.room}</ThemedText>
                </ThemedView>
                <TouchableOpacity
                  onPress={() => removeScheduleItem(index)}
                  style={styles.removeButton}
                >
                  <Ionicons name="trash" size={20} color="#F44336" />
                </TouchableOpacity>
              </ThemedView>
            ))
          ) : (
            <ThemedView style={styles.emptySchedule}>
              <ThemedText style={styles.emptyText}>No schedule items added yet</ThemedText>
            </ThemedView>
          )}
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <ThemedText style={styles.submitButtonText}>
              {initialValues ? 'Update Course' : 'Create Course'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        {/* Schedule Item Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <ThemedView style={styles.modalContainer}>
            <ThemedView style={styles.modalContent}>
              <ThemedView style={styles.modalHeader}>
                <ThemedText type="subtitle">Add Schedule Item</ThemedText>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#888" />
                </TouchableOpacity>
              </ThemedView>
              
              <ThemedView style={styles.formGroup}>
                <ThemedText style={styles.label}>Day*</ThemedText>
                <TouchableOpacity 
                  style={styles.input}
                  onPress={() => setDayModalVisible(true)}
                >
                  <ThemedText>{currentDay}</ThemedText>
                </TouchableOpacity>
              </ThemedView>
              
              <Modal
                visible={dayModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setDayModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <ThemedText style={styles.modalTitle}>Select Day</ThemedText>
                    
                    <TouchableOpacity 
                      style={styles.modalOption}
                      onPress={() => {
                        setCurrentDay('Monday');
                        setDayModalVisible(false);
                      }}
                    >
                      <ThemedText style={styles.modalOptionText}>Monday</ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.modalOption}
                      onPress={() => {
                        setCurrentDay('Tuesday');
                        setDayModalVisible(false);
                      }}
                    >
                      <ThemedText style={styles.modalOptionText}>Tuesday</ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.modalOption}
                      onPress={() => {
                        setCurrentDay('Wednesday');
                        setDayModalVisible(false);
                      }}
                    >
                      <ThemedText style={styles.modalOptionText}>Wednesday</ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.modalOption}
                      onPress={() => {
                        setCurrentDay('Thursday');
                        setDayModalVisible(false);
                      }}
                    >
                      <ThemedText style={styles.modalOptionText}>Thursday</ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.modalOption}
                      onPress={() => {
                        setCurrentDay('Friday');
                        setDayModalVisible(false);
                      }}
                    >
                      <ThemedText style={styles.modalOptionText}>Friday</ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.modalOption}
                      onPress={() => {
                        setCurrentDay('Saturday');
                        setDayModalVisible(false);
                      }}
                    >
                      <ThemedText style={styles.modalOptionText}>Saturday</ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.modalOption}
                      onPress={() => {
                        setCurrentDay('Sunday');
                        setDayModalVisible(false);
                      }}
                    >
                      <ThemedText style={styles.modalOptionText}>Sunday</ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.button, { marginTop: 15 }]}
                      onPress={() => setDayModalVisible(false)}
                    >
                      <ThemedText style={styles.buttonText}>Cancel</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
              
              <ThemedView style={styles.row}>
                <ThemedView style={[styles.formGroup, styles.halfWidth]}>
                  <ThemedText style={styles.label}>Start Time*</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={currentStartTime}
                    onChangeText={setCurrentStartTime}
                    placeholder="08:00"
                  />
                </ThemedView>
                
                <ThemedView style={[styles.formGroup, styles.halfWidth]}>
                  <ThemedText style={styles.label}>End Time*</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={currentEndTime}
                    onChangeText={setCurrentEndTime}
                    placeholder="09:30"
                  />
                </ThemedView>
              </ThemedView>
              
              <ThemedView style={styles.formGroup}>
                <ThemedText style={styles.label}>Room*</ThemedText>
                <TextInput
                  style={styles.input}
                  value={currentRoom}
                  onChangeText={setCurrentRoom}
                  placeholder="Room number/name"
                />
              </ThemedView>
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={addScheduleItem}
              >
                <ThemedText style={styles.submitButtonText}>Add Schedule</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </Modal>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionHeader: {
    backgroundColor: '#e0f2f1',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#00796b',
    fontWeight: 'bold',
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    marginBottom: 10,
  },
  scheduleText: {
    flex: 1,
  },
  deleteButton: {
    padding: 5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  removeButton: {
    padding: 8,
  },
  emptySchedule: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    marginBottom: 16,
  },
  emptyText: {
    color: '#888',
  },
  courseSubmitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
