import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  Text,
  Icon,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from '../../components/ui';
import { Colors } from '../../constants/colors';
import {
  getVideoTestimonialResponse,
  getVideoSignedUrl,
  updateVideoApprovalStatus,
  formatDuration,
  getStatusDisplay,
  getUserProfile,
} from '../../lib/video-testimonials';
import type { VideoTestimonialResponse } from '../../types';

type TabKey = 'video' | 'transcription' | 'details';
const TABS: TabKey[] = ['video', 'transcription', 'details'];
const DATE_FORMATTER = new Intl.DateTimeFormat();

interface VideoDetailState {
  isLoading: boolean;
  video: VideoTestimonialResponse | null;
  signedUrl: string | null;
  activeTab: TabKey;
  canApprove: boolean;
  actionLoading: boolean;
  rejectReason: string;
  showRejectInput: boolean;
  showChangesInput: boolean;
  changesNotes: string;
}

const initialDetailState: VideoDetailState = {
  isLoading: true,
  video: null,
  signedUrl: null,
  activeTab: 'video',
  canApprove: false,
  actionLoading: false,
  rejectReason: '',
  showRejectInput: false,
  showChangesInput: false,
  changesNotes: '',
};

function formatDisplayDate(value: string) {
  return DATE_FORMATTER.format(new Date(value));
}

function VideoStatusRow({ video, colors }: { video: VideoTestimonialResponse; colors: typeof Colors.light }) {
  const statusInfo = getStatusDisplay(video.approval_status);

  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
        <Text variant="small" style={{ color: statusInfo.color, fontWeight: '600' }}>
          {statusInfo.label}
        </Text>
      </View>
      {video.duration_seconds && (
        <Text variant="muted">
          {formatDuration(video.duration_seconds)}
        </Text>
      )}
      {video.sentiment_label && (
        <View style={styles.sentimentRow}>
          <Icon
            name={video.sentiment_label === 'positive' ? 'happy' : 'sad'}
            size={16}
            color={video.sentiment_label === 'positive' ? colors.success : colors.warning}
          />
          <Text variant="small" color="muted" style={{ marginLeft: 4 }}>
            {video.sentiment_label}
          </Text>
        </View>
      )}
    </View>
  );
}

function DetailTabs({
  activeTab,
  onSelect,
  colors,
}: {
  activeTab: TabKey;
  onSelect: (tab: TabKey) => void;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.tabRow}>
      {TABS.map((tab) => (
        <Pressable
          key={tab}
          style={[
            styles.tab,
            activeTab === tab && styles.tabActive,
            activeTab === tab && { borderBottomColor: colors.primary },
          ]}
          onPress={() => onSelect(tab)}
        >
          <Text
            variant="small"
            style={[
              styles.tabText,
              activeTab === tab && { color: colors.primary, fontWeight: '600' },
            ]}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function VideoTabContent({
  activeTab,
  video,
  colors,
}: {
  activeTab: TabKey;
  video: VideoTestimonialResponse;
  colors: typeof Colors.light;
}) {
  if (activeTab === 'video') {
    return (
      <View>
        {video.ai_generated_text ? (
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Text variant="body">{video.ai_generated_text}</Text>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent style={styles.emptyTabContent}>
              <Icon name="sparkles-outline" size={32} color={colors.mutedForeground} />
              <Text variant="muted" style={{ marginTop: 8 }}>
                AI summary not available yet
              </Text>
            </CardContent>
          </Card>
        )}
        {video.key_phrases && video.key_phrases.length > 0 && (
          <Card style={{ marginTop: 12 }}>
            <CardHeader>
              <CardTitle>Key Phrases</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.keyPhrasesContainer}>
                {video.key_phrases.map((phrase) => (
                  <View key={phrase} style={styles.keyPhrase}>
                    <Text variant="small">{phrase}</Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        )}
      </View>
    );
  }

  if (activeTab === 'transcription') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcription</CardTitle>
        </CardHeader>
        <CardContent>
          {video.transcription ? (
            <Text variant="body">{video.transcription}</Text>
          ) : (
            <View style={styles.emptyTabContent}>
              <Icon name="text-outline" size={32} color={colors.mutedForeground} />
              <Text variant="muted" style={{ marginTop: 8 }}>
                {video.transcription_status === 'processing'
                  ? 'Transcription in progress…'
                  : 'Transcription not available'}
              </Text>
            </View>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <View style={styles.detailRow}>
          <Text variant="muted">Customer</Text>
          <Text variant="body">{video.customer_name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text variant="muted">Email</Text>
          <Text variant="body">{video.customer_email}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text variant="muted">Loan Officer</Text>
          <Text variant="body">{video.user_name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text variant="muted">Submitted</Text>
          <Text variant="body">{formatDisplayDate(video.submitted_at)}</Text>
        </View>
        {video.approved_at && (
          <View style={styles.detailRow}>
            <Text variant="muted">Approved</Text>
            <Text variant="body">{formatDisplayDate(video.approved_at)}</Text>
          </View>
        )}
        {video.rejection_reason && (
          <View style={styles.detailRow}>
            <Text variant="muted">Rejection Reason</Text>
            <Text variant="body" style={{ color: colors.destructive }}>
              {video.rejection_reason}
            </Text>
          </View>
        )}
        {video.manager_notes && (
          <View style={styles.detailRow}>
            <Text variant="muted">Manager Notes</Text>
            <Text variant="body">{video.manager_notes}</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

function ApprovalActions({
  colors,
  actionLoading,
  rejectReason,
  showRejectInput,
  showChangesInput,
  changesNotes,
  onRejectReasonChange,
  onChangesNotesChange,
  onApprove,
  onReject,
  onRequestChanges,
}: {
  colors: typeof Colors.light;
  actionLoading: boolean;
  rejectReason: string;
  showRejectInput: boolean;
  showChangesInput: boolean;
  changesNotes: string;
  onRejectReasonChange: (value: string) => void;
  onChangesNotesChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onRequestChanges: () => void;
}) {
  return (
    <View style={styles.actionsSection}>
      <Text variant="h4" style={styles.actionsTitle}>Actions</Text>

      {showRejectInput && (
        <View style={styles.rejectInputContainer}>
          <TextInput
            style={[styles.rejectInput, { borderColor: colors.border }]}
            placeholder="Reason for rejection…"
            value={rejectReason}
            onChangeText={onRejectReasonChange}
            multiline
            numberOfLines={3}
          />
        </View>
      )}

      {showChangesInput && (
        <View style={styles.rejectInputContainer}>
          <TextInput
            style={[styles.rejectInput, { borderColor: colors.border }]}
            placeholder="What changes are needed…"
            value={changesNotes}
            onChangeText={onChangesNotesChange}
            multiline
            numberOfLines={3}
          />
        </View>
      )}

      <View style={styles.actionButtons}>
        <Button
          variant="default"
          style={[styles.actionButton, { backgroundColor: colors.success }]}
          onPress={onApprove}
          isLoading={actionLoading}
        >
          <Text variant="body">
            <Icon name="checkmark" size={18} color="#fff" /> Approve
          </Text>
        </Button>
        <Button
          variant="destructive"
          style={styles.actionButton}
          onPress={onReject}
          isLoading={actionLoading}
        >
          <Text variant="body">
            <Icon name="close" size={18} color="#fff" /> Reject
          </Text>
        </Button>
        <Button
          variant="outline"
          style={styles.actionButton}
          onPress={onRequestChanges}
          isLoading={actionLoading}
        >
          <Text variant="body">
            <Icon name="create-outline" size={18} /> Changes
          </Text>
        </Button>
      </View>
    </View>
  );
}

export function VideoDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { videoId } = route.params;
  const colors = Colors.light;
  const { width: screenWidth } = useWindowDimensions();
  const videoHeight = (screenWidth * 9) / 16;
  const [state, setState] = useState<VideoDetailState>(initialDetailState);
  const player = useVideoPlayer(state.signedUrl ? { uri: state.signedUrl } : null);

  const updateState = useCallback((nextState: Partial<VideoDetailState>) => {
    setState((current) => ({ ...current, ...nextState }));
  }, []);

  const fetchVideo = useCallback(async () => {
    try {
      updateState({ isLoading: true });

      // Fetch profile and video details in parallel for better performance
      const [profile, videoData] = await Promise.all([
        getUserProfile(),
        getVideoTestimonialResponse(videoId),
      ]);

      if (!videoData) {
        Alert.alert('Error', 'Video not found');
        navigation.goBack();
        return;
      }

      // Get signed URL for playback (depends on videoData)
      let nextSignedUrl: string | null = null;
      if (videoData.video_path) {
        nextSignedUrl = await getVideoSignedUrl(videoData.video_path);
      }

      updateState({
        video: videoData,
        signedUrl: nextSignedUrl,
        canApprove: profile?.role === 'admin' || profile?.role === 'manager',
      });
    } catch (err) {
      console.error('Error fetching video:', err);
      Alert.alert('Error', 'Failed to load video');
    } finally {
      updateState({ isLoading: false });
    }
  }, [videoId, navigation, updateState]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const handleApprove = useCallback(async () => {
    const video = state.video;
    if (!video) return;

    Alert.alert(
      'Approve Video',
      `Are you sure you want to approve this video testimonial from ${video.customer_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              updateState({ actionLoading: true });
              await updateVideoApprovalStatus(video.id, 'approve');
              Alert.alert('Success', 'Video approved successfully');
              fetchVideo(); // Refresh
            } catch (err) {
              Alert.alert('Error', 'Failed to approve video');
            } finally {
              updateState({ actionLoading: false });
            }
          },
        },
      ]
    );
  }, [state.video, fetchVideo, updateState]);

  const handleReject = useCallback(async () => {
    if (!state.video) return;

    if (!state.showRejectInput) {
      updateState({ showRejectInput: true });
      return;
    }

    if (!state.rejectReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection');
      return;
    }

    try {
      updateState({ actionLoading: true });
      await updateVideoApprovalStatus(state.video.id, 'reject', { reason: state.rejectReason });
      Alert.alert('Success', 'Video rejected');
      updateState({ showRejectInput: false, rejectReason: '' });
      fetchVideo();
    } catch (err) {
      Alert.alert('Error', 'Failed to reject video');
    } finally {
      updateState({ actionLoading: false });
    }
  }, [state.video, state.showRejectInput, state.rejectReason, fetchVideo, updateState]);

  const handleRequestChanges = useCallback(async () => {
    if (!state.video) return;

    // Show input field for changes notes (cross-platform approach)
    if (!state.showChangesInput) {
      updateState({ showChangesInput: true });
      return;
    }

    if (!state.changesNotes.trim()) {
      Alert.alert('Required', 'Please describe what changes are needed');
      return;
    }

    try {
      updateState({ actionLoading: true });
      await updateVideoApprovalStatus(state.video.id, 'request_changes', {
        managerNotes: state.changesNotes,
      });
      Alert.alert('Success', 'Changes requested');
      updateState({ showChangesInput: false, changesNotes: '' });
      fetchVideo();
    } catch (err) {
      Alert.alert('Error', 'Failed to request changes');
    } finally {
      updateState({ actionLoading: false });
    }
  }, [state.video, state.showChangesInput, state.changesNotes, fetchVideo, updateState]);

  const handleShare = useCallback(async () => {
    if (!state.video || !state.signedUrl) return;

    try {
      await Share.share({
        title: `Video Testimonial from ${state.video.customer_name}`,
        message: state.video.ai_generated_text || `Check out this video testimonial from ${state.video.customer_name}`,
        url: state.signedUrl,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  }, [state.video, state.signedUrl]);

  if (state.isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="muted" style={styles.loadingText}>Loading video…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!state.video) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Icon name="alert-circle-outline" size={48} color={colors.destructive} />
          <Text variant="muted" style={styles.loadingText}>Video not found</Text>
          <Button variant="outline" onPress={() => navigation.goBack()}>
            <Text variant="body">Go Back</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const isPending = state.video.approval_status === 'pending' || state.video.approval_status === 'changes_requested';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="h4" numberOfLines={1} style={styles.headerTitle}>
          {state.video.customer_name}
        </Text>
        <Pressable onPress={handleShare} style={styles.shareButton}>
          <Icon name="share-outline" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Video Player */}
        <View style={styles.videoContainer}>
          {state.signedUrl ? (
            <VideoView
              player={player}
              style={[styles.video, { width: screenWidth, height: videoHeight }]}
              nativeControls
              contentFit="contain"
            />
          ) : (
            <View style={[styles.video, styles.videoPlaceholder, { width: screenWidth, height: videoHeight }]}>
              <Icon name="videocam-off" size={48} color={colors.mutedForeground} />
              <Text variant="muted">Video unavailable</Text>
            </View>
          )}
        </View>

        <VideoStatusRow video={state.video} colors={colors} />
        <DetailTabs activeTab={state.activeTab} onSelect={(activeTab) => updateState({ activeTab })} colors={colors} />

        {/* Tab Content */}
        <View style={styles.tabContent}>
          <VideoTabContent activeTab={state.activeTab} video={state.video} colors={colors} />
        </View>

        {/* Approval Actions */}
        {state.canApprove && isPending && (
          <ApprovalActions
            colors={colors}
            actionLoading={state.actionLoading}
            rejectReason={state.rejectReason}
            showRejectInput={state.showRejectInput}
            showChangesInput={state.showChangesInput}
            changesNotes={state.changesNotes}
            onRejectReasonChange={(rejectReason) => updateState({ rejectReason })}
            onChangesNotesChange={(changesNotes) => updateState({ changesNotes })}
            onApprove={handleApprove}
            onReject={handleReject}
            onRequestChanges={handleRequestChanges}
          />
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
  },
  shareButton: {
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  videoContainer: {
    backgroundColor: '#000',
  },
  video: {
  },
  videoPlaceholder: {
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sentimentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontWeight: '500',
  },
  tabContent: {
    padding: 16,
  },
  emptyTabContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  keyPhrasesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  keyPhrase: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  actionsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionsTitle: {
    marginBottom: 12,
  },
  rejectInputContainer: {
    marginBottom: 12,
  },
  rejectInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  bottomPadding: {
    height: 32,
  },
});
