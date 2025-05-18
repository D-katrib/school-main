import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type IconName = "book" | "assignment" | "event-available" | "analytics" | "event" | "chat";
type RouteDestination = "/(tabs)" | "/(tabs)/courses" | "/(tabs)/assignments" | "/(tabs)/profile";

// Dashboard quick stats
const QUICK_STATS = [
  { id: '1', title: 'Courses', value: '5', icon: 'book' as IconName, color: '#4CAF50', route: '/(tabs)/courses' as RouteDestination },
  { id: '2', title: 'Assignments', value: '3', icon: 'assignment' as IconName, color: '#FFC107', route: '/(tabs)/assignments' as RouteDestination },
  { id: '3', title: 'Attendance', value: '98%', icon: 'event-available' as IconName, color: '#2196F3', route: '/(tabs)/profile' as RouteDestination },
  { id: '4', title: 'Grade Avg.', value: 'A-', icon: 'analytics' as IconName, color: '#9C27B0', route: '/(tabs)/profile' as RouteDestination },
];

// Upcoming events
const UPCOMING_EVENTS = [
  { 
    id: '1', 
    title: 'Math Quiz', 
    date: 'Tomorrow, 9:15 AM', 
    location: 'Room 201', 
    course: 'Mathematics'
  },
  { 
    id: '2', 
    title: 'Science Fair', 
    date: 'Nov 20, 1:00 PM', 
    location: 'Main Hall', 
    course: 'Science'
  },
  { 
    id: '3', 
    title: 'Parent-Teacher Conference', 
    date: 'Nov 25, 4:30 PM', 
    location: 'Online', 
    course: 'All Courses'
  },
];

export default function HomeScreen() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [apiError, setApiError] = useState<string | null>(null);

  // Check API connection on component mount
  useEffect(() => {
    checkApiConnection();
  }, []);

  // Function to check if the API is accessible
  const checkApiConnection = async () => {
    try {
      setApiStatus('checking');
      setApiError(null);
      
      // Try to connect to the API
      const response = await fetch('http://192.168.1.14:5000/api/courses');
      
      if (response.ok) {
        setApiStatus('connected');
      } else {
        setApiStatus('error');
        setApiError(`API responded with status: ${response.status}`);
      }
    } catch (err) {
      setApiStatus('error');
      setApiError(`API connection error: ${err instanceof Error ? err.message : String(err)}`);
      console.error('API connection error:', err);
    }
  };
  
  // Get current time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedView>
          <ThemedText type="title">{getGreeting()}</ThemedText>
          <ThemedText>Alex Smith • 11th Grade</ThemedText>
        </ThemedView>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile" as RouteDestination)}>
          <ThemedView style={styles.avatarPlaceholder}>
            <ThemedText type="subtitle">A</ThemedText>
          </ThemedView>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* API Connection Status */}
        <ThemedView style={styles.apiStatusContainer}>
          <ThemedView style={styles.apiStatusHeader}>
            <ThemedText type="subtitle">API Connection Status</ThemedText>
            <TouchableOpacity onPress={checkApiConnection}>
              <Ionicons name="refresh" size={20} color="#2196F3" />
            </TouchableOpacity>
          </ThemedView>
          
          <ThemedView style={styles.apiStatusContent}>
            <Ionicons 
              name={
                apiStatus === 'connected' ? 'checkmark-circle' : 
                apiStatus === 'checking' ? 'time' : 'alert-circle'
              } 
              size={24} 
              color={
                apiStatus === 'connected' ? '#4CAF50' : 
                apiStatus === 'checking' ? '#FFC107' : '#F44336'
              } 
            />
            <ThemedText style={styles.apiStatusText}>
              {
                apiStatus === 'connected' ? 'Connected to API' : 
                apiStatus === 'checking' ? 'Checking connection...' : 'Connection Error'
              }
            </ThemedText>
          </ThemedView>
          
          {apiError && (
            <ThemedView style={styles.apiErrorContainer}>
              <ThemedText style={styles.apiErrorText}>{apiError}</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
        
        {/* Quick Stats Section */}
        <ThemedView style={styles.statsContainer}>
          {QUICK_STATS.map((stat) => (
            <TouchableOpacity 
              key={stat.id} 
              style={[styles.statCard, { backgroundColor: stat.color }]}
              onPress={() => router.push(stat.route)}
            >
              <MaterialIcons name={stat.icon} size={28} color="#fff" />
              <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
              <ThemedText style={styles.statTitle}>{stat.title}</ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>

        {/* Upcoming Events Section */}
        <ThemedView style={styles.sectionContainer}>
          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="subtitle">Upcoming Events</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {UPCOMING_EVENTS.map(event => (
            <ThemedView key={event.id} style={styles.eventCard}>
              <ThemedView style={styles.eventIcon}>
                <MaterialIcons name="event" size={24} color="#4CAF50" />
              </ThemedView>
              <ThemedView style={styles.eventDetails}>
                <ThemedText type="defaultSemiBold">{event.title}</ThemedText>
                <ThemedText style={styles.eventMeta}>
                  {event.date} • {event.location}
                </ThemedText>
                <ThemedText style={styles.eventCourse}>{event.course}</ThemedText>
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>

        {/* Quick Actions Section */}
        <ThemedView style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Actions</ThemedText>
          
          <ThemedView style={styles.quickActionsContainer}>
            <TouchableOpacity style={styles.quickActionButton}>
              <ThemedView style={[styles.quickActionIcon, { backgroundColor: '#E91E63' }]}>
                <MaterialIcons name="assignment" size={24} color="#fff" />
              </ThemedView>
              <ThemedText style={styles.quickActionText}>Submit Assignment</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton}>
              <ThemedView style={[styles.quickActionIcon, { backgroundColor: '#2196F3' }]}>
                <MaterialIcons name="chat" size={24} color="#fff" />
              </ThemedView>
              <ThemedText style={styles.quickActionText}>Message Teacher</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton}>
              <ThemedView style={[styles.quickActionIcon, { backgroundColor: '#FF9800' }]}>
                <Ionicons name="calendar" size={24} color="#fff" />
              </ThemedView>
              <ThemedText style={styles.quickActionText}>View Schedule</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  apiStatusContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  apiStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  apiStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  apiStatusText: {
    marginLeft: 8,
    fontSize: 16,
  },
  apiErrorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  apiErrorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statTitle: {
    color: '#fff',
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  seeAllText: {
    color: '#2196F3',
  },
  eventCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
  },
  eventIcon: {
    marginRight: 12,
    justifyContent: 'center',
  },
  eventDetails: {
    flex: 1,
  },
  eventMeta: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  eventCourse: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    alignItems: 'center',
    width: '30%',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
