import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { prettyLabel } from '@/constants/conditions';

interface Props {
  label: string;
  confidence: number; // 0..1
  positive: boolean;
  onPress?: () => void;
  animate?: boolean;
}

export function FindingBar({ label, confidence, positive, onPress, animate = true }: Props) {
  const theme = useTheme();
  const anim = useRef(new Animated.Value(animate ? 0 : confidence)).current;
  const pct = Math.round(confidence * 1000) / 10;

  useEffect(() => {
    if (!animate) return;
    Animated.timing(anim, {
      toValue: confidence,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [confidence, animate]);

  const barColor = positive ? theme.positive : theme.textMuted;
  const Wrapper: any = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.head}>
        <Text
          style={[
            styles.label,
            { color: positive ? theme.text : theme.textSecondary, fontWeight: positive ? '700' : '500' },
          ]}
          numberOfLines={1}
        >
          {prettyLabel(label)}
        </Text>
        <Text style={[styles.pct, { color: barColor }]}>{pct.toFixed(1)}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.border }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: barColor,
              width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) as any,
            },
          ]}
        />
      </View>
      {onPress ? (
        <View style={styles.infoHint}>
          <Ionicons name="chevron-forward" size={12} color={theme.textMuted} />
        </View>
      ) : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  label: { flex: 1, fontSize: 13 },
  pct: { fontSize: 12, fontWeight: '700', marginLeft: 8 },
  track: { height: 7, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 7, borderRadius: 4 },
  infoHint: { position: 'absolute', right: -2, top: 0 },
});
