import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { getConditionInfo } from '@/constants/conditions';

export default function ConditionScreen() {
  const theme = useTheme();
  const { label } = useLocalSearchParams<{ label: string }>();
  const key = label ?? '';
  const info = getConditionInfo(key);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Card style={[styles.titleCard, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
          <Text style={styles.titleKicker}>ChestX-ray14 finding</Text>
          <Text style={styles.titleName}>{info.name}</Text>
          <Text style={styles.titleShort}>{info.short}</Text>
        </Card>

        <Card>
          <Text style={[styles.h, { color: theme.text }]}>What it is</Text>
          <Text style={[styles.p, { color: theme.textSecondary }]}>{info.description}</Text>
        </Card>

        <Card>
          <Text style={[styles.h, { color: theme.text }]}>What a positive read suggests</Text>
          <Text style={[styles.p, { color: theme.textSecondary }]}>{info.meaning}</Text>
        </Card>

        <Section title="Common causes" icon="git-branch-outline" items={info.causes} color={theme.secondary} />
        <Section title="Radiographic signs" icon="scan-outline" items={info.radiographicSigns} color={theme.accent} />

        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, icon, items, color }: { title: string; icon: any; items: string[]; color: string }) {
  const theme = useTheme();
  return (
    <Card>
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={[styles.h, { color: theme.text, marginBottom: 0 }]}>{title}</Text>
      </View>
      {items.map((item, i) => (
        <View key={i} style={styles.bullet}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{item}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  titleCard: { padding: 22 },
  titleKicker: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '700', letterSpacing: 0.6 },
  titleName: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 4 },
  titleShort: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 6, lineHeight: 18 },
  h: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  p: { fontSize: 14, lineHeight: 22 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 7 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
