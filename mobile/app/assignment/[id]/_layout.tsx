import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, TextInput } from 'react-native';
import { useLocalSearchParams, router, Slot } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { assignmentService } from '@/services/api';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Assignment type definitions
interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Course {
  _id: string;
  name: string;
  code: string;
}

interface Attachment {
  _id?: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  uploadDate?: string;
}

interface Submission {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  content: string;
  attachments: Attachment[];
  submittedAt: string;
  score?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'returned';
  isLate: boolean;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  course: Course;
  dueDate: string;
  totalPoints: number;
  attachments: Attachment[];
  createdBy: Teacher;
  createdAt: string;
  submissions?: Submission[];
}

export default function AssignmentLayout() {
  return <Slot />;
} 