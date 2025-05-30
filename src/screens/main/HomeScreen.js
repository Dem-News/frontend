import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import {
  fetchNewsStart,
  fetchNewsSuccess,
  fetchNewsFailure,
  setCurrentNews,
  verifyNews,
  flagNews,
  setFilters,
} from '../../store/slices/newsSlice';
import {
  setLocationStart,
  setLocationSuccess,
  setLocationFailure,
  setPermissionStatus,
} from '../../store/slices/locationSlice';
import { newsAPI } from '../../services/api';
import NewsCard from '../../components/NewsCard';
import { List } from 'phosphor-react-native';

const CATEGORIES = [
  'politics',
  'sports',
  'local',
  'emergency',
  'other',
];

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { news, loading, filters } = useSelector((state) => state.news);
  const { currentLocation } = useSelector((state) => state.location);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewType, setViewType] = useState('local');
  const [localNews, setLocalNews] = useState([]);
  const [exploreNews, setExploreNews] = useState([]);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [hasFetchedLocal, setHasFetchedLocal] = useState(false);
  const [hasFetchedExplore, setHasFetchedExplore] = useState(false);

  useEffect(() => {
    checkLocationServices();
    if (viewType === 'local') {
      requestLocationPermission();
    }
  }, []);

  useEffect(() => {
    if (viewType === 'local' && isLocationEnabled && currentLocation && !hasFetchedLocal) {
      fetchLocalNews();
      setHasFetchedLocal(true);
    } 
  }, [viewType, isLocationEnabled, currentLocation]);

  const checkLocationServices = async () => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      setIsLocationEnabled(enabled);
      if (!enabled && viewType === 'local') {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services to view local news.',
          [
            {
              text: 'Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
            {
              text: 'Switch to Explore',
              onPress: () => {
                setViewType('explore');
                fetchExploreNews();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking location services:', error);
      setIsLocationEnabled(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      dispatch(setLocationStart());
      const { status } = await Location.requestForegroundPermissionsAsync();
      dispatch(setPermissionStatus(status));

      if (status === 'granted') {
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          setIsLocationEnabled(false);
          Alert.alert(
            'Location Services Disabled',
            'Please enable location services to view local news.',
            [
              {
                text: 'Settings',
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                },
              },
              {
                text: 'Switch to Explore',
                onPress: () => {
                  setViewType('explore');
                  fetchExploreNews();
                },
              },
            ]
          );
          return;
        }

        setIsLocationEnabled(true);
        const location = await Location.getCurrentPositionAsync({});
        dispatch(setLocationSuccess({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));
        // Fetch local news after getting location
        fetchLocalNews();
      } else {
        setIsLocationEnabled(false);
        Alert.alert(
          'Location Required',
          'Please enable location services to view local news.',
          [
            {
              text: 'Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
            {
              text: 'Switch to Explore',
              onPress: () => {
                setViewType('explore');
                fetchExploreNews();
              },
            },
          ]
        );
        dispatch(setLocationFailure('Location permission denied'));
      }
    } catch (error) {
      console.error('Location error:', error);
      setIsLocationEnabled(false);
      Alert.alert(
        'Location Error',
        'Failed to get your location. Please check your location settings.',
        [
          {
            text: 'Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
          {
            text: 'Switch to Explore',
            onPress: () => {
              setViewType('explore');
              fetchExploreNews();
            },
          },
        ]
      );
      dispatch(setLocationFailure(error.message));
    }
  };

  const fetchLocalNews = async () => {
    if (!isLocationEnabled || !currentLocation) {
      setLocalNews([]);
      return;
    }

    try {
      dispatch(fetchNewsStart());
      const response = await newsAPI.getNewsByLocation({
        scope: 'local',
        location: `${currentLocation.longitude},${currentLocation.latitude}`,
        category: filters.category,
        verified: filters.verified,
        query: searchQuery,
      });
      
      if (response.data) {
        setLocalNews(response.data.news);
        dispatch(fetchNewsSuccess(response.data));
      } else {
        dispatch(fetchNewsFailure('No data received from server'));
      }
    } catch (error) {
      console.error('API Error:', error.response?.data);
      dispatch(fetchNewsFailure(error.message));
    }
  };

  const fetchExploreNews = async () => {
    try {
      dispatch(fetchNewsStart());
      const response = await newsAPI.getNewsByLocation({
        scope: 'explore',
        category: filters.category,
        verified: filters.verified,
        query: searchQuery,
      });
      
      if (response.data) {
        setExploreNews(response.data.news);
        dispatch(fetchNewsSuccess(response.data));
      } else {
        dispatch(fetchNewsFailure('No data received from server'));
      }
    } catch (error) {
      console.error('API Error:', error.response?.data);
      dispatch(fetchNewsFailure(error.message));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (viewType === 'local') {
      await checkLocationServices();
      if (isLocationEnabled) {
        await requestLocationPermission();
      }
    } else {
      await fetchExploreNews();
    }
    setRefreshing(false);
  };

  const handleNewsPress = (newsItem) => {
    dispatch(setCurrentNews(newsItem));
    navigation.navigate('NewsDetail', { newsId: newsItem._id });
  };

  const handleVerify = async (newsId) => {
    try {
      const response = await newsAPI.verifyNews(newsId);
      dispatch(verifyNews(response.data));
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  const handleFlag = async (newsId, reason) => {
    try {
      const response = await newsAPI.flagNews(newsId, reason);
      dispatch(flagNews(response.data));
    } catch (error) {
      console.error('Flagging failed:', error);
    }
  };

  const handleLike = async (newsId) => {
    try {
      const response = await newsAPI.likeNews(newsId);
      // Update the news in the appropriate list while preserving author info
      if (viewType === 'local') {
        setLocalNews(prevNews => 
          prevNews.map(news => 
            news._id === newsId ? { ...news, ...response.data } : news
          )
        );
      } else {
        setExploreNews(prevNews => 
          prevNews.map(news => 
            news._id === newsId ? { ...news, ...response.data } : news
          )
        );
      }
    } catch (error) {
      console.error('Failed to like news:', error);
      // If it's a version mismatch error, refresh the news data
      if (error.response?.status === 400 && error.response?.data?.error?.includes('version')) {
        // Refresh the news data to get the latest version
        const updatedNews = await newsAPI.getNewsByLocation({ 
          scope: viewType,
          newsId 
        });
        // Update the appropriate list with fresh data while preserving author info
        if (viewType === 'local') {
          setLocalNews(prevNews => 
            prevNews.map(news => 
              news._id === newsId ? { ...news, ...updatedNews.data } : news
            )
          );
        } else {
          setExploreNews(prevNews => 
            prevNews.map(news => 
              news._id === newsId ? { ...news, ...updatedNews.data } : news
            )
          );
        }
        // Try liking again
        const retryResponse = await newsAPI.likeNews(newsId);
        if (viewType === 'local') {
          setLocalNews(prevNews => 
            prevNews.map(news => 
              news._id === newsId ? { ...news, ...retryResponse.data } : news
            )
          );
        } else {
          setExploreNews(prevNews => 
            prevNews.map(news => 
              news._id === newsId ? { ...news, ...retryResponse.data } : news
            )
          );
        }
      } else {
        Alert.alert('Error', 'Failed to like the news. Please try again.');
      }
    }
  };

  const handleSearch = () => {
    if (viewType === 'local') {
      fetchLocalNews();
    } else {
      fetchExploreNews();
    }
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={styles.tabBarItem}
            onPress={() => {
              setViewType('local');
              if (isLocationEnabled && !hasFetchedLocal) {
                fetchLocalNews();
                setHasFetchedLocal(true);
              }
            }}
          >
            <Text style={[
              styles.tabBarItemText,
              viewType === 'local' && styles.tabBarItemActive
            ]}>Local</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tabBarItem}
            onPress={() => {
              setViewType('explore');
              if (!hasFetchedExplore) {
                fetchExploreNews();
                setHasFetchedExplore(true);
              }
            }}
          >
            <Text style={[
              styles.tabBarItemText,
              viewType === 'explore' && styles.tabBarItemActive
            ]}>Explore</Text>
          </TouchableOpacity>
        </View>
        {/* <View style={styles.viewSwitch}>
          <View style={styles.switchItemContainerActive}>
            <List size={20} />
          </View>
          <View style={styles.switchItemContainer}>
            <Text style={styles.viewLabel}>Map</Text>
          </View>
        </View> */}
      </View>

      <FlatList
        data={viewType === 'local' ? localNews : exploreNews}
        renderItem={({ item }) => (
          <NewsCard
            news={item}
            onPress={() => handleNewsPress(item)}
            onVerify={() => handleVerify(item._id)}
            onFlag={(reason) => handleFlag(item._id, reason)}
            onLike={handleLike}
          />
        )}
        keyExtractor={(item, index) => item._id || index.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {viewType === 'local' 
                ? isLocationEnabled 
                  ? 'No news found in your area'
                  : 'Please enable location services to view local news'
                : 'No news available to explore'}
            </Text>
          </View>
        }
      />

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category</Text>
              <View style={styles.categories}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      filters.category === category && styles.categoryButtonActive,
                    ]}
                    onPress={() => handleFilterChange('category', category)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        filters.category === category && styles.categoryTextActive,
                      ]}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Show Only Verified</Text>
              <TouchableOpacity
                style={[
                  styles.verifiedButton,
                  filters.verified && styles.verifiedButtonActive,
                ]}
                onPress={() => handleFilterChange('verified', !filters.verified)}
              >
                <Text
                  style={[
                    styles.verifiedButtonText,
                    filters.verified && styles.verifiedButtonTextActive,
                  ]}
                >
                  {filters.verified ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Page header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: "#00000007",
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  tabBarItemText: {
    fontSize: 20,
    color: '#00000050',
    fontWeight: '500',
  },
  tabBarItemActive: {
    fontSize: 24,
    color: '#000000',
    fontWeight: '800',
  },
  viewSwitch: {
    flexDirection: 'row',
    backgroundColor: '#EDEDED',
    borderRadius: 16,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  switchItemContainer: {
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12,
  },  
  switchItemContainerActive: {
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    backgroundColor: '#fff',
    borderRadius: 12,
  },  
  viewLabel: {
    fontSize: 14,
    color: '#00000070',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  filterButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },
  verifiedButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },
  verifiedButtonActive: {
    backgroundColor: '#007AFF',
  },
  verifiedButtonText: {
    fontSize: 16,
    color: '#666',
  },
  verifiedButtonTextActive: {
    color: '#fff',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  enableLocationButton: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  enableLocationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 