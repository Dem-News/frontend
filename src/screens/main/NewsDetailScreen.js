import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { verifyNews, flagNews, addComment, setCurrentNews } from '../../store/slices/newsSlice';
import { newsAPI } from '../../services/api';
import { Heart, ChatCircle, Check, Flag, ArrowLeft, DotsThreeVertical, ShareFat, ArrowRight, MapPinSimple, X } from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';

const FLAG_REASONS = [
  'inappropriate',
  'false_information',
  'spam',
  'hate_speech',
  'violence',
  'other'
];

const FLAG_REASON_DISPLAY = {
  inappropriate: 'Inappropriate content',
  false_information: 'False information',
  spam: 'Spam',
  hate_speech: 'Hate speech',
  violence: 'Violence',
  other: 'Other'
};

export default function NewsDetailScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const { newsId } = route.params;
  const { user } = useSelector((state) => state.auth);
  const { currentLocation } = useSelector((state) => state.location);
  const news = useSelector((state) => 
    state.news.news.news?.find(n => n._id === newsId)
  );
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [localNews, setLocalNews] = useState(null);

  const verifyResponse = news?.verifications?.length || 0;
  const flagResponse = news?.flags?.length || 0;

  const totalResponse = verifyResponse + flagResponse;
  
  let verifyPercent = 50;
  let flagPercent = 50;

  if (totalResponse > 0) {
    verifyPercent = (verifyResponse / totalResponse) * 100;
    flagPercent = (flagResponse / totalResponse) * 100;
  }

  useEffect(() => {
    fetchComments();
  }, [newsId]);

  useEffect(() => {
    if (news) {
      setLocalNews(news);
    }
  }, [news]);

  const handleBack = () => {
    navigation.goBack();
  };
  
  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const response = await newsAPI.getComments(newsId);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };
  
  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    try {
      setLoading(true);
      const response = await newsAPI.addComment(newsId, commentText);
      dispatch(addComment({ newsId, comment: response.data }));
      setCommentText('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  if (!news) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const handleVerify = async () => {
    Alert.alert(
      'Verify News',
      'Are you sure you want to verify this news? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Verify',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await newsAPI.verifyNews(news._id, {
                coordinates: {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude
                }
              });
              dispatch(verifyNews(response.data));
              Alert.alert('Success', 'News verified successfully');
            } catch (error) {
              if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.error || 'Something went wrong';
            
                if (status === 400 && message === 'You have already verified this news') {
                  alert('You already verified this news.');
                } else {
                  alert(`${message}`);
                }
              } else {
                alert('Network or server error.');
              }
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleFlag = () => {
    setShowFlagModal(true);
  };

  const handleFlagSubmit = async () => {
    const reason = flagReason === 'Other' ? customReason : flagReason;
    if (!reason) {
      Alert.alert('Error', 'Please provide a reason');
      return;
    }
    try {
      setLoading(true);
      const response = await newsAPI.flagNews(news._id, reason);
      dispatch(flagNews(response.data));
      Alert.alert('Success', 'News flagged successfully');
      setShowFlagModal(false);
      setFlagReason('');
      setCustomReason('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to flag news');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      setLoading(true);
      const response = await newsAPI.likeNews(newsId);
      const updatedNews = { ...news, ...response.data };
      dispatch(setCurrentNews(updatedNews));
      setLocalNews(updatedNews);
    } catch (error) {
      console.error('Failed to like news:', error);
      if (error.response?.status === 400 && error.response?.data?.error?.includes('version')) {
        try {
          // Refresh the news data to get the latest version
          const updatedNews = await newsAPI.getNewsByLocation({ newsId });
          const refreshedNews = { ...news, ...updatedNews.data };
          dispatch(setCurrentNews(refreshedNews));
          setLocalNews(refreshedNews);
          // Try liking again
          const retryResponse = await newsAPI.likeNews(newsId);
          const retryUpdatedNews = { ...news, ...retryResponse.data };
          dispatch(setCurrentNews(retryUpdatedNews));
          setLocalNews(retryUpdatedNews);
        } catch (retryError) {
          Alert.alert('Error', 'Failed to like the news. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Failed to like the news. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!localNews) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.pageHeader}>
        <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBack}
            disabled={loading}
          >
            <ArrowLeft size={20} />
        </TouchableOpacity>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleVerify}
              disabled={loading}
            >
              <DotsThreeVertical size={20} />
          </TouchableOpacity>
          <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleVerify}
              disabled={loading}
            >
              <ShareFat size={20} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView>
        <View style={styles.mainContainer}>
          <View style={styles.contentSection}>
            {news.media && news.media.length > 0 && (
              <ScrollView horizontal style={styles.mediaContainer}>
                {news.media.map((media, index) => (
                  <Image
                    key={index}
                    source={{ uri: media.url }}
                    style={styles.media}
                  />
                ))}
              </ScrollView>
            )}

            <Text style={styles.content}>{news.content}</Text>

            <View style={styles.postDetails}>
              <View style={styles.authorContainer}>
                <Text style={styles.authorLabel}>by</Text>
                <View style={styles.authorDetails}>
                  <Text style={styles.authorName}>{news.author.username}</Text>
                </View>
              </View>
              <Text style={styles.postCreatedTime}>
                {formatDistanceToNow(new Date(news.createdAt), { addSuffix: true })}
              </Text>
            </View>

            <View style={styles.insightsContainer}>
              <TouchableOpacity style={styles.insightItem} onPress={handleLike}>
                <Heart 
                  size={24} 
                  weight={localNews.likes?.includes(user?._id) ? "fill" : "regular"}
                  color={localNews.likes?.includes(user?._id) ? "#F20D33" : "#00000070"}
                />
                <Text style={[
                  styles.insightItemLabel,
                  localNews.likes?.includes(user?._id) && styles.likedText
                ]}>
                  {localNews.likes?.length || 0} likes
                </Text>
              </TouchableOpacity>
              <View style={styles.insightItem}>
                <ChatCircle size={24}/>
                <Text style={styles.insightItemLabel}>
                  {comments?.length || 0} comments
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.viewText}>24</Text>
                <Text style={styles.insightItemLabel}>views</Text>
              </View>
            </View>
          </View>

          {/* <View style={styles.divider}></View> */}

          <View style={styles.verificationSection}>
            <View style={styles.verificationHeader}>
              <View style={styles.verificationHeaderContent}>
                <Text style={styles.verificationTitle}>Verification</Text>
                <Text style={styles.verificationDescription}>Verification overview</Text>
              </View>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.secondaryButton, styles.actionButton]}
                    onPress={handleFlag}
                    disabled={loading}
                >
                  <Flag size={20} color='#F20D33' />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.actionButton]}
                  onPress={handleVerify}
                  disabled={loading}
                >
                  <Check size={20} color='#34C759' />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.verificationMetricsContainer}>
              <View style={styles.sliderContainer}>
                <LinearGradient
                  colors={['#34C759', '#fff']}
                  style={[styles.sliderLeft, { width: `${verifyPercent}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.responseNumber}>{verifyResponse}</Text>
                  <View style={styles.avatars}></View>
                </LinearGradient>
                <LinearGradient
                  colors={['#fff', '#F20D33']}
                  style={[styles.sliderRight, { width: `${flagPercent}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.responseNumber}>{flagResponse}</Text>
                  <View style={styles.avatars}></View>
                </LinearGradient>
              </View>
              <Text style={styles.verificationSupportText}><Text style={styles.verificationSupportNumber}>{totalResponse}</Text> users responsed on news within 2 km radius.</Text>
            </View>
            <View style={styles.verificationMap}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: news.location?.coordinates?.[1] || 27.66439986940669,
                  longitude: news.location?.coordinates?.[0] || 85.41390653086319,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
              >
                {/* News location marker */}
                <Marker
                  coordinate={{
                    latitude: news.location?.coordinates?.[1] || 27.66439986940669,
                    longitude: news.location?.coordinates?.[0] || 85.41390653086319,
                  }}
                  title="News Location"
                  description={news.content.substring(0, 100) + '...'}
                >
                  <View style={styles.marker}>
                    <MapPinSimple size={24} color='#fff' />
                  </View>
                </Marker>
                {/* Radius circle */}
                <Circle
                  center={{
                    latitude: news.location?.coordinates?.[1] || 27.66439986940669,
                    longitude: news.location?.coordinates?.[0] || 85.41390653086319,
                  }}
                  radius={1000}
                  strokeColor="#007AFF"
                  fillColor="#007AFF10"
                />

                {/* Verification markers */}
                {news.verifications && news.verifications.map((verification, index) => (
                  <Marker
                    key={`verify-${index}`}
                    coordinate={{
                      latitude: verification.location.coordinates[1],
                      longitude: verification.location.coordinates[0],
                    }}
                    title="Verified"
                  >
                    <View style={styles.verifyMarker}>
                      <Check size={12} color="#fff" />
                    </View>
                  </Marker>
                ))}

                {/* Flag markers - using verification location as flag location since it's not in the data */}
                {news.flags && news.flags.map((flag, index) => (
                  <Marker
                    key={`flag-${index}`}
                    coordinate={{
                      latitude: (news.location?.coordinates?.[1] || 27.66439986940669) - 0.005,
                      longitude: (news.location?.coordinates?.[0] || 85.41390653086319) - 0.005,
                    }}
                    title={`Flagged: ${flag.reason}`}
                  >
                    <View style={styles.flagMarker}>
                      <Flag size={12} color="#fff" />
                    </View>
                  </Marker>
                ))}
              </MapView>
            </View>
          </View>

          {/* <View style={styles.divider}></View> */}

          <View style={styles.commentSection}>
            <View style={styles.commentsSectionHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
            </View>
            <View style={styles.commentContainer}>
              {loadingComments ? (
                <ActivityIndicator size="small" color="#00000070" />
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <View key={comment._id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      {/* <View style={styles.avatars}></View> */}
                      <Text style={styles.commentAuthor}>{comment.author.username}</Text>
                      <Text style={styles.commentTime}>
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </Text>
                    </View>
                    <Text style={styles.commentText}>{comment.content}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noComments}>No comments yet</Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.commentButton, !commentText.trim() && styles.commentButtonDisabled]}
          onPress={handleAddComment}
          disabled={loading || !commentText.trim()}
        >
          <ArrowRight size={20} color='#fff' />
        </TouchableOpacity>
      </View>
      <Modal
        visible={showFlagModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFlagModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Flag news</Text>
              <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setShowFlagModal(false)}
                  disabled={loading}
                >
                  <X size={16} />
              </TouchableOpacity>
            </View>
            <View style={styles.reasonsContainer}>
              {FLAG_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonButton,
                    flagReason === reason && styles.reasonButtonActive,
                  ]}
                  onPress={() => setFlagReason(reason)}
                >
                  <Text
                    style={[
                      styles.reasonText,
                      flagReason === reason && styles.reasonTextActive,
                    ]}
                  >
                    {FLAG_REASON_DISPLAY[reason]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {flagReason === 'Other' && (
              <TextInput
                style={styles.customReasonInput}
                placeholder="Please specify the reason..."
                value={customReason}
                onChangeText={setCustomReason}
                multiline
              />
            )}

            <View style={styles.submitButtonCOntainer}>
              <Text style={styles.submitButtonTextInfo}>Flagginng news will impact it's authenticity and visibility.</Text>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleFlagSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'column',
    gap: 16,
  },
  contentSection: {
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  // News content
  content: {
    fontSize: 20,
    color: '#000000',
    fontWeight: '700',
  },
  mediaContainer: {
    padding: 20,
    paddingTop: 0,
  },
  media: {
    width: 300,
    height: 200,
    borderRadius: 12,
    marginRight: 12,
  },
  // Post details
  postDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },  
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorLabel: {
    fontSize: 14,
    color: '#00000070',
  },
  authorDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#000000',
  },
  postCreatedTime: {
    fontSize: 14,
    color: '#00000070',
  },
  // News insights
  insightsContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  insightItem: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  insightItemLabel: {
    fontSize: 14,
    color: '#00000070',
  },
  viewText: {
    fontSize: 16,
  },
  // Action button
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
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
  // Verification
  verificationSection: {
    gap: 12,
    backgroundColor: '#00000005',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00000010'
  },
  verificationHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  verificationHeaderContent: {
    flex: 1,
    gap: 4,
  },
  actionButton: {
    padding: 12,
    borderRadius: 16,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: 700,
  },
  verificationDescription: {
    fontSize: 14,
    color: '#00000070',
  },
  verificationMetricsContainer: {
    gap: 4,
  },
  sliderContainer: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sliderLeft: {
    flexDirection: 'row',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    padding: 12,
  },
  sliderRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  responseNumber: {
    fontSize: 16,
    fontWeight: 700,
  },
  verificationSupportText: {
    fontWeight: 14,
    color: '#00000070',
  },
  verificationSupportNumber: {
    fontWeight: 14,
    color: '#000000',
    fontWeight: 700,
  },
  verificationMap: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  marker: {
    backgroundColor: '#FFAA00',
    padding: 2,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#fff',
  },
  map: {
    flex: 1,
    height: 200,
    width: '100%',
  },
  verifyMarker: {
    backgroundColor: '#34C759',
    padding: 4,
    borderRadius: 99,
  },
  flagMarker: {
    backgroundColor: '#F20D33',
    padding: 4,
    borderRadius: 99,
  },
  // Comments
  commentSection: {
    gap: 8,
  },
  commentContainer: {
    gap: 12,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  commentItem: {
    gap: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  commentTime: {
    fontSize: 12,
    color: '#00000070',
  },
  commentText: {
    fontSize: 16,
    color: '#000000',
  },
  noComments: {
    fontSize: 16,
    color: '#00000070',
    textAlign: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#00000007',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
  },
  commentButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  commentButtonDisabled: {
    backgroundColor: '#00000050'
  },
  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  modalContent: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
    maxHeight: '80%',
    borderWidth: 1,
    backgroundColor: '#fff',
    borderColor: '#00000010',
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    // Android Shadow
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#00000007',
    borderWidth: 1,
    borderColor: '#00000010',
  },
  reasonButtonActive: {
    borderColor: '#000',
  },
  reasonText: {
    fontSize: 14,
    color: '#00000070',
  },
  reasonTextActive: {
    color: '#000',
    fontWeight: 700,
  },
  customReasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButtonCOntainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  submitButtonTextInfo: {
    flex: 1,
    fontSize: 14,
    color: '#00000070',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: '#00000007',
  },
  mapPlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    color: '#666',
    fontSize: 14,
  },
  likedText: {
    color: '#F20D33',
  },
}); 