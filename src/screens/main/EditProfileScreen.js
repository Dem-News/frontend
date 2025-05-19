import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { updateProfile } from '../../store/slices/authSlice';
import { userAPI } from '../../services/api';

export default function EditProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState(user.profile?.bio || '');
  const [interests, setInterests] = useState(user.profile?.interests?.join(', ') || '');
  const [preferences, setPreferences] = useState({
    notifications: {
      newPosts: user.preferences?.notifications?.newPosts ?? true,
      verifications: user.preferences?.notifications?.verifications ?? true,
      flags: user.preferences?.notifications?.flags ?? true,
    },
    radius: user.preferences?.radius || 5,
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      const profileData = {
        bio,
        interests: interests.split(',').map(i => i.trim()).filter(i => i),
        preferences,
      };

      const response = await userAPI.updateProfile(profileData);
      dispatch(updateProfile(response.data));
      
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Write something about yourself..."
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your interests (comma-separated)"
          value={interests}
          onChangeText={setInterests}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>New Posts</Text>
          <Switch
            value={preferences.notifications.newPosts}
            onValueChange={(value) =>
              setPreferences({
                ...preferences,
                notifications: {
                  ...preferences.notifications,
                  newPosts: value,
                },
              })
            }
          />
        </View>
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>Verifications</Text>
          <Switch
            value={preferences.notifications.verifications}
            onValueChange={(value) =>
              setPreferences({
                ...preferences,
                notifications: {
                  ...preferences.notifications,
                  verifications: value,
                },
              })
            }
          />
        </View>
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>Flags</Text>
          <Switch
            value={preferences.notifications.flags}
            onValueChange={(value) =>
              setPreferences({
                ...preferences,
                notifications: {
                  ...preferences.notifications,
                  flags: value,
                },
              })
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>News Radius (miles)</Text>
        <View style={styles.radiusContainer}>
          <TouchableOpacity
            style={styles.radiusButton}
            onPress={() =>
              setPreferences({
                ...preferences,
                radius: Math.max(1, preferences.radius - 1),
              })
            }
          >
            <Ionicons name="remove" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.radiusValue}>{preferences.radius}</Text>
          <TouchableOpacity
            style={styles.radiusButton}
            onPress={() =>
              setPreferences({
                ...preferences,
                radius: Math.min(50, preferences.radius + 1),
              })
            }
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#333',
  },
  radiusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusButton: {
    padding: 12,
  },
  radiusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 