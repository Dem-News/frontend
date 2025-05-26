import React, { useEffect, useState } from "react";
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
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import {
  fetchNewsStart,
  fetchNewsSuccess,
  fetchNewsFailure,
  setCurrentNews,
  verifyNews,
  flagNews,
  setFilters,
} from "../../store/slices/newsSlice";
import {
  setLocationStart,
  setLocationSuccess,
  setLocationFailure,
  setPermissionStatus,
} from "../../store/slices/locationSlice";
import { newsAPI } from "../../services/api";
import NewsCard from "../../components/NewsCard";
import { List } from "phosphor-react-native";

const CATEGORIES = ["politics", "sports", "local", "emergency", "other"];

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const {
    news,
    loading,
    error: newsError,
    filters,
  } = useSelector((state) => state.news);
  const {
    currentLocation,
    error: locationError,
    permissionStatus,
    loading: locationLoading,
  } = useSelector((state) => state.location);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      fetchNews();
    }
  }, [currentLocation, filters]);

  const requestLocationPermission = async () => {
    try {
      dispatch(setLocationStart());
      const { status } = await Location.requestForegroundPermissionsAsync();
      dispatch(setPermissionStatus(status));

      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        dispatch(
          setLocationSuccess({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }),
        );
      } else {
        dispatch(setLocationFailure("Location permission denied"));
      }
    } catch (error) {
      dispatch(setLocationFailure(error.message));
    }
  };

  const fetchNews = async () => {
    try {
      dispatch(fetchNewsStart());
      const response = await newsAPI.getNewsByLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radius: filters.radius,
        category: filters.category,
        verified: filters.verified,
        query: searchQuery,
      });
      dispatch(fetchNewsSuccess(response.data));
    } catch (error) {
      dispatch(fetchNewsFailure(error.message));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
  };

  const handleNewsPress = (newsItem) => {
    dispatch(setCurrentNews(newsItem));
    navigation.navigate("NewsDetail", { newsId: newsItem._id });
  };

  const handleVerify = async (newsId) => {
    try {
      const response = await newsAPI.verifyNews(newsId);
      dispatch(verifyNews(response.data));
    } catch (error) {
      console.error("Verification failed:", error);
    }
  };

  const handleFlag = async (newsId, reason) => {
    try {
      const response = await newsAPI.flagNews(newsId, reason);
      dispatch(flagNews(response.data));
    } catch (error) {
      console.error("Flagging failed:", error);
    }
  };

  const handleSearch = () => {
    fetchNews();
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  // --- UI Rendering based on loading and permission states ---
  // Priority:
  // 1. Location loading: If location is being fetched, show specific loader.
  // 2. Location permission denied: If permission was denied and no location is set, show message.
  // 3. General news loading: If other conditions aren't met and news is loading, show general loader.

  if (locationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Fetching location...</Text>
      </View>
    );
  }

  if (permissionStatus === "denied" && !currentLocation) {
    return (
      <View style={styles.permissionDeniedContainer}>
        <Text style={styles.permissionDeniedText}>
          Location permission is required to fetch local news. Please enable it
          in your device settings.
        </Text>
        <TouchableOpacity
          onPress={requestLocationPermission}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>Retry Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !refreshing && !newsError && !locationError) {
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
          <Text style={styles.tabBarItemActive}>Local</Text>
          <Text style={styles.tabBarItem}> Explore</Text>
        </View>
        <View style={styles.viewSwitch}>
          <View style={styles.switchItemContainerActive}>
            <List size={20} />
          </View>
          <View style={styles.switchItemContainer}>
            <Text style={styles.viewLabel}>Map</Text>
          </View>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search news..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {newsError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to fetch news: {newsError.message || newsError}
          </Text>
        </View>
      )}

      <FlatList
        data={news.news}
        renderItem={({ item }) => (
          <NewsCard
            news={item}
            onPress={() => handleNewsPress(item)}
            onVerify={() => handleVerify(item._id)}
            onFlag={(reason) => handleFlag(item._id, reason)}
          />
        )}
        keyExtractor={(item, index) => item._id || index.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No news found in your area</Text>
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
                      filters.category === category &&
                        styles.categoryButtonActive,
                    ]}
                    onPress={() => handleFilterChange("category", category)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        filters.category === category &&
                          styles.categoryTextActive,
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
                onPress={() =>
                  handleFilterChange("verified", !filters.verified)
                }
              >
                <Text
                  style={[
                    styles.verifiedButtonText,
                    filters.verified && styles.verifiedButtonTextActive,
                  ]}
                >
                  {filters.verified ? "Yes" : "No"}
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
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Page header
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#00000010",
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tabBarItem: {
    fontSize: 20,
    color: "#00000050",
    fontWeight: "500",
  },
  tabBarItemActive: {
    fontSize: 24,
    color: "#000000",
    fontWeight: "800",
  },
  viewSwitch: {
    flexDirection: "row",
    backgroundColor: "#EDEDED",
    borderRadius: 16,
    alignItems: "center",
    padding: 4,
  },
  switchItemContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  switchItemContainerActive: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  viewLabel: {
    fontSize: 14,
    color: "#00000070",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  filterButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 8,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: "#007AFF",
  },
  categoryText: {
    fontSize: 14,
    color: "#666",
  },
  categoryTextActive: {
    color: "#fff",
  },
  verifiedButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignSelf: "flex-start",
  },
  verifiedButtonActive: {
    backgroundColor: "#007AFF",
  },
  verifiedButtonText: {
    fontSize: 16,
    color: "#666",
  },
  verifiedButtonTextActive: {
    color: "#fff",
  },
  applyButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  errorContainer: {
    padding: 10,
    backgroundColor: "#FFD2D2", // Light red background
    alignItems: "center",
    marginHorizontal: 16, // Match FlatList or page padding
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    color: "#D8000C", // Dark red text
    fontSize: 14,
  },
  permissionDeniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  permissionDeniedText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
