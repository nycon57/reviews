import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Text,
  Card,
  CardContent,
  Button,
} from '../../components/ui';
import { Colors } from '../../constants/colors';
import {
  getVideoTestimonialResponses,
  formatDuration,
  getStatusDisplay,
  getUserProfile,
} from '../../lib/video-testimonials';
import type { VideoTestimonialResponse, VideoTestimonialStats } from '../../types';

type FilterTab = 'all' | 'pending' | 'approved' | 'published';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'published', label: 'Published' },
];

interface VideoCardProps {
  video: VideoTestimonialResponse;
  onPress: () => void;
  canApprove: boolean;
}

const VideoCard = React.memo(function VideoCard({ video, onPress, canApprove }: VideoCardProps) {
  const colors = Colors.light;
  const statusInfo = getStatusDisplay(video.approval_status);
  const formattedDate = new Date(video.submitted_at).toLocaleDateString();

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.videoCard}>
        <View style={styles.thumbnailContainer}>
          {video.thumbnail_url ? (
            <Image
              source={{ uri: video.thumbnail_url }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Ionicons name="videocam" size={32} color={colors.mutedForeground} />
            </View>
          )}
          {video.duration_seconds && (
            <View style={styles.durationBadge}>
              <Text variant="small" style={styles.durationText}>
                {formatDuration(video.duration_seconds)}
              </Text>
            </View>
          )}
          {video.transcription && (
            <View style={[styles.ccBadge]}>
              <Text variant="small" style={styles.ccText}>CC</Text>
            </View>
          )}
        </View>
        <CardContent style={styles.cardBody}>
          <Text variant="h4" numberOfLines={1}>
            {video.customer_name}
          </Text>
          <Text variant="small" color="muted" numberOfLines={1}>
            {video.loan_officer_name} • {formattedDate}
          </Text>
          <View style={styles.cardFooter}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusInfo.color + '20' },
              ]}
            >
              <Text variant="small" style={{ color: statusInfo.color }}>
                {statusInfo.label}
              </Text>
            </View>
            {video.sentiment_label && (
              <View style={styles.sentimentBadge}>
                <Ionicons
                  name={video.sentiment_label === 'positive' ? 'happy' : 'sad'}
                  size={14}
                  color={video.sentiment_label === 'positive' ? colors.success : colors.warning}
                />
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
});

interface StatsCardProps {
  label: string;
  value: number;
  color?: string;
}

function StatsCard({ label, value, color }: StatsCardProps) {
  const colors = Colors.light;
  return (
    <View style={styles.statsCard}>
      <Text
        variant="h3"
        style={[styles.statsValue, color ? { color } : undefined]}
      >
        {value}
      </Text>
      <Text variant="small" color="muted">
        {label}
      </Text>
    </View>
  );
}

export function VideoTestimonialsScreen({ navigation }: { navigation: any }) {
  const colors = Colors.light;
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoTestimonialResponse[]>([]);
  const [stats, setStats] = useState<VideoTestimonialStats | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [canApprove, setCanApprove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      // Check user role
      const profile = await getUserProfile();
      setCanApprove(profile?.role === 'admin' || profile?.role === 'manager');

      // Fetch videos with filter
      const params = activeFilter !== 'all'
        ? { approvalStatus: activeFilter }
        : undefined;

      const result = await getVideoTestimonialResponses(params);
      setVideos(result.responses);
      setStats(result.stats);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVideos(false);
  }, [fetchVideos]);

  const handleVideoPress = useCallback((video: VideoTestimonialResponse) => {
    navigation.navigate('VideoDetail', { videoId: video.id });
  }, [navigation]);

  const handleCreateRequest = useCallback(() => {
    navigation.navigate('CreateRequest');
  }, [navigation]);

  const renderVideo = useCallback(
    ({ item }: { item: VideoTestimonialResponse }) => (
      <VideoCard
        video={item}
        onPress={() => handleVideoPress(item)}
        canApprove={canApprove}
      />
    ),
    [handleVideoPress, canApprove]
  );

  const ListHeader = useCallback(() => (
    <View style={styles.listHeader}>
      {/* Stats Row */}
      {stats && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsRow}
          contentContainerStyle={styles.statsRowContent}
        >
          <StatsCard label="Total" value={stats.total} />
          <StatsCard label="Pending" value={stats.pending} color={colors.warning} />
          <StatsCard label="Approved" value={stats.approved} color={colors.success} />
          <StatsCard label="Published" value={stats.published} color="#3b82f6" />
        </ScrollView>
      )}

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterRowContent}
      >
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              activeFilter === tab.key && styles.filterTabActive,
              activeFilter === tab.key && { borderColor: colors.primary },
            ]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text
              variant="small"
              style={[
                styles.filterTabText,
                activeFilter === tab.key && { color: colors.primary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  ), [stats, activeFilter, colors]);

  const ListEmpty = useCallback(() => (
    <Card style={styles.emptyCard}>
      <CardContent style={styles.emptyContent}>
        <Ionicons name="videocam-outline" size={48} color={colors.mutedForeground} />
        <Text variant="h4" style={styles.emptyTitle}>
          No videos yet
        </Text>
        <Text variant="muted" style={styles.emptyText}>
          {activeFilter === 'all'
            ? 'Video testimonials will appear here once customers submit them.'
            : `No ${activeFilter} videos found.`}
        </Text>
        {canApprove && (
          <Button
            variant="outline"
            style={styles.emptyButton}
            onPress={handleCreateRequest}
          >
            Send Request
          </Button>
        )}
      </CardContent>
    </Card>
  ), [activeFilter, canApprove, handleCreateRequest, colors]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Text variant="h2">Video Testimonials</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="muted" style={styles.loadingText}>Loading videos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text variant="h2">Video Testimonials</Text>
          {canApprove && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateRequest}
            >
              <Ionicons name="add" size={24} color={colors.primaryForeground} />
            </TouchableOpacity>
          )}
        </View>
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.destructive + '20' }]}>
            <Text variant="small" style={{ color: colors.destructive }}>{error}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={videos}
        renderItem={renderVideo}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  listHeader: {
    marginBottom: 16,
  },
  statsRow: {
    marginBottom: 16,
    marginHorizontal: -16,
  },
  statsRowContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  filterRow: {
    marginHorizontal: -16,
  },
  filterRowContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: '#fff',
    borderWidth: 1,
  },
  filterTabText: {
    fontWeight: '500',
  },
  videoCard: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    position: 'relative',
    height: 160,
    backgroundColor: '#f1f5f9',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontWeight: '600',
  },
  ccBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ccText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 10,
  },
  cardBody: {
    paddingTop: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sentimentBadge: {
    marginLeft: 'auto',
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  emptyButton: {
    marginTop: 24,
  },
});
