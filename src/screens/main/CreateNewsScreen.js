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
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { addNews } from '../../store/slices/newsSlice';
import { newsAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Camera, Images, X } from 'phosphor-react-native';

const CATEGORIES = [
  'politics',
  'sports',
  'local',
  'emergency',
  'other',
];

export default function CreateNewsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { currentLocation } = useSelector((state) => state.location);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('other');
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState({ news: [] });

  const handleBack = () => {
    navigation.goBack();
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled) {
        const newMedia = result.assets.map(asset => asset.uri);
        setMedia([...media, ...newMedia]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      console.error('Image picker error:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setMedia([...media, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      console.error('Camera error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!title || !content) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
  
    if (!currentLocation) {
      Alert.alert('Error', 'Location is required to post news');
      return;
    }
  
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('token');

      const newsData = {
        title,
        content,
        category,
        media,
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
      };

      const response = await newsAPI.createNews(newsData);
  
      dispatch(addNews(response.data));
      Alert.alert('Success', 'News posted successfully');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to post news');
      console.log(error, "Post error")
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBack}
            disabled={loading}
          >
            <ArrowLeft size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Write your news here..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />

          {media.length > 0 && (
            <View style={styles.mediaPreview}>
              {media.map((uri, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Image source={{ uri }} style={styles.mediaImage} />
                  <TouchableOpacity
                    style={styles.removeMedia}
                    onPress={() => setMedia(media.filter((_, i) => i !== index))}
                  >
                    {/* <X size={20} color="#F20D33" /> */}
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actionContainer}>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={takePhoto}
          >
            <Camera size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={pickImage}
          >
            <Images size={24} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // page header
  pageHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    justifyContent: 'flex-start'
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00000010',
    backgroundColor: '#fff', 
  },
  // Form
  formContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 100,
  },
  input: {
    fontSize: 20,
    fontWeight: 600,
    minHeight: 200,
  },
  mediaContainer: {
    marginBottom: 20,
  },
  mediaPreview: {
    gap: 8,
  },
  mediaItem: {
    flex: 1,
    aspectRatio: 16/9,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  removeMedia: {
    position: 'absolute',
    padding: 4,
    paddingHorizontal: 8,
    bottom: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  removeText: {
    fontSize: 14,
    color: '#F20D33',
    fontWeight: 600,
  },
  // Action container
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 