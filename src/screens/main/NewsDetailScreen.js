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
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { verifyNews, flagNews, addComment } from '../../store/slices/newsSlice';
import { newsAPI } from '../../services/api';

export default function NewsDetailScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const { newsId } = route.params;
  const { user } = useSelector((state) => state.auth);
  const news = useSelector((state) => 
    state.news.news.find(n => n._id === newsId)
  );
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [newsId]);

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
      setComments([...comments, response.data]);
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
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const handleVerify = async () => {
    try {
      setLoading(true);
      const response = await newsAPI.verifyNews(news._id);
      dispatch(verifyNews(response.data));
      Alert.alert('Success', 'News verified successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to verify news');
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async () => {
    Alert.prompt(
      'Flag News',
      'Please provide a reason for flagging this news:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Submit',
          onPress: async (reason) => {
            if (!reason) {
              Alert.alert('Error', 'Please provide a reason');
              return;
            }
            try {
              setLoading(true);
              const response = await newsAPI.flagNews(news._id, reason);
              dispatch(flagNews(response.data));
              Alert.alert('Success', 'News flagged successfully');
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to flag news');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.authorContainer}>
            <Text style={styles.author}>{news.author.username}</Text>
            <Text style={styles.time}>
              {formatDistanceToNow(new Date(news.createdAt), { addSuffix: true })}
            </Text>
          </View>
          {news.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{news.title}</Text>
        <Text style={styles.category}>{news.category}</Text>
        <Text style={styles.content}>{news.content}</Text>

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

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
            <Text style={styles.statText}>{news.verificationCount} verifications</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="flag-outline" size={20} color="#FF5252" />
            <Text style={styles.statText}>{news.flagCount} flags</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.verifyButton]}
            onPress={handleVerify}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Verify</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.flagButton]}
            onPress={handleFlag}
            disabled={loading}
          >
            <Ionicons name="flag-outline" size={24} color="#FF5252" />
            <Text style={styles.actionButtonText}>Flag</Text>
          </TouchableOpacity>
        </View>

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
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  authorContainer: {
    flex: 1,
  },
  author: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  time: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    padding: 20,
    paddingBottom: 10,
  },
  category: {
    fontSize: 14,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    padding: 20,
    paddingTop: 0,
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
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  verifyButton: {
    backgroundColor: '#E8F5E9',
  },
  flagButton: {
    backgroundColor: '#FFEBEE',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  commentsSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
}); 