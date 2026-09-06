import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { getAllConditionLabels, getConditionInfo } from '@/constants/conditions';
import { MODELS } from '@/constants/models';

const LABELS = getAllConditionLabels();

type Row =
  | { type: 'models' }
  | { type: 'sectionHeader' }
  | { type: 'condition'; label: string };

export default function LearnScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const conditions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LABELS.map((label) => ({ label, info: getConditionInfo(label) })).filter(
      (c) => !q || c.info.name.toLowerCase().includes(q) || c.info.short.toLowerCase().includes(q),
    );
  }, [query]);

  const rows: Row[] = useMemo(
    () => [
      ...(query.trim() ? [] : [{ type: 'models' as const }]),
      { type: 'sectionHeader' as const },
      ...conditions.map((c) => ({ type: 'condition' as const, label: c.label })),
    ],
    [conditions, query],
  );

  function renderRow({ item }: { item: Row }) {
    if (item.type === 'models') {
      return (
        <Card style={styles.modelsCard}>
          <View style={styles.modelsHead}>
            <Ionicons name="cube-outline" size={16} color={theme.primary} />
            <Text style={[styles.modelsTitle, { color: theme.text }]}>The models</Text>
          </View>
          <Text style={[styles.modelsSub, { color: theme.textMuted }]}>
            Both are fine-tuned on NIH ChestX-ray14 and served from medivisionai.in. They score all 14
            findings independently (multilabel).
          </Text>
          {MODELS.map((m) => (
            <View key={m.name} style={[styles.modelLine, { borderTopColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modelName, { color: theme.text }]}>
                  {m.arch}
                  {m.recommended ? '  ·  default' : ''}
                </Text>
                <Text style={[styles.modelMeta, { color: theme.textMuted }]}>
                  {m.name} · {m.params} params · {m.speed}
                </Text>
                <Text style={[styles.modelDesc, { color: theme.textSecondary }]}>{m.description}</Text>
              </View>
            </View>
          ))}
        </Card>
      );
    }
    if (item.type === 'sectionHeader') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeaderText, { color: theme.primary }]}>
            {LABELS.length} thoracic findings
          </Text>
        </View>
      );
    }
    const info = getConditionInfo(item.label);
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/condition', params: { label: item.label } })}
      >
        <Card style={styles.condCard}>
          <View style={styles.condRow}>
            <View style={[styles.iconWrap, { backgroundColor: theme.primary + '22' }]}>
              <Ionicons name="pulse-outline" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.condName, { color: theme.text }]}>{info.name}</Text>
              <Text style={[styles.condShort, { color: theme.textMuted }]} numberOfLines={1}>
                {info.short}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <LinearGradient colors={[theme.primaryDark, theme.primary]} style={styles.header}>
        <Text style={styles.headerTitle}>Learn</Text>
        <Text style={styles.headerSub}>What the model is looking for</Text>
      </LinearGradient>

      <View style={[styles.searchWrap, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search a finding…"
          placeholderTextColor={theme.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item, i) => (item.type === 'condition' ? item.label : `${item.type}-${i}`)}
        renderItem={renderRow}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No matches</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 28, paddingTop: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.82)', marginTop: 4 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  list: { padding: 16, gap: 8, paddingBottom: 32 },
  modelsCard: { gap: 4 },
  modelsHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  modelsTitle: { fontSize: 15, fontWeight: '700' },
  modelsSub: { fontSize: 12, lineHeight: 17, marginBottom: 6 },
  modelLine: { borderTopWidth: 1, paddingTop: 10, marginTop: 6 },
  modelName: { fontSize: 13, fontWeight: '700' },
  modelMeta: { fontSize: 11, marginTop: 2 },
  modelDesc: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  sectionHeader: { paddingVertical: 10, paddingHorizontal: 4, marginTop: 6 },
  sectionHeaderText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  condCard: { padding: 12 },
  condRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  condName: { fontSize: 14, fontWeight: '700' },
  condShort: { fontSize: 11, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
});
