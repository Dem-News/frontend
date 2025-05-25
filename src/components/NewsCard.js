import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Heart, ChatCircle } from 'phosphor-react-native';


export default function NewsCard({ news, onPress, onVerify, onFlag }) {
  const {
    title,
    content,
    author,
    createdAt,
    isVerified,
    verificationCount,
    flagCount,
    category,
    likes= null,
    comments,
  } = news;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.newsContentContainer}>
        <Text style={styles.newsContent} numberOfLines={4}>
          {content}
        </Text>
      </View>
      <View style={styles.insights}>
        <View style={styles.insightItem}>
          <Heart size={18}/>
          <Text style={styles.insightItemLabel}>{likes && likes.length > 0 ? likes.length : '0'} likes</Text>
        </View>
        <View style={styles.insightItem}>
          <ChatCircle size={18}/>
          <Text style={styles.insightItemLabel}>{comments && comments.length > 0 ? comments.length : '0'} comments</Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.viewText}>24</Text>
          <Text style={styles.insightItemLabel}>views</Text>
        </View>
      </View>
      <View style={styles.postDetails}>
        <View style={styles.authorContainer}>
          <Text style={styles.authorLabel}>by</Text>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{author.username}</Text>
          </View>
        </View>
        <Text style={styles.postCreatedTime}>
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </Text>
      </View>
      <View style={styles.newsVerificationBarContainer}>
        <View style={styles.newsVerificationBar}>
        </View>
        <Text style={styles.verificationCount}>{verificationCount? verificationCount: '0'}</Text>
      </View>
      <View style={styles.divider}></View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    // borderWidth: 1,
    // borderColor: 'red'
  },
  // News content
  newsContentContainer: {
    gap: 8,
  },
  newsContent: {
    fontSize: 20,
    color: '#000000',
    fontWeight: '700',
  },
  // News insights
  insights: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  insightItem: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  insightItemLabel: {
    fontSize: 12,
    color: '#00000070',
  },
  viewText: {
    fontSize: 14,
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
    fontSize: 12,
    color: '#00000070',
  },
  authorDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#000000',
  },
  postCreatedTime: {
    fontSize: 12,
    color: '#00000070',
  },
  // News verification
  newsVerificationBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newsVerificationBar: {
    flex: 1,
    height: 16,
    backgroundColor: '#34C759',
    borderRadius: 8,
  },
  verificationCount: {
    fontSize: 12,
    color: '#0000007o',
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: '#00000010',
    marginTop: 8,
  },
}); 