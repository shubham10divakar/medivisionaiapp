import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Switch, TouchableOpacity, TextInput, ScrollView, Linking, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { FeedbackModal } from '@/components/ui/FeedbackModal';
import { MODELS } from '@/constants/models';
import { healthCheck } from '@/services/api';
import { signOut, deleteAccount } from '@/services/firebase';

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    darkMode, toggleDarkMode, selectedModel, setModel,
    apiUrl, setApiUrl, user, resetOnboarding, setUser, clearHistory,
  } = useStore();

  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState(apiUrl);
  const [testState, setTestState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isLocal = !user || user.uid === 'local';

  function handleSignOut() {
    Alert.alert('Sign out', 'Sign out of this account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch {
            setUser(null);
          }
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account, your cloud run history and the runs stored on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
              clearHistory();
              setUser(null);
            } catch (e: any) {
              Alert.alert('Could not delete account', e?.message ?? 'Please try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  async function testServer() {
    setTestState('idle');
    const ok = await healthCheck(apiUrl);
    setTestState(ok ? 'ok' : 'fail');
  }

  function saveUrl() {
    setApiUrl(urlDraft.trim().replace(/\/$/, ''));
    setEditingUrl(false);
    setTestState('idle');
  }

  function replayTutorial() {
    resetOnboarding();
    router.replace('/onboarding');
  }

  const statusColor = testState === 'ok' ? theme.success : testState === 'fail' ? theme.error : theme.primary;
  const statusIcon = testState === 'ok' ? 'checkmark-circle' : testState === 'fail' ? 'close-circle' : 'wifi-outline';
  const statusLabel = testState === 'ok' ? 'Reachable' : testState === 'fail' ? 'Unreachable' : 'Test connection';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient colors={[theme.primaryDark, theme.primary]} style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </LinearGradient>

        <View style={styles.body}>
          {/* Account */}
          <Text style={[styles.groupLabel, { color: theme.textMuted }]}>ACCOUNT</Text>
          <Card style={styles.accountCard}>
            {isLocal ? (
              <>
                <View style={styles.accountRow}>
                  <View style={[styles.avatarFallback, { backgroundColor: theme.primary }]}>
                    <Ionicons name="person-outline" size={20} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.accountName, { color: theme.text }]}>Local demo</Text>
                    <Text style={[styles.accountEmail, { color: theme.textMuted }]}>
                      Runs are stored on this device only
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.primaryRow, { backgroundColor: theme.primary }]}
                  onPress={() => router.push('/login')}
                >
                  <Ionicons name="log-in-outline" size={16} color="#fff" />
                  <Text style={styles.primaryRowText}>Sign in to sync</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.accountRow}>
                  {user!.photo ? (
                    <Image source={{ uri: user!.photo }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: theme.primary }]}>
                      <Text style={styles.avatarInitial}>
                        {(user!.name ?? user!.email ?? 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.accountName, { color: theme.text }]} numberOfLines={1}>
                      {user!.name ?? (user!.isGuest ? 'Guest' : 'User')}
                    </Text>
                    <Text style={[styles.accountEmail, { color: theme.textMuted }]} numberOfLines={1}>
                      {user!.email ?? 'Anonymous session'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={[styles.outlineRow, { borderColor: theme.error }]} onPress={handleSignOut}>
                  <Ionicons name="log-out-outline" size={16} color={theme.error} />
                  <Text style={[styles.outlineRowText, { color: theme.error }]}>Sign out</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteRow}
                  onPress={handleDeleteAccount}
                  disabled={deleting}
                  accessibilityRole="button"
                >
                  <Ionicons name="trash-outline" size={14} color={theme.textMuted} />
                  <Text style={[styles.deleteRowText, { color: theme.textMuted }]}>
                    {deleting ? 'Deleting account…' : 'Delete account'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Card>

          {/* Appearance */}
          <Text style={[styles.groupLabel, { color: theme.textMuted }]}>APPEARANCE</Text>
          <Card>
            <View style={styles.row}>
              <Ionicons name="moon-outline" size={20} color={theme.primary} />
              <Text style={[styles.rowLabel, { color: theme.text }]}>Dark mode</Text>
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#fff"
              />
            </View>
          </Card>

          {/* API server */}
          <Text style={[styles.groupLabel, { color: theme.textMuted }]}>API SERVER</Text>
          <Card style={styles.apiCard}>
            <View style={styles.row}>
              <Ionicons name="server-outline" size={20} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Base URL</Text>
                {editingUrl ? (
                  <TextInput
                    value={urlDraft}
                    onChangeText={setUrlDraft}
                    style={[styles.urlInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    placeholder="https://medivisionai.in/api"
                    placeholderTextColor={theme.textMuted}
                    onSubmitEditing={saveUrl}
                    returnKeyType="done"
                  />
                ) : (
                  <Text style={[styles.urlDisplay, { color: theme.textMuted }]} numberOfLines={1}>
                    {apiUrl || 'Not configured'}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={editingUrl ? saveUrl : () => { setUrlDraft(apiUrl); setEditingUrl(true); }}
              >
                <Ionicons name={editingUrl ? 'checkmark-circle' : 'pencil-outline'} size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.testBtn, { borderColor: statusColor, backgroundColor: statusColor + '15' }]}
              onPress={testServer}
            >
              <Ionicons name={statusIcon as any} size={15} color={statusColor} />
              <Text style={[styles.testBtnText, { color: statusColor }]}>{statusLabel}</Text>
            </TouchableOpacity>
          </Card>

          {/* Default model */}
          <Text style={[styles.groupLabel, { color: theme.textMuted }]}>DEFAULT MODEL</Text>
          <Card style={styles.modelCard}>
            {MODELS.map((m, i) => (
              <TouchableOpacity
                key={m.name}
                style={[
                  styles.modelRow,
                  i < MODELS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                  selectedModel === m.name && { backgroundColor: theme.primary + '16' },
                ]}
                onPress={() => setModel(m.name)}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.modelNameRow}>
                    <Text style={[styles.modelName, { color: theme.text }]}>{m.arch}</Text>
                    {m.recommended && (
                      <View style={[styles.recBadge, { backgroundColor: theme.primary + '22' }]}>
                        <Text style={[styles.recText, { color: theme.primary }]}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.modelMeta, { color: theme.textMuted }]}>
                    {m.name} · {m.params} · {m.speed}
                  </Text>
                </View>
                {selectedModel === m.name && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
              </TouchableOpacity>
            ))}
          </Card>

          {/* Help */}
          <Text style={[styles.groupLabel, { color: theme.textMuted }]}>HELP</Text>
          <Card style={styles.modelCard}>
            <TouchableOpacity
              style={[styles.row, styles.helpRow, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
              onPress={replayTutorial}
            >
              <Ionicons name="school-outline" size={20} color={theme.primary} />
              <Text style={[styles.rowLabel, { color: theme.text }]}>Replay tutorial</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.row, styles.helpRow]} onPress={() => setFeedbackVisible(true)}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.primary} />
              <Text style={[styles.rowLabel, { color: theme.text }]}>Send feedback</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </Card>

          <FeedbackModal visible={feedbackVisible} onClose={() => setFeedbackVisible(false)} />

          {/* About */}
          <Text style={[styles.groupLabel, { color: theme.textMuted }]}>ABOUT</Text>
          <Card style={styles.aboutCard}>
            <View style={styles.aboutHeader}>
              <Text style={[styles.appName, { color: theme.primary }]}>MediVision AI</Text>
              <Text style={[styles.version, { color: theme.textMuted }]}>v{APP_VERSION}</Text>
            </View>
            <Text style={[styles.aboutDesc, { color: theme.textSecondary }]}>
              A companion to medivisionai.in for trying open chest X-ray models and learning what each
              ChestX-ray14 finding means. Research and educational use only — not a medical device.
            </Text>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://medivisionai.in')}>
              <Ionicons name="globe-outline" size={18} color={theme.primary} />
              <Text style={[styles.link, { color: theme.primary }]}>medivisionai.in</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://medivisionai.in/privacy.html')}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} />
              <Text style={[styles.link, { color: theme.primary }]}>Privacy policy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://pypi.org/project/xrayzoo/')}>
              <Ionicons name="cube-outline" size={18} color={theme.primary} />
              <Text style={[styles.link, { color: theme.primary }]}>xrayzoo on PyPI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('mailto:shubham.divakar@gmail.com')}>
              <Ionicons name="mail-outline" size={18} color={theme.primary} />
              <Text style={[styles.link, { color: theme.primary }]}>shubham.divakar@gmail.com</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 32 },
  header: { padding: 28, paddingTop: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  body: { paddingHorizontal: 16, gap: 8 },
  groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1, marginTop: 16, marginBottom: 4, marginLeft: 2 },
  accountCard: { gap: 12 },
  deleteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  deleteRowText: { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 20, fontWeight: '700' },
  accountName: { fontSize: 15, fontWeight: '700' },
  accountEmail: { fontSize: 12, marginTop: 2 },
  primaryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 10, paddingVertical: 10,
  },
  primaryRowText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  outlineRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderRadius: 8, paddingVertical: 8,
  },
  outlineRowText: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  apiCard: { gap: 12 },
  urlInput: { marginTop: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12 },
  urlDisplay: { fontSize: 12, marginTop: 3 },
  testBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1, borderRadius: 8, paddingVertical: 8,
  },
  testBtnText: { fontSize: 13, fontWeight: '600' },
  modelCard: { padding: 0, overflow: 'hidden' },
  helpRow: { padding: 14 },
  modelRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  modelNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modelName: { fontSize: 13, fontWeight: '700' },
  modelMeta: { fontSize: 11, marginTop: 2 },
  recBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  recText: { fontSize: 9, fontWeight: '700' },
  aboutCard: { gap: 6 },
  aboutHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appName: { fontSize: 18, fontWeight: '800' },
  aboutDesc: { fontSize: 13, lineHeight: 20 },
  version: { fontSize: 12 },
  divider: { height: 1, marginVertical: 6 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  link: { fontSize: 13, fontWeight: '600' },
});
