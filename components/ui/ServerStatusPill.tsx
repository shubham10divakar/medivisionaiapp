import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ServerStatus } from '@/store/useStore';

const CONFIG: Record<ServerStatus, { label: string; dot: string } | null> = {
  idle: null,
  checking: { label: 'Waking the model server…', dot: '#f59e0b' },
  ready: { label: 'Server ready', dot: '#10b981' },
  offline: { label: 'Server unreachable', dot: '#f43f5e' },
};

export function ServerStatusPill({ status }: { status: ServerStatus }) {
  const cfg = CONFIG[status];
  if (!cfg) return null;
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.label, { color: cfg.dot }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: 12, fontWeight: '600' },
});
