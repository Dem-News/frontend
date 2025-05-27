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
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { verifyNews, flagNews, addComment } from '../../store/slices/newsSlice';
import { newsAPI } from '../../services/api';
import { Heart, ChatCircle, Check, Flag, ArrowLeft, DotsThreeVertical, ShareFat } from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const FLAG_REASONS = [
  'inappropriate',
  'false_information',
  'spam',
  'hate_speech',
  'violence',
  'other'
];

const FLAG_REASON_DISPLAY = {
  inappropriate: 'Inappropriate Content',
  false_information: 'False Information',
  spam: 'Spam',
  hate_speech: 'Hate Speech',
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

  const verifyResponse = news.verifications.length;
  const flagResponse = news.flags.length;

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
        <View style={styles.contentContainer}>
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

          <View style={styles.insightsContainer}>
            <View style={styles.insightItem}>
              <Heart size={24}/>
              <Text style={styles.insightItemLabel}>{news.likes && news.likes.length > 0 ? likes.length : '0'} likes</Text>
            </View>
            <View style={styles.insightItem}>
              <ChatCircle size={24}/>
              <Text style={styles.insightItemLabel}>{comments && comments.length > 0 ? comments.length : '0'} comments</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.viewText}>24</Text>
              <Text style={styles.insightItemLabel}>views</Text>
            </View>
          </View>

          <View style={styles.divider}></View>

          <View style={styles.verificationContainer}>
            <View style={styles.verificationHeader}>
              <View style={styles.verificationHeaderContent}>
                <Text style={styles.verificationTitle}>Verification</Text>
                <Text style={styles.verificationDescription}>News authenticity details.</Text>
              </View>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.actionButton]}
                  onPress={handleVerify}
                  disabled={loading}
                >
                  <Check size={20} color='#34C759' />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryButton, styles.actionButton]}
                  onPress={handleFlag}
                  disabled={loading}
                >
                  <Flag size={20} color='#F20D33' />
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
          </View>

          <View style={styles.divider}></View>

          <View style={styles.authorContainer}>
            <Text style={styles.author}>{news.author.username}</Text>
            <Text style={styles.time}>
              {formatDistanceToNow(new Date(news.createdAt), { addSuffix: true })}
            </Text>
          </View>

          <View style={styles.divider}></View>

          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>Comments</Text>
            
            {loadingComments ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <View key={comment._id} style={styles.commentContainer}>
                  <View style={styles.commentHeader}>
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
          <Ionicons name="send" size={24} color={commentText.trim() ? '#007AFF' : '#ccc'} />
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
              <Text style={styles.modalTitle}>Flag News</Text>
              <TouchableOpacity
                onPress={() => setShowFlagModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.flagSection}>
              <Text style={styles.flagLabel}>Select a reason</Text>
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
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleFlagSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Submitting...' : 'Submit Flag'}
              </Text>
            </TouchableOpacity>
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'column',
    gap: 16,
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
  // Author
  authorContainer: {
    flex: 1,
    gap: 4,
  },
  author: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  time: {
    fontSize: 14,
    color: '#00000070',
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
  },
  // Verification
  verificationContainer: {
    gap: 12,
  },
  verificationHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  verificationHeaderContent: {
    flex: 1,
    gap: 8,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sliderRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  // Comments
  commentsSection: {
    padding: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  commentContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  noComments: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  commentButton: {
    padding: 8,
  },
  commentButtonDisabled: {
    opacity: 0.5,
  },
  // Modal
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
  flagSection: {
    marginBottom: 20,
  },
  flagLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  reasonButtonActive: {
    backgroundColor: '#FF5252',
  },
  reasonText: {
    fontSize: 14,
    color: '#666',
  },
  reasonTextActive: {
    color: '#fff',
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
  submitButton: {
    backgroundColor: '#FF5252',
    padding: 15,
    borderRadius: 8,
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
}); 