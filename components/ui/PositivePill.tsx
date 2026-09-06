import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { prettyLabel } from '@/constants/conditions';

/** A chip for a finding the model flagged as positive (>= threshold). */
export function PositivePill({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: theme.positive + '22', borderColor: theme.positive + '55' }]}>
      <Text style={[styles.text, { color: theme.positive }]}>{prettyLabel(label)}</Text>
    </View>
  );
}

/** Summary badge: how many findings crossed the threshold. */
export function FindingCountBadge({ count }: { count: number }) {
  const theme = useTheme();
  const clear = count === 0;
  const color = clear ? theme.success : theme.positive;
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>
        {clear ? 'No positive findings' : `${count} positive finding${count > 1 ? 's' : ''}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: { fontSize: 12, fontWeight: '700' },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
});
