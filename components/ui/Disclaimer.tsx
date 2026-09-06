import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

/**
 * Shown on every screen that presents a model output. MediVision is a research
 * and teaching demo of the xrayzoo models — not a medical device.
 */
export function Disclaimer({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: theme.warning + '14', borderColor: theme.warning + '40' },
        compact && styles.compact,
      ]}
    >
      <Ionicons name="information-circle-outline" size={compact ? 14 : 16} color={theme.warning} />
      <Text style={[styles.text, { color: theme.textSecondary }, compact && styles.compactText]}>
        {compact
          ? 'Research demo — not a diagnostic tool.'
          : 'MediVision AI is a research and educational demo of open X-ray models. It is not a medical device and must not be used for diagnosis or clinical decisions.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  compact: { padding: 8, borderRadius: 10 },
  text: { flex: 1, fontSize: 12, lineHeight: 17 },
  compactText: { fontSize: 11, lineHeight: 15 },
});
