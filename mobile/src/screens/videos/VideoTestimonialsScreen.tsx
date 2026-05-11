import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Icon,
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
  onPress: (video: VideoTestimonialResponse) => void;
}

const VideoCard = React.memo(function VideoCard({ video, onPress }: VideoCardProps) {
  const colors = Colors.light;
  const statusInfo = getStatusDisplay(video.approval_status);
  const formattedDate = new Date(video.submitted_at).toLocaleDateString();

  return (
    <Pressable onPress={() => onPress(video)}>
      <Card style={styles.videoCard}>
        <View style={styles.thumbnailContainer}>
          {video.thumbnail_url ? (
            <Image
              source={{ uri: video.thumbnail_url }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Icon name="videocam" size={32} color={colors.mutedForeground} />
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
            <View style={styles.ccBadge}>
              <Text variant="small" style={styles.ccText}>CC</Text>
            </View>
          )}
        </View>
        <CardContent style={styles.cardBody}>
          <Text variant="h4" numberOfLines={1}>
            {video.customer_name}
          </Text>
          <Text variant="small" color="muted" numberOfLines={1}>
            {video.user_name} • {formattedDate}
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
                <Icon
                  name={video.sentiment_label === 'positive' ? 'happy' : 'sad'}
                  size={14}
                  color={video.sentiment_label === 'positive' ? colors.success : colors.warning}
                />
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
});

interface StatsCardProps {
  label: string;
  value: number;
  color?: string;
}

interface StatsItem {
  label: string;
  value: number;
  color?: string;
}

interface VideoTestimonialsState {
  refreshing: boolean;
  isLoading: boolean;
  videos: VideoTestimonialResponse[];
  stats: VideoTestimonialStats | null;
  activeFilter: FilterTab;
  canApprove: boolean;
  error: string | null;
}

const initialVideoTestimonialsState: VideoTestimonialsState = {
  refreshing: false,
  isLoading: true,
  videos: [],
  stats: null,
  activeFilter: 'all',
  canApprove: false,
  error: null,
};

const STAT_COLORS = {
  published: '#3b82f6',
};

const keyStatsItem = (item: StatsItem) => item.label;
const keyFilterTab = (item: { key: FilterTab }) => item.key;

function StatsList({ items }: { items: StatsItem[] }) {
  const renderStat = useCallback(
    ({ item }: { item: StatsItem }) => (
      <StatsCard label={item.label} value={item.value} color={item.color} />
    ),
    []
  );

  return (
    <FlatList
      data={items}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.statsRow}
      contentContainerStyle={styles.statsRowContent}
      keyExtractor={keyStatsItem}
      renderItem={renderStat}
    />
  );
}

const FilterPill = React.memo(function FilterPill({
  tab,
  active,
  activeColor,
  onSelect,
}: {
  tab: { key: FilterTab; label: string };
  active: boolean;
  activeColor: string;
  onSelect: (key: FilterTab) => void;
}) {
  const handlePress = useCallback(() => {
    onSelect(tab.key);
  }, [onSelect, tab.key]);

  return (
    <Pressable
      style={[
        styles.filterTab,
        active && styles.filterTabActive,
        active && { borderColor: activeColor },
      ]}
      onPress={handlePress}
    >
      <Text
        variant="small"
        style={[
          styles.filterTabText,
          active && { color: activeColor },
        ]}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
});

function FilterTabs({
  activeFilter,
  activeColor,
  onSelect,
}: {
  activeFilter: FilterTab;
  activeColor: string;
  onSelect: (key: FilterTab) => void;
}) {
  const renderFilter = useCallback(
    ({ item }: { item: { key: FilterTab; label: string } }) => (
      <FilterPill
        tab={item}
        active={activeFilter === item.key}
        activeColor={activeColor}
        onSelect={onSelect}
      />
    ),
    [activeFilter, activeColor, onSelect]
  );

  return (
    <FlatList
      data={FILTER_TABS}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterRow}
      contentContainerStyle={styles.filterRowContent}
      keyExtractor={keyFilterTab}
      renderItem={renderFilter}
    />
  );
}

function StatsCard({ label, value, color }: StatsCardProps) {
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
  const [state, setState] = useState<VideoTestimonialsState>(initialVideoTestimonialsState);

  const updateState = useCallback((nextState: Partial<VideoTestimonialsState>) => {
    setState((current) => ({ ...current, ...nextState }));
  }, []);

  const fetchVideos = useCallback(async (showLoader = true) => {
    try {
      updateState({ isLoading: showLoader ? true : state.isLoading, error: null });

      // Fetch profile and videos in parallel for better performance
      const params = state.activeFilter !== 'all'
        ? { approvalStatus: state.activeFilter }
        : undefined;

      const [profile, result] = await Promise.all([
        getUserProfile(),
        getVideoTestimonialResponses(params),
      ]);

      updateState({
        canApprove: profile?.role === 'admin' || profile?.role === 'manager',
        videos: result.responses,
        stats: result.stats,
      });
    } catch (err) {
      console.error('Error fetching videos:', err);
      updateState({ error: 'Failed to load videos. Pull down to retry.' });
    } finally {
      updateState({ isLoading: false, refreshing: false });
    }
  }, [state.activeFilter, state.isLoading, updateState]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const onRefresh = useCallback(() => {
    updateState({ refreshing: true });
    fetchVideos(false);
  }, [fetchVideos, updateState]);

  const handleVideoPress = useCallback((video: VideoTestimonialResponse) => {
    navigation.navigate('VideoDetail', { videoId: video.id });
  }, [navigation]);

  const handleCreateRequest = useCallback(() => {
    navigation.navigate('CreateRequest');
  }, [navigation]);

  const handleSelectFilter = useCallback((activeFilter: FilterTab) => {
    updateState({ activeFilter });
  }, [updateState]);

  const renderVideo = useCallback(
    ({ item }: { item: VideoTestimonialResponse }) => (
      <VideoCard
        video={item}
        onPress={handleVideoPress}
      />
    ),
    [handleVideoPress]
  );

  const ListHeader = useCallback(() => (
    <View style={styles.listHeader}>
      {/* Stats Row */}
      {state.stats && (
        <StatsList
          items={[
            { label: 'Total', value: state.stats.total },
            { label: 'Pending', value: state.stats.pending, color: colors.warning },
            { label: 'Approved', value: state.stats.approved, color: colors.success },
            { label: 'Published', value: state.stats.published, color: STAT_COLORS.published },
          ]}
        />
      )}

      {/* Filter Tabs */}
      <FilterTabs
        activeFilter={state.activeFilter}
        activeColor={colors.primary}
        onSelect={handleSelectFilter}
      />
    </View>
  ), [state.stats, state.activeFilter, colors, handleSelectFilter]);

  const ListEmpty = useCallback(() => (
    <Card style={styles.emptyCard}>
      <CardContent style={styles.emptyContent}>
        <Icon name="videocam-outline" size={48} color={colors.mutedForeground} />
        <Text variant="h4" style={styles.emptyTitle}>
          No videos yet
        </Text>
        <Text variant="muted" style={styles.emptyText}>
          {state.activeFilter === 'all'
            ? 'Video testimonials will appear here once customers submit them.'
            : `No ${state.activeFilter} videos found.`}
        </Text>
        {state.canApprove && (
          <Button
            variant="outline"
            style={styles.emptyButton}
            onPress={handleCreateRequest}
          >
            <Text variant="body">Send Request</Text>
          </Button>
        )}
      </CardContent>
    </Card>
  ), [state.activeFilter, state.canApprove, handleCreateRequest, colors]);

  if (state.isLoading && !state.refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Text variant="h2">Video Testimonials</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="muted" style={styles.loadingText}>Loading videos…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text variant="h2">Video Testimonials</Text>
          {state.canApprove && (
            <Pressable
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateRequest}
            >
              <Icon name="add" size={24} color={colors.primaryForeground} />
            </Pressable>
          )}
        </View>
        {state.error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.destructive + '20' }]}>
            <Text variant="small" style={{ color: colors.destructive }}>{state.error}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={state.videos}
        renderItem={renderVideo}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl refreshing={state.refreshing} onRefresh={onRefresh} />
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
