import React, { useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { PositivePill, FindingCountBadge } from '@/components/ui/PositivePill';
import { CoachMark } from '@/components/ui/CoachMark';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { modelDisplayName } from '@/constants/models';

export default function HomeScreen() {
  const theme = useTheme();
  const { history, selectedModel } = useStore();
  const ctaRef = useRef<View>(null);

  const totalRuns = history.length;
  const positiveFindings = history.reduce(
    (sum, r) => sum + (r.response.result.positive_labels?.length ?? 0),
    0,
  );
  const avgMs = totalRuns
    ? Math.round(history.reduce((s, r) => s + r.response.inference_ms, 0) / totalRuns)
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient colors={[theme.primaryDark, theme.primary]} style={styles.header}>
          <View style={styles.brandRow}>
            <Image source={require('@/assets/images/logo-mark.png')} style={styles.logoDot} />
            <Text style={styles.headerTitle}>MediVision AI</Text>
          </View>
          <Text style={styles.headerSub}>Live demos of open chest X-ray models</Text>
          <TouchableOpacity
            ref={ctaRef}
            style={styles.ctaBtn}
            onPress={() => router.push('/(tabs)/scan')}
            activeOpacity={0.85}
          >
            <Ionicons name="flash" size={18} color={theme.primary} />
            <Text style={[styles.ctaBtnText, { color: theme.primary }]}>Run a Live Demo</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>This device</Text>
          <View style={styles.statsRow}>
            {[
              { label: 'Runs', value: totalRuns, color: theme.primary },
              { label: 'Positive findings', value: positiveFindings, color: theme.positive },
              { label: 'Avg latency', value: avgMs ? (avgMs >= 1000 ? `${(avgMs / 1000).toFixed(1)}s` : `${avgMs}ms`) : '—', color: theme.secondary },
            ].map((s) => (
              <Card key={s.label} style={styles.statCard}>
                <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>{s.label}</Text>
              </Card>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Active model</Text>
          <Card>
            <View style={styles.modelRow}>
              <View style={[styles.modelIcon, { backgroundColor: theme.primary + '22' }]}>
                <Ionicons name="cube-outline" size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modelName, { color: theme.text }]}>{modelDisplayName(selectedModel)}</Text>
                <Text style={[styles.modelMeta, { color: theme.textMuted }]}>{selectedModel}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/scan')}>
                <Text style={[styles.changeText, { color: theme.primary }]}>Change</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {history.length > 0 ? (
            <>
              <View style={styles.recentRow}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent runs</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                  <Text style={[styles.viewAll, { color: theme.primary }]}>View all →</Text>
                </TouchableOpacity>
              </View>
              {history.slice(0, 3).map((item) => {
                const positives = item.response.result.positive_labels ?? [];
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push({ pathname: '/result', params: { id: item.id } })}
                  >
                    <Card style={styles.runCard}>
                      <View style={styles.runRow}>
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
                          <Text style={[styles.runMeta, { color: theme.textMuted }]}>
                            {modelDisplayName(item.response.model_name)} · {new Date(item.timestamp).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </>
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="scan-outline" size={44} color={theme.primaryLight} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No runs yet</Text>
              <Text style={[styles.emptySub, { color: theme.textMuted }]}>
                Tap "Run a Live Demo" to send a chest X-ray through a model.
              </Text>
            </Card>
          )}

          <Card>
            <Text style={[styles.aboutTitle, { color: theme.text }]}>About this app</Text>
            <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
              MediVision AI is a companion to medivisionai.in — a way to try the same open
              ChestX-ray14 models on your own images and read about what each of the 14 findings
              means. It's built for learning and demos, not diagnosis.
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/learn')} style={styles.aboutLink}>
              <Text style={[styles.aboutLinkText, { color: theme.primary }]}>Browse the 14 findings →</Text>
            </TouchableOpacity>
          </Card>

          <Disclaimer />
        </View>
      </ScrollView>

      <CoachMark
        id="home-cta"
        targetRef={ctaRef}
        title="Start here"
        message="Pick a chest X-ray, choose a model, and get a live multilabel prediction in seconds."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 28 },
  header: { padding: 28, paddingTop: 18, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: 4 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoDot: { width: 36, height: 36, borderRadius: 18 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.82)', marginTop: 6, marginBottom: 20 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff',
    alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 11, borderRadius: 50,
  },
  ctaBtnText: { fontSize: 15, fontWeight: '700' },
  body: { paddingHorizontal: 16, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', padding: 14 },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, marginTop: 3, textAlign: 'center' },
  modelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modelIcon: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  modelName: { fontSize: 14, fontWeight: '700' },
  modelMeta: { fontSize: 11, marginTop: 2 },
  changeText: { fontSize: 13, fontWeight: '600' },
  recentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  viewAll: { fontSize: 13, fontWeight: '600' },
  runCard: { padding: 12 },
  runRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#000' },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  more: { fontSize: 11, fontWeight: '600' },
  runMeta: { fontSize: 11 },
  emptyCard: { alignItems: 'center', padding: 32, marginTop: 8, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  aboutTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  aboutText: { fontSize: 13, lineHeight: 20 },
  aboutLink: { marginTop: 10 },
  aboutLinkText: { fontSize: 13, fontWeight: '600' },
});
