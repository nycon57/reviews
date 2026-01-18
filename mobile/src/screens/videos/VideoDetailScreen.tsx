import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Share,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import {
  Text,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16; // 16:9 aspect ratio

type TabKey = 'video' | 'transcription' | 'details';

export function VideoDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { videoId } = route.params;
  const colors = Colors.light;
  const videoRef = useRef<Video>(null);

  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<VideoTestimonialResponse | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('video');
  const [isPlaying, setIsPlaying] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchVideo = useCallback(async () => {
    try {
      setLoading(true);

      // Check user role
      const profile = await getUserProfile();
      setCanApprove(profile?.role === 'admin' || profile?.role === 'manager');

      // Fetch video details
      const videoData = await getVideoTestimonialResponse(videoId);
      if (!videoData) {
        Alert.alert('Error', 'Video not found');
        navigation.goBack();
        return;
      }
      setVideo(videoData);

      // Get signed URL for playback
      if (videoData.video_path) {
        const url = await getVideoSignedUrl(videoData.video_path);
        setSignedUrl(url);
      }
    } catch (err) {
      console.error('Error fetching video:', err);
      Alert.alert('Error', 'Failed to load video');
    } finally {
      setLoading(false);
    }
  }, [videoId, navigation]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (videoRef.current) {
      const status = await videoRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await videoRef.current.pauseAsync();
        } else {
          await videoRef.current.playAsync();
        }
      }
    }
  }, []);

  const handleApprove = useCallback(async () => {
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
              setActionLoading(true);
              await updateVideoApprovalStatus(video.id, 'approve');
              Alert.alert('Success', 'Video approved successfully');
              fetchVideo(); // Refresh
            } catch (err) {
              Alert.alert('Error', 'Failed to approve video');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }, [video, fetchVideo]);

  const handleReject = useCallback(async () => {
    if (!video) return;

    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (!rejectReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      await updateVideoApprovalStatus(video.id, 'reject', { reason: rejectReason });
      Alert.alert('Success', 'Video rejected');
      setShowRejectInput(false);
      setRejectReason('');
      fetchVideo();
    } catch (err) {
      Alert.alert('Error', 'Failed to reject video');
    } finally {
      setActionLoading(false);
    }
  }, [video, showRejectInput, rejectReason, fetchVideo]);

  const handleRequestChanges = useCallback(async () => {
    if (!video) return;

    Alert.prompt(
      'Request Changes',
      'What changes would you like the loan officer to address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async (notes: string | undefined) => {
            if (!notes?.trim()) return;
            try {
              setActionLoading(true);
              await updateVideoApprovalStatus(video.id, 'request_changes', {
                managerNotes: notes,
              });
              Alert.alert('Success', 'Changes requested');
              fetchVideo();
            } catch (err) {
              Alert.alert('Error', 'Failed to request changes');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
      'plain-text'
    );
  }, [video, fetchVideo]);

  const handleShare = useCallback(async () => {
    if (!video || !signedUrl) return;

    try {
      await Share.share({
        title: `Video Testimonial from ${video.customer_name}`,
        message: video.ai_generated_text || `Check out this video testimonial from ${video.customer_name}`,
        url: signedUrl,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  }, [video, signedUrl]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="muted" style={styles.loadingText}>Loading video...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!video) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
          <Text variant="muted" style={styles.loadingText}>Video not found</Text>
          <Button variant="outline" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusDisplay(video.approval_status);
  const isPending = video.approval_status === 'pending' || video.approval_status === 'changes_requested';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text variant="h4" numberOfLines={1} style={styles.headerTitle}>
          {video.customer_name}
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Video Player */}
        <View style={styles.videoContainer}>
          {signedUrl ? (
            <TouchableOpacity activeOpacity={0.9} onPress={togglePlayPause}>
              <Video
                ref={videoRef}
                source={{ uri: signedUrl }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              />
            </TouchableOpacity>
          ) : (
            <View style={[styles.video, styles.videoPlaceholder]}>
              <Ionicons name="videocam-off" size={48} color={colors.mutedForeground} />
              <Text variant="muted">Video unavailable</Text>
            </View>
          )}
        </View>

        {/* Status Badge */}
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
              <Ionicons
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

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['video', 'transcription', 'details'] as TabKey[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.tabActive,
                activeTab === tab && { borderBottomColor: colors.primary },
              ]}
              onPress={() => setActiveTab(tab)}
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
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'video' && (
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
                    <Ionicons name="sparkles-outline" size={32} color={colors.mutedForeground} />
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
                      {video.key_phrases.map((phrase, i) => (
                        <View key={i} style={styles.keyPhrase}>
                          <Text variant="small">{phrase}</Text>
                        </View>
                      ))}
                    </View>
                  </CardContent>
                </Card>
              )}
            </View>
          )}

          {activeTab === 'transcription' && (
            <Card>
              <CardHeader>
                <CardTitle>Transcription</CardTitle>
              </CardHeader>
              <CardContent>
                {video.transcription ? (
                  <Text variant="body">{video.transcription}</Text>
                ) : (
                  <View style={styles.emptyTabContent}>
                    <Ionicons name="text-outline" size={32} color={colors.mutedForeground} />
                    <Text variant="muted" style={{ marginTop: 8 }}>
                      {video.transcription_status === 'processing'
                        ? 'Transcription in progress...'
                        : 'Transcription not available'}
                    </Text>
                  </View>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'details' && (
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
                  <Text variant="body">{video.loan_officer_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text variant="muted">Submitted</Text>
                  <Text variant="body">
                    {new Date(video.submitted_at).toLocaleDateString()}
                  </Text>
                </View>
                {video.approved_at && (
                  <View style={styles.detailRow}>
                    <Text variant="muted">Approved</Text>
                    <Text variant="body">
                      {new Date(video.approved_at).toLocaleDateString()}
                    </Text>
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
          )}
        </View>

        {/* Approval Actions */}
        {canApprove && isPending && (
          <View style={styles.actionsSection}>
            <Text variant="h4" style={styles.actionsTitle}>Actions</Text>

            {showRejectInput && (
              <View style={styles.rejectInputContainer}>
                <TextInput
                  style={[styles.rejectInput, { borderColor: colors.border }]}
                  placeholder="Reason for rejection..."
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            <View style={styles.actionButtons}>
              <Button
                variant="default"
                style={[styles.actionButton, { backgroundColor: colors.success }]}
                onPress={handleApprove}
                isLoading={actionLoading}
              >
                <Ionicons name="checkmark" size={18} color="#fff" /> Approve
              </Button>
              <Button
                variant="destructive"
                style={styles.actionButton}
                onPress={handleReject}
                isLoading={actionLoading}
              >
                <Ionicons name="close" size={18} color="#fff" /> Reject
              </Button>
              <Button
                variant="outline"
                style={styles.actionButton}
                onPress={handleRequestChanges}
                isLoading={actionLoading}
              >
                <Ionicons name="create-outline" size={18} /> Changes
              </Button>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
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
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
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
