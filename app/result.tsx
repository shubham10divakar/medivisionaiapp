import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { FindingBar } from '@/components/ui/FindingBar';
import { PositivePill, FindingCountBadge } from '@/components/ui/PositivePill';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { modelDisplayName } from '@/constants/models';

export default function ResultScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    id: string;
    model?: string;
    positiveLabels?: string;
    inferenceMs?: string;
    threshold?: string;
    timestamp?: string;
  }>();

  const record = useStore((s) => s.history.find((r) => r.id === params.id));

  const cloud = useMemo(() => {
    if (record || !params.model) return null;
    let positives: string[] = [];
    try {
      positives = JSON.parse(params.positiveLabels ?? '[]');
    } catch {
      positives = [];
    }
    return {
      model: params.model,
      positives,
      inferenceMs: Number(params.inferenceMs ?? 0),
      threshold: Number(params.threshold ?? 0.5),
      timestamp: Number(params.timestamp ?? 0),
    };
  }, [record, params]);

  if (!record && !cloud) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.notFound, { color: theme.textMuted }]}>This prediction is no longer stored.</Text>
      </SafeAreaView>
    );
  }

  // ── Cloud summary (no image / per-finding scores kept) ──
  if (cloud) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card>
            <FindingCountBadge count={cloud.positives.length} />
            <View style={styles.pillWrap}>
              {cloud.positives.map((l) => (
                <TouchableOpacity key={l} onPress={() => router.push({ pathname: '/condition', params: { label: l } })}>
                  <PositivePill label={l} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Text style={[styles.meta, { color: theme.textMuted }]}>Model: {modelDisplayName(cloud.model)}</Text>
            <Text style={[styles.meta, { color: theme.textMuted }]}>Threshold: {cloud.threshold.toFixed(2)} · {cloud.inferenceMs} ms</Text>
            {cloud.timestamp > 0 && (
              <Text style={[styles.meta, { color: theme.textMuted }]}>{new Date(cloud.timestamp).toLocaleString()}</Text>
            )}
            <Text style={[styles.cloudNote, { color: theme.textMuted }]}>
              ☁ Loaded from cloud — the image and full per-finding scores are kept only on the device that ran it.
            </Text>
          </Card>
          <Disclaimer />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Full local record ──
  const r = record!.response.result;
  const sorted = [...(r.predictions ?? [])].sort((a, b) => b.confidence - a.confidence);
  const positives = r.positive_labels ?? sorted.filter((p) => p.positive).map((p) => p.label);
  const date = new Date(record!.timestamp).toLocaleString();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Image source={{ uri: record!.imageUri }} style={styles.image} resizeMode="contain" />

        <Card>
          <FindingCountBadge count={positives.length} />
          {positives.length > 0 ? (
            <View style={styles.pillWrap}>
              {positives.map((l) => (
                <TouchableOpacity key={l} onPress={() => router.push({ pathname: '/condition', params: { label: l } })}>
                  <PositivePill label={l} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={[styles.clearText, { color: theme.textSecondary }]}>
              No finding scored at or above the {r.threshold ?? 0.5} threshold. The model reads this study as
              unremarkable — which is not the same as a clinical all-clear.
            </Text>
          )}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: theme.textMuted }]}>{modelDisplayName(record!.response.model_name)}</Text>
            <Text style={[styles.meta, { color: theme.textMuted }]}>{record!.response.inference_ms} ms</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: theme.textMuted }]}>Threshold {r.threshold ?? 0.5}</Text>
            <Text style={[styles.meta, { color: theme.textMuted }]}>{date}</Text>
          </View>
        </Card>

        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>All findings</Text>
          <Text style={[styles.cardSub, { color: theme.textMuted }]}>
            Every ChestX-ray14 label with the model's probability. Tap a finding to read about it.
          </Text>
          <View style={{ marginTop: 12 }}>
            {sorted.map((p) => (
              <FindingBar
                key={p.label}
                label={p.label}
                confidence={p.confidence}
                positive={p.positive ?? p.confidence >= (r.threshold ?? 0.5)}
                onPress={() => router.push({ pathname: '/condition', params: { label: p.label } })}
              />
            ))}
          </View>
        </Card>

        <Disclaimer />

        <TouchableOpacity style={[styles.againBtn, { backgroundColor: theme.primary }]} onPress={() => router.replace('/(tabs)/scan')}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.againText}>Run another</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  notFound: { textAlign: 'center', marginTop: 60, fontSize: 15 },
  image: { width: '100%', height: 260, borderRadius: 18, backgroundColor: '#000' },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  clearText: { fontSize: 13, lineHeight: 19, marginTop: 12 },
  divider: { height: 1, marginVertical: 14 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  meta: { fontSize: 11 },
  cloudNote: { fontSize: 11, marginTop: 10, lineHeight: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSub: { fontSize: 12, marginTop: 3, lineHeight: 17 },
  againBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 4,
  },
  againText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
