import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';

export function HomeScreen() {
  const { user } = useAuth();
  const colors = Colors.light;
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh - in real app, would fetch data
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Placeholder metrics - would come from API in real implementation
  const metrics = {
    totalReviews: 47,
    averageRating: 4.8,
    npsScore: 72,
    reviewsThisMonth: 12,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text variant="h2">Welcome back</Text>
          <Text variant="muted">
            {user?.email || 'User'}
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <CardHeader>
              <CardTitle style={styles.metricValue}>{metrics.totalReviews}</CardTitle>
            </CardHeader>
            <CardContent>
              <Text variant="small" color="muted">
                Total Reviews
              </Text>
            </CardContent>
          </Card>

          <Card style={styles.metricCard}>
            <CardHeader>
              <CardTitle style={styles.metricValue}>
                {metrics.averageRating.toFixed(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text variant="small" color="muted">
                Avg Rating
              </Text>
            </CardContent>
          </Card>

          <Card style={styles.metricCard}>
            <CardHeader>
              <CardTitle style={styles.metricValue}>{metrics.npsScore}</CardTitle>
            </CardHeader>
            <CardContent>
              <Text variant="small" color="muted">
                NPS Score
              </Text>
            </CardContent>
          </Card>

          <Card style={styles.metricCard}>
            <CardHeader>
              <CardTitle style={styles.metricValue}>{metrics.reviewsThisMonth}</CardTitle>
            </CardHeader>
            <CardContent>
              <Text variant="small" color="muted">
                This Month
              </Text>
            </CardContent>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="h4" style={styles.sectionTitle}>
            Recent Activity
          </Text>
          <Card>
            <CardContent style={styles.emptyState}>
              <Text variant="muted" style={styles.emptyText}>
                Your recent reviews and activity will appear here.
              </Text>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  metricCard: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: 'center',
  },
});
