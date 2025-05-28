import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { Heart, ChatCircle } from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { newsAPI } from '../services/api';

export default function NewsCard({ news, onPress, onLike }) {
  const { user } = useSelector((state) => state.auth);
  const {
    content,
    author,
    createdAt,
    verifications,
    flags,
    likes,
    comments,
  } = news;

  const verifyResponse = verifications.length;
  const flagResponse = flags.length;

  const totalLikes = likes.length;
  const totalComments = comments.length;

  const totalResponse = verifyResponse + flagResponse;

  let verifyPercent = 50;
  let flagPercent = 50;

  if (totalResponse > 0) {
    verifyPercent = (verifyResponse / totalResponse) * 100;
    flagPercent = (flagResponse / totalResponse) * 100;
  }

  const isLiked = likes.includes(user?._id);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (onLike) {
      onLike(news._id);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.newsContentContainer}>
        <Text style={styles.newsContent} numberOfLines={4}>
          {content}
        </Text>
      </View>
      <View style={styles.insights}>
        <TouchableOpacity style={styles.insightItem} onPress={handleLike}>
          <Heart size={18} weight={isLiked ? "fill" : "regular"} color={isLiked ? "#F20D33" : "#00000070"}/>
          <Text style={[styles.insightItemLabel, isLiked && styles.likedText]}>
            {totalLikes > 0 ? `${totalLikes} like${totalLikes > 1 ? 's' : ''}` : '0 likes'}
          </Text>
        </TouchableOpacity>
        <View style={styles.insightItem}>
          <ChatCircle size={18}/>
          <Text style={styles.insightItemLabel}>
            {totalComments > 0 ? `${totalComments} comment${totalComments > 1 ? 's' : ''}` : '0 comments'}
          </Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.viewText}>24</Text>
          <Text style={styles.insightItemLabel}>views</Text>
        </View>
      </View>
      <View style={styles.verificationContainer}>
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
      <View style={styles.divider}></View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    gap: 12,
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
  likedText: {
    color: '#F20D33',
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
    fontWeight: 700,
    color: '#000000',
  },
  postCreatedTime: {
    fontSize: 12,
    color: '#00000070',
  },
  // Verification
  verificationContainer: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sliderLeft: {
    flexDirection: 'row',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sliderRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 8,
  },
  responseNumber: {
    fontSize: 16,
    fontWeight: 700,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: '#00000007',
    marginTop: 8,
  },
}); 