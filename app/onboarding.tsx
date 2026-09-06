import { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';

const SLIDES = [
  {
    icon: 'cloud-upload-outline',
    title: 'Bring a chest X-ray',
    body: 'Capture one with the camera or pick a JPEG/PNG from your gallery. Nothing is stored on the server.',
  },
  {
    icon: 'flash-outline',
    title: 'Run a real model',
    body: 'The same open ChestX-ray14 models that power medivisionai.in score your image live, in a second or two.',
  },
  {
    icon: 'stats-chart-outline',
    title: '14 findings, with confidence',
    body: 'Every thoracic finding gets an independent probability. The ones above your threshold are flagged positive.',
  },
  {
    icon: 'book-outline',
    title: 'Learn what they mean',
    body: 'Tap any finding for a plain-language explainer. This is a teaching and demo tool — not a diagnosis.',
  },
] as const;

export default function OnboardingScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  function handleNext() {
    if (isLast) return completeOnboarding();
    scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={completeOnboarding} hitSlop={12}>
          <Text style={[styles.skip, { color: theme.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <LinearGradient colors={[theme.primaryDark, theme.primary, theme.primaryLight]} style={styles.iconWrap}>
              <Ionicons name={slide.icon as any} size={68} color="#fff" />
            </LinearGradient>
            <Text style={[styles.title, { color: theme.text }]}>{slide.title}</Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={s.title}
              style={[styles.dot, { backgroundColor: i === index ? theme.primary : theme.border, width: i === index ? 22 : 8 }]}
            />
          ))}
        </View>
        <TouchableOpacity style={[styles.nextBtn, { backgroundColor: theme.primary }]} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>{isLast ? 'Get started' : 'Next'}</Text>
          <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipRow: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8, height: 36 },
  skip: { fontSize: 15, fontWeight: '600' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  iconWrap: { width: 150, height: 150, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 38 },
  title: { fontSize: 25, fontWeight: '800', textAlign: 'center', marginBottom: 14 },
  body: { fontSize: 15, lineHeight: 23, textAlign: 'center' },
  footer: { paddingHorizontal: 28, paddingBottom: 24, gap: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 14, paddingVertical: 16, minHeight: 54,
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
