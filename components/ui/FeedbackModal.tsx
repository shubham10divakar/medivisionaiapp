import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, Platform, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';
import { submitFeedback } from '@/services/firebase';

const CATEGORIES = ['Bug', 'Suggestion', 'Other'] as const;
type Category = (typeof CATEGORIES)[number];
const APP_VERSION = '1.0.0';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function FeedbackModal({ visible, onClose }: Props) {
  const theme = useTheme();
  const { user } = useStore();

  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<Category>('Suggestion');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email ?? '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setRating(0);
    setCategory('Suggestion');
    setMessage('');
    setContactEmail(user?.email ?? '');
    setLoading(false);
    setSent(false);
    setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSend() {
    if (rating === 0) {
      setError('Please give a rating first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await submitFeedback({
        userId: user?.uid ?? 'anonymous',
        displayName: user?.name ?? 'Guest',
        isGuest: !user?.email,
        rating,
        message,
        category,
        contactEmail,
        appVersion: APP_VERSION,
        device: `${Platform.OS} ${Platform.Version}`,
      });
      setSent(true);
      setTimeout(handleClose, 1800);
    } catch {
      setError("Couldn't send. Use the email option below.");
    } finally {
      setLoading(false);
    }
  }

  function openMailto() {
    const subject = encodeURIComponent(`MediVision Feedback [${category}] — v${APP_VERSION}`);
    const body = encodeURIComponent(
      `Rating: ${rating}/5\nCategory: ${category}\n\n${message || '(no message)'}\n\n---\nDevice: ${Platform.OS} ${Platform.Version}`,
    );
    Linking.openURL(`mailto:shubham.divakar@gmail.com?subject=${subject}&body=${body}`);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Send Feedback</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {sent ? (
              <View style={styles.sentBox}>
                <Text style={styles.sentEmoji}>🫁</Text>
                <Text style={[styles.sentTitle, { color: theme.text }]}>Thanks for the feedback!</Text>
                <Text style={[styles.sentSub, { color: theme.textMuted }]}>It helps improve MediVision AI.</Text>
              </View>
            ) : (
              <>
                <Text style={[styles.label, { color: theme.textMuted }]}>How would you rate the app?</Text>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Text style={[styles.star, { color: n <= rating ? '#f59e0b' : theme.border }]}>
                        {n <= rating ? '★' : '☆'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.label, { color: theme.textMuted }]}>Category</Text>
                <View style={styles.chips}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.chip,
                        { borderColor: theme.border },
                        category === c && { backgroundColor: theme.primary + '20', borderColor: theme.primary },
                      ]}
                      onPress={() => setCategory(c)}
                    >
                      <Text style={[styles.chipText, { color: category === c ? theme.primary : theme.textSecondary }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.label, { color: theme.textMuted }]}>Message (optional)</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                  placeholder="What worked, what didn't, what you'd like to see…"
                  placeholderTextColor={theme.textMuted}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <Text style={[styles.label, { color: theme.textMuted }]}>Contact email (optional)</Text>
                <TextInput
                  style={[styles.inputSingle, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.textMuted}
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                {error ? <Text style={[styles.error, { color: theme.error }]}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: theme.primary }]}
                  onPress={handleSend}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendBtnText}>Send</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={openMailto} style={styles.mailBtn}>
                  <Ionicons name="mail-outline" size={15} color={theme.textMuted} />
                  <Text style={[styles.mailText, { color: theme.textMuted }]}>Send by email instead</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '88%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 12, fontWeight: '600', marginTop: 14, marginBottom: 6, letterSpacing: 0.4 },
  stars: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 30 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 90 },
  inputSingle: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  error: { fontSize: 13, fontWeight: '600', marginTop: 10, textAlign: 'center' },
  sendBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16, minHeight: 50, justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  mailBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  mailText: { fontSize: 13 },
  sentBox: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  sentEmoji: { fontSize: 44 },
  sentTitle: { fontSize: 17, fontWeight: '700' },
  sentSub: { fontSize: 13 },
});
