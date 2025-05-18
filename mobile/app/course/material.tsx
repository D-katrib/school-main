import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export default function MaterialViewerScreen() {
  const { url, title } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (url) {
      openMaterial();
    }
  }, [url]);

  const openMaterial = async () => {
    if (!url) {
      setError('No material URL provided');
      return;
    }

    try {
      setLoading(true);
      // Try to open in WebBrowser first
      const result = await WebBrowser.openBrowserAsync(url as string);
      
      if (result.type === 'cancel') {
        // If WebBrowser fails or user cancels, try to open with Linking
        await Linking.openURL(url as string);
      }
    } catch (error) {
      console.error('Error opening material:', error);
      setError('Failed to open material. The URL may be invalid or the file format is not supported.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <ThemedText type="title">{title || 'Course Material'}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        {loading ? (
          <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <ThemedText style={{ marginTop: 16 }}>Opening material...</ThemedText>
          </ThemedView>
        ) : error ? (
          <ThemedView style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
            <ThemedText style={{ marginTop: 16, textAlign: 'center' }}>{error}</ThemedText>
            <TouchableOpacity 
              style={styles.button} 
              onPress={openMaterial}
            >
              <ThemedText style={styles.buttonText}>Try Again</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          <ThemedView style={styles.infoContainer}>
            <Ionicons name="document-text-outline" size={48} color="#007AFF" />
            <ThemedText style={{ marginTop: 16, textAlign: 'center' }}>
              If the material doesn't open automatically, tap the button below.
            </ThemedText>
            <TouchableOpacity 
              style={styles.button} 
              onPress={openMaterial}
            >
              <ThemedText style={styles.buttonText}>Open Material</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </ThemedView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
});
