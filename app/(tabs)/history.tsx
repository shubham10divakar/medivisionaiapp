import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useStore, RunRecord } from '@/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { PositivePill, FindingCountBadge } from '@/components/ui/PositivePill';
import { modelDisplayName } from '@/constants/models';
import { fetchCloudRuns, CloudRun } from '@/services/firebase';

export default function HistoryScreen() {
  const theme = useTheme();
  const { history, clearHistory, user } = useStore();
  const [tab, setTab] = useState<'local' | 'cloud'>('local');

  const [cloud, setCloud] = useState<CloudRun[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState('');

  const canCloud = !!user?.uid && user.uid !== 'local';

  const loadCloud = useCallback(async () => {
    if (!canCloud) return;
    setCloudLoading(true);
    setCloudError('');
    try {
      const { records } = await fetchCloudRuns(user!.uid);
      setCloud(records);
    } catch {
      setCloudError('Could not load cloud history. Check your connection.');
    } finally {
      setCloudLoading(false);
    }
  }, [canCloud, user?.uid]);

  useFocusEffect(
    useCallback(() => {
      if (tab === 'cloud') loadCloud();
    }, [tab, loadCloud]),
  );

  function confirmClear() {
    Alert.alert('Clear history', 'Delete all runs stored on this device? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete all', style: 'destructive', onPress: clearHistory },
    ]);
  }

  function renderLocal({ item }: { item: RunRecord }) {
    const positives = item.response.result.positive_labels ?? [];
    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/result', params: { id: item.id } })}
        activeOpacity={0.85}
      >
        <Card style={styles.card}>
          <View style={styles.row}>
            <Image source={{ uri: item.imageUri }} style={styles.thumb} resizeMode="cover" />
            <View style={{ flex: 1, gap: 6 }}>
              <FindingCountBadge count={positives.length} />
              {positives.length > 0 && (
                <View style={styles.pillWrap}>
                  {positives.slice(0, 3).map((l) => (
                    <PositivePill key={l} label={l} />
                  ))}
                  {positives.length > 3 && (
                    <Text style={[styles.more, { color: theme.textMuted }]}>+{positives.length - 3}</Text>
                  )}
                </View>
              )}
              <Text style={[styles.meta, { color: theme.textMuted }]}>
                {modelDisplayName(item.response.model_name)} · {item.response.inference_ms}ms ·{' '}
                {new Date(item.timestamp).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  function renderCloud({ item }: { item: CloudRun }) {
    const ts = item.timestamp?.toMillis?.() ?? 0;
    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/result',
            params: {
              id: item.id,
              model: item.model,
              positiveLabels: JSON.stringify(item.positiveLabels ?? []),
              inferenceMs: String(item.inferenceMs ?? 0),
              threshold: String(item.threshold ?? 0.5),
              timestamp: String(ts),
            },
          })
        }
        activeOpacity={0.85}
      >
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.cloudThumb, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="cloud-outline" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <FindingCountBadge count={item.positiveCount ?? item.positiveLabels?.length ?? 0} />
              {(item.positiveLabels ?? []).length > 0 && (
                <View style={styles.pillWrap}>
                  {item.positiveLabels.slice(0, 3).map((l) => (
                    <PositivePill key={l} label={l} />
                  ))}
                </View>
              )}
              <Text style={[styles.meta, { color: theme.textMuted }]}>
                {modelDisplayName(item.model)} · {ts ? new Date(ts).toLocaleDateString() : 'syncing…'}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  const count = tab === 'local' ? history.length : cloud.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <LinearGradient colors={[theme.primaryDark, theme.primary]} style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSub}>
          {count} run{count !== 1 ? 's' : ''} {tab === 'cloud' ? 'in the cloud' : 'on this device'}
        </Text>
      </LinearGradient>

      <View style={[styles.tabRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {(['local', 'cloud'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && { borderBottomColor: theme.primary }]}
            onPress={() => setTab(t)}
          >
            <Ionicons
              name={t === 'local' ? 'phone-portrait-outline' : 'cloud-outline'}
              size={15}
              color={tab === t ? theme.primary : theme.textMuted}
            />
            <Text style={[styles.tabLabel, { color: tab === t ? theme.primary : theme.textMuted }]}>
              {t === 'local' ? 'On device' : 'Cloud'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'local' &&
        (history.length === 0 ? (
          <Empty title="No runs yet" sub="Your predictions will show up here." />
        ) : (
          <FlatList
            data={history}
            keyExtractor={(i) => i.id}
            renderItem={renderLocal}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <TouchableOpacity style={[styles.clearBtn, { borderColor: theme.error }]} onPress={confirmClear}>
                <Ionicons name="trash-outline" size={14} color={theme.error} />
                <Text style={[styles.clearText, { color: theme.error }]}>Clear all</Text>
              </TouchableOpacity>
            }
          />
        ))}

      {tab === 'cloud' &&
        (!canCloud ? (
          <Empty title="Not signed in" sub="Sign in from Settings to sync runs across devices." />
        ) : cloudLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.primary} size="large" />
          </View>
        ) : cloudError ? (
          <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={44} color={theme.textMuted} />
            <Text style={[styles.errText, { color: theme.textMuted }]}>{cloudError}</Text>
            <TouchableOpacity onPress={loadCloud} style={[styles.retryBtn, { borderColor: theme.primary }]}>
              <Text style={[styles.retryText, { color: theme.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : cloud.length === 0 ? (
          <Empty title="No cloud runs yet" sub="Runs are saved here automatically when you're signed in." />
        ) : (
          <FlatList
            data={cloud}
            keyExtractor={(i) => i.id}
            renderItem={renderCloud}
            contentContainerStyle={styles.list}
          />
        ))}
    </SafeAreaView>
  );
}

function Empty({ title, sub }: { title: string; sub: string }) {
  const theme = useTheme();
  return (
    <View style={styles.centered}>
      <Ionicons name="documents-outline" size={44} color={theme.textMuted} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.emptySub, { color: theme.textMuted }]}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 28, paddingTop: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.82)', marginTop: 4 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 14, fontWeight: '600' },
  list: { padding: 16, gap: 10 },
  card: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 62, height: 62, borderRadius: 10, backgroundColor: '#000' },
  cloudThumb: { width: 62, height: 62, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  more: { fontSize: 11, fontWeight: '600' },
  meta: { fontSize: 11 },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end',
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 4,
  },
  clearText: { fontSize: 13, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 24 },
  errText: { fontSize: 14, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8, marginTop: 4 },
  retryText: { fontSize: 14, fontWeight: '600' },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center' },
});
