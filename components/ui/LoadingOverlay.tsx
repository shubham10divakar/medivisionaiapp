import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Modal, Easing } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

const MESSAGES = [
  'Uploading image to the model server…',
  'Decoding and normalising the X-ray…',
  'Resizing to 224×224…',
  'Running the backbone…',
  'Scoring 14 thoracic findings…',
  'Applying the decision threshold…',
  'Collecting positive findings…',
  'First run can take ~20 s while the model warms up…',
  'Almost there…',
];

export function LoadingOverlay({ visible }: { visible: boolean }) {
  const theme = useTheme();
  const [msgIndex, setMsgIndex] = useState(0);
  const scan = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setMsgIndex(0);
      return;
    }
    const id = setInterval(() => setMsgIndex((i) => (i + 1) % MESSAGES.length), 2600);

    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scan, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true }),
    );
    scanLoop.start();
    spinLoop.start();

    return () => {
      clearInterval(id);
      scanLoop.stop();
      spinLoop.stop();
    };
  }, [visible]);

  if (!visible) return null;

  const translateY = scan.interpolate({ inputRange: [0, 1], outputRange: [-34, 34] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Modal visible transparent statusBarTranslucent animationType="fade">
      <View style={[styles.backdrop, { backgroundColor: theme.background + 'E6' }]}>
        <View style={[styles.box, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.frame, { borderColor: theme.primary + '55' }]}>
            <Animated.View
              style={[styles.scanline, { backgroundColor: theme.primary, transform: [{ translateY }] }]}
            />
            <Animated.View style={[styles.ring, { borderColor: theme.primary, transform: [{ rotate }] }]} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Running inference</Text>
          <Text style={[styles.msg, { color: theme.textMuted }]}>{MESSAGES[msgIndex]}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  box: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  frame: {
    width: 96,
    height: 96,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  scanline: { position: 'absolute', left: 0, right: 0, height: 2, opacity: 0.9 },
  ring: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderTopColor: 'transparent' },
  title: { fontSize: 15, fontWeight: '800' },
  msg: { fontSize: 12, textAlign: 'center', lineHeight: 17, minHeight: 34 },
});
