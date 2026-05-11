import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  CardContent,
} from '../../components/ui';
import { Colors } from '../../constants/colors';
import type { Review } from '../../types';

// Placeholder data - would come from API
const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    rating: 5,
    text: 'Excellent service! Made the entire process smooth and stress-free.',
    source: 'internal',
    status: 'approved',
    customer_name: 'John Smith',
    customer_email: 'john@example.com',
    user_id: '1',
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-01-10T10:00:00Z',
  },
  {
    id: '2',
    rating: 4,
    text: 'Great experience overall. Very professional and helpful throughout.',
    source: 'google',
    status: 'approved',
    customer_name: 'Sarah Johnson',
    customer_email: null,
    user_id: '1',
    created_at: '2026-01-08T14:30:00Z',
    updated_at: '2026-01-08T14:30:00Z',
  },
  {
    id: '3',
    rating: 5,
    text: 'Highly recommend! Best professional I have worked with.',
    source: 'internal',
    status: 'pending',
    customer_name: 'Mike Davis',
    customer_email: 'mike@example.com',
    user_id: '1',
    created_at: '2026-01-05T09:15:00Z',
    updated_at: '2026-01-05T09:15:00Z',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map(star => (
        <Text
          key={star}
          style={[
            styles.star,
            { color: star <= rating ? '#f59e0b' : '#e2e8f0' },
          ]}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const colors = Colors.light;
  const formattedDate = new Date(review.created_at).toLocaleDateString();

  return (
    <Card style={styles.reviewCard}>
      <CardContent>
        <View style={styles.reviewHeader}>
          <View>
            <Text variant="h4">{review.customer_name}</Text>
            <Text variant="small" color="muted">
              {formattedDate} • {review.source}
            </Text>
          </View>
          <StarRating rating={review.rating} />
        </View>
        <Text variant="body" style={styles.reviewText}>
          {review.text}
        </Text>
        {review.status === 'pending' && (
          <View style={[styles.badge, { backgroundColor: colors.warning + '20' }]}>
            <Text variant="small" style={{ color: colors.warning }}>
              Pending Approval
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

export function ReviewsScreen() {
  const colors = Colors.light;
  const [refreshing, setRefreshing] = useState(false);
  const [reviews] = useState<Review[]>(MOCK_REVIEWS);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderReview = useCallback(
    ({ item }: { item: Review }) => <ReviewCard review={item} />,
    []
  );

  const ListHeader = useCallback(
    () => (
      <View style={styles.header}>
        <Text variant="h2">Reviews</Text>
        <Text variant="muted">{reviews.length} total reviews</Text>
      </View>
    ),
    [reviews.length]
  );

  const ListEmpty = useCallback(
    () => (
      <Card style={styles.emptyCard}>
        <CardContent style={styles.emptyContent}>
          <Text variant="h4">No reviews yet</Text>
          <Text variant="muted" style={styles.emptyText}>
            Your reviews will appear here once customers submit them.
          </Text>
        </CardContent>
      </Card>
    ),
    []
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  reviewCard: {
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  starContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 16,
    marginLeft: 2,
  },
  reviewText: {
    marginTop: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 12,
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
  },
});
