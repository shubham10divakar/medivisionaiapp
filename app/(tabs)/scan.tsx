import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { CoachMark } from '@/components/ui/CoachMark';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { ServerStatusPill } from '@/components/ui/ServerStatusPill';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { fetchModels, predict, healthCheck, RemoteModel } from '@/services/api';
import { logRun } from '@/services/firebase';
import { prepareImage } from '@/utils/image';
import { MODELS, DEFAULT_MODEL, modelDisplayName } from '@/constants/models';

interface PickModel {
  name: string;
  arch: string;
  meta: string;
}

function mergeModels(remote: RemoteModel[]): PickModel[] {
  const known = new Map(MODELS.map((m) => [m.name, m]));
  if (remote.length === 0) {
    return MODELS.map((m) => ({ name: m.name, arch: m.arch, meta: `${m.params} params · ${m.speed}` }));
  }
  return remote.map((r) => {
    const k = known.get(r.name);
    return {
      name: r.name,
      arch: k?.arch ?? r.architecture ?? r.name,
      meta: [r.parameters ?? k?.params, r.task, r.loaded ? 'loaded' : 'cold'].filter(Boolean).join(' · '),
    };
  });
}

export default function DemoScreen() {
  const theme = useTheme();
  const {
    user, selectedModel, setModel, threshold, setThreshold,
    addRun, apiUrl, serverStatus, setServerStatus,
  } = useStore();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<PickModel[]>(mergeModels([]));
  const [pickerOpen, setPickerOpen] = useState(false);
  const modelCardRef = useRef<View>(null);

  useEffect(() => {
    if (!apiUrl) return;
    fetchModels(apiUrl)
      .then((remote) => {
        const merged = mergeModels(remote);
        setModels(merged);
        if (!merged.some((m) => m.name === selectedModel)) {
          setModel(merged[0]?.name ?? DEFAULT_MODEL);
        }
      })
      .catch(() => setModels(mergeModels([])));
  }, [apiUrl]);

  useFocusEffect(
    useCallback(() => {
      if (!apiUrl || serverStatus === 'checking' || serverStatus === 'ready') return;
      setServerStatus('checking');
      healthCheck(apiUrl).then((ok) => setServerStatus(ok ? 'ready' : 'offline'));
    }, [apiUrl, serverStatus]),
  );

  async function openCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to capture an X-ray image.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function openGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  function nudge(delta: number) {
    const next = Math.min(0.95, Math.max(0.05, Math.round((threshold + delta) * 100) / 100));
    setThreshold(next);
  }

  async function run() {
    if (!imageUri) return;
    if (!apiUrl) {
      Alert.alert('No server URL', 'Set the API URL in Settings first.');
      router.push('/(tabs)/settings');
      return;
    }
    setLoading(true);
    try {
      const prepared = await prepareImage(imageUri);
      const response = await predict(prepared, selectedModel, threshold, apiUrl);
      const record = { id: String(Date.now()), imageUri, modelName: selectedModel, response, timestamp: Date.now() };
      addRun(record);
      setServerStatus('ready');

      if (user?.uid && user.uid !== 'local') {
        const r = response.result;
        const top = [...(r.predictions ?? [])].sort((a, b) => b.confidence - a.confidence)[0];
        logRun(user.uid, {
          clientId: record.id,
          model: response.model_name,
          topFinding: top?.label ?? '',
          positiveLabels: r.positive_labels ?? [],
          positiveCount: (r.positive_labels ?? []).length,
          inferenceMs: response.inference_ms,
          threshold: r.threshold ?? threshold,
        }).catch(() => {});
      }

      router.push({ pathname: '/result', params: { id: record.id } });
    } catch (err: any) {
      Alert.alert('Prediction failed', err?.message ?? 'Could not reach the model server.');
      if (err?.status === 0) setServerStatus('offline');
    } finally {
      setLoading(false);
    }
  }

  const current = models.find((m) => m.name === selectedModel);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <LoadingOverlay visible={loading} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient colors={[theme.primaryDark, theme.primary]} style={styles.header}>
          <Text style={styles.headerTitle}>Live Demo</Text>
          <Text style={styles.headerSub}>Run a chest X-ray through a real model</Text>
        </LinearGradient>

        <View style={styles.body}>
          <TouchableOpacity onPress={openGallery} activeOpacity={0.9}>
            <Card style={styles.imageCard}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons name="add-circle-outline" size={56} color={theme.primaryLight} />
                  <Text style={[styles.placeholderText, { color: theme.textMuted }]}>
                    Tap to choose a chest X-ray
                  </Text>
                </View>
              )}
            </Card>
          </TouchableOpacity>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={openCamera}
            >
              <Ionicons name="camera-outline" size={20} color={theme.primary} />
              <Text style={[styles.actionBtnLabel, { color: theme.text }]}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={openGallery}
            >
              <Ionicons name="images-outline" size={20} color={theme.primary} />
              <Text style={[styles.actionBtnLabel, { color: theme.text }]}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {/* Model picker */}
          <View ref={modelCardRef} collapsable={false}>
            <Card>
              <TouchableOpacity style={styles.modelHeader} onPress={() => setPickerOpen((v) => !v)} activeOpacity={0.7}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modelLabel, { color: theme.textMuted }]}>MODEL</Text>
                  <Text style={[styles.modelName, { color: theme.text }]}>{modelDisplayName(selectedModel)}</Text>
                  <Text style={[styles.modelMeta, { color: theme.textMuted }]}>{current?.meta ?? selectedModel}</Text>
                </View>
                <Ionicons name={pickerOpen ? 'chevron-up' : 'chevron-down'} size={20} color={theme.primary} />
              </TouchableOpacity>

              {pickerOpen && (
                <View style={[styles.modelList, { borderTopColor: theme.border }]}>
                  {models.map((m) => {
                    const active = selectedModel === m.name;
                    return (
                      <TouchableOpacity
                        key={m.name}
                        style={[styles.modelItem, active && { backgroundColor: theme.primary + '18' }]}
                        onPress={() => {
                          setModel(m.name);
                          setPickerOpen(false);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.modelItemName, { color: theme.text }]}>{m.arch}</Text>
                          <Text style={[styles.modelItemMeta, { color: theme.textMuted }]}>{m.name} · {m.meta}</Text>
                        </View>
                        {active && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </Card>
          </View>

          {/* Threshold */}
          <Card>
            <View style={styles.thrHead}>
              <View>
                <Text style={[styles.modelLabel, { color: theme.textMuted }]}>DECISION THRESHOLD</Text>
                <Text style={[styles.modelMeta, { color: theme.textMuted }]}>
                  Findings scored ≥ this are flagged positive
                </Text>
              </View>
              <Text style={[styles.thrValue, { color: theme.primary }]}>{threshold.toFixed(2)}</Text>
            </View>
            <View style={styles.thrRow}>
              <TouchableOpacity style={[styles.thrBtn, { borderColor: theme.border }]} onPress={() => nudge(-0.05)}>
                <Ionicons name="remove" size={18} color={theme.text} />
              </TouchableOpacity>
              <View style={[styles.thrTrack, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.thrFill,
                    { backgroundColor: theme.primary, width: `${((threshold - 0.05) / 0.9) * 100}%` },
                  ]}
                />
              </View>
              <TouchableOpacity style={[styles.thrBtn, { borderColor: theme.border }]} onPress={() => nudge(0.05)}>
                <Ionicons name="add" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.presetRow}>
              {[0.25, 0.5, 0.75].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.preset,
                    { borderColor: theme.border },
                    Math.abs(threshold - p) < 0.001 && { backgroundColor: theme.primary + '20', borderColor: theme.primary },
                  ]}
                  onPress={() => setThreshold(p)}
                >
                  <Text style={[styles.presetText, { color: Math.abs(threshold - p) < 0.001 ? theme.primary : theme.textSecondary }]}>
                    {p.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {apiUrl ? <ServerStatusPill status={serverStatus} /> : null}

          <TouchableOpacity
            onPress={run}
            disabled={!imageUri || loading}
            activeOpacity={0.85}
            style={[styles.runBtn, (!imageUri || loading) && { opacity: 0.5 }]}
          >
            <LinearGradient
              colors={[theme.primaryDark, theme.primary]}
              style={styles.runBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="flash" size={20} color="#fff" />
              <Text style={styles.runBtnText}>Run Prediction</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Disclaimer />
        </View>
      </ScrollView>

      <CoachMark
        id="demo-model"
        targetRef={modelCardRef}
        title="Pick a model"
        message="Two ChestX-ray14 models are live. The list refreshes from the server, so new models appear here automatically."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 36 },
  header: { padding: 28, paddingTop: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.82)', marginTop: 4 },
  body: { paddingHorizontal: 16, gap: 12, paddingTop: 10 },
  imageCard: { height: 240, padding: 0, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  preview: { width: '100%', height: '100%' },
  placeholder: { flex: 1, height: 240, justifyContent: 'center', alignItems: 'center', gap: 12 },
  placeholderText: { fontSize: 14 },
  btnRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5,
  },
  actionBtnLabel: { fontSize: 15, fontWeight: '600' },
  modelHeader: { flexDirection: 'row', alignItems: 'center' },
  modelLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  modelName: { fontSize: 15, fontWeight: '700', marginTop: 3 },
  modelMeta: { fontSize: 11, marginTop: 2 },
  modelList: { marginTop: 12, borderTopWidth: 1, paddingTop: 4 },
  modelItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
  modelItemName: { fontSize: 13, fontWeight: '600' },
  modelItemMeta: { fontSize: 11, marginTop: 1 },
  thrHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  thrValue: { fontSize: 18, fontWeight: '800' },
  thrRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  thrBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  thrTrack: { flex: 1, height: 7, borderRadius: 4, overflow: 'hidden' },
  thrFill: { height: 7, borderRadius: 4 },
  presetRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  preset: { flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  presetText: { fontSize: 12, fontWeight: '700' },
  runBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 2 },
  runBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15 },
  runBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
