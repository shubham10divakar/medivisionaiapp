import React, { useEffect, useState, RefObject } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';

interface Props {
  id: string;
  targetRef: RefObject<View | null>;
  title: string;
  message: string;
}

type Layout = { x: number; y: number; width: number; height: number };

const PAD = 10;

export function CoachMark({ id, targetRef, title, message }: Props) {
  const theme = useTheme();
  const { coachMarksCompleted, markCoachDone, skipAllCoachMarks } = useStore();
  const [layout, setLayout] = useState<Layout | null>(null);
  const done = coachMarksCompleted.includes(id);

  useEffect(() => {
    if (done) return;
    const timer = setTimeout(() => {
      targetRef.current?.measureInWindow((x, y, w, h) => {
        if (w > 0) setLayout({ x, y, width: w, height: h });
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [done]);

  if (done || !layout) return null;

  const { width: SW, height: SH } = Dimensions.get('screen');
  const tx = Math.max(0, layout.x - PAD);
  const ty = Math.max(0, layout.y - PAD);
  const tw = Math.min(SW - tx, layout.width + PAD * 2);
  const th = layout.height + PAD * 2;
  const showBelow = ty + th < SH * 0.62;

  return (
    <Modal visible transparent statusBarTranslucent animationType="fade">
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => markCoachDone(id)}>
        <View pointerEvents="none" style={[styles.dark, { top: 0, left: 0, right: 0, height: ty }]} />
        <View pointerEvents="none" style={[styles.dark, { top: ty + th, left: 0, right: 0, bottom: 0 }]} />
        <View pointerEvents="none" style={[styles.dark, { top: ty, left: 0, width: tx, height: th }]} />
        <View pointerEvents="none" style={[styles.dark, { top: ty, left: tx + tw, right: 0, height: th }]} />

        <View
          pointerEvents="none"
          style={[styles.ring, { top: ty, left: tx, width: tw, height: th, borderColor: theme.primary }]}
        />

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={[
            styles.tooltip,
            { backgroundColor: theme.surface, borderColor: theme.border },
            showBelow ? { top: ty + th + 14 } : { top: Math.max(24, ty - 152) },
            { left: Math.min(Math.max(16, tx - 8), SW - 300) },
          ]}
        >
          <Text style={[styles.tooltipTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.tooltipMsg, { color: theme.textSecondary }]}>{message}</Text>
          <View style={styles.tooltipBtns}>
            <TouchableOpacity onPress={skipAllCoachMarks} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.skipText, { color: theme.textMuted }]}>Skip all</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.gotItBtn, { backgroundColor: theme.primary }]} onPress={() => markCoachDone(id)}>
              <Text style={styles.gotItText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dark: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.74)' },
  ring: { position: 'absolute', borderWidth: 2.5, borderRadius: 12 },
  tooltip: {
    position: 'absolute',
    width: 280,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  tooltipTitle: { fontSize: 15, fontWeight: '800' },
  tooltipMsg: { fontSize: 13, lineHeight: 19 },
  tooltipBtns: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 8 },
  skipText: { fontSize: 13 },
  gotItBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  gotItText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
