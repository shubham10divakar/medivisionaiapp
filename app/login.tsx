import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Image, ScrollView, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  signInWithGoogle, signInAsGuest, signUpWithEmail, signInWithEmail,
  sendPasswordReset, googleConfigured,
} from '@/services/firebase';
import { validateEmail, validatePassword, mapAuthError } from '@/utils/authValidation';
import { useTheme } from '@/hooks/useTheme';
import { useStore, LOCAL_USER } from '@/store/useStore';

export default function LoginScreen() {
  const theme = useTheme();
  const { addDebugLog, setUser } = useStore();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState('');

  const [emailMode, setEmailMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  function openEmailForm(signUp: boolean) {
    setIsSignUp(signUp);
    setEmailMode(true);
    setError('');
    setResetSent(false);
  }

  function closeEmailForm() {
    setEmailMode(false);
    setEmail('');
    setPassword('');
    setDisplayName('');
    setConfirmPassword('');
    setShowPassword(false);
    setError('');
    setResetSent(false);
  }

  async function handleGoogle() {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      if (e?.message !== 'Google Sign-In was cancelled') {
        setError(e?.code ? mapAuthError(e.code) : e?.message ?? 'Google sign-in failed.');
        addDebugLog(`Google sign-in failed — ${e?.code ?? e?.message}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleGuest() {
    setError('');
    setGuestLoading(true);
    try {
      await signInAsGuest();
    } catch (e: any) {
      setError(mapAuthError(e?.code ?? 'unknown'));
    } finally {
      setGuestLoading(false);
    }
  }

  async function handleEmailAuth() {
    setError('');
    const emailErr = validateEmail(email);
    if (emailErr) return setError(emailErr);
    const passErr = validatePassword(password);
    if (passErr) return setError(passErr);
    if (isSignUp) {
      if (!displayName.trim()) return setError('Please enter your name.');
      if (password !== confirmPassword) return setError("Passwords don't match.");
    }
    setEmailLoading(true);
    try {
      if (isSignUp) await signUpWithEmail(email, password, displayName);
      else await signInWithEmail(email, password);
    } catch (e: any) {
      setError(mapAuthError(e?.code ?? 'unknown'));
      addDebugLog(`Email auth failed — ${e?.code}`);
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleForgot() {
    if (validateEmail(email)) return setError('Enter your email address first.');
    setResetLoading(true);
    setError('');
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (e: any) {
      setError(mapAuthError(e?.code ?? 'unknown'));
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.primaryDark, theme.primary, theme.primaryLight]} style={styles.hero}>
        <View style={styles.iconWrap}>
          <Ionicons name="add" size={52} color="#fff" />
        </View>
        <Text style={styles.appName}>MediVision AI</Text>
        <Text style={styles.tagline}>Live chest X-ray model demos</Text>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {emailMode ? (
            <>
              <TouchableOpacity onPress={closeEmailForm} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={20} color={theme.primary} />
                <Text style={[styles.backText, { color: theme.primary }]}>Back</Text>
              </TouchableOpacity>

              <Text style={[styles.welcomeTitle, { color: theme.text }]}>
                {isSignUp ? 'Create account' : 'Welcome back'}
              </Text>
              <Text style={[styles.welcomeSub, { color: theme.textSecondary }]}>
                {isSignUp ? 'Sign up to sync your runs across devices.' : 'Sign in to access your synced runs.'}
              </Text>

              {isSignUp && (
                <Field icon="person-outline" placeholder="Your name" value={displayName} onChangeText={setDisplayName} theme={theme} autoCapitalize="words" />
              )}
              <Field icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} theme={theme} keyboardType="email-address" autoCapitalize="none" />
              <View style={[styles.inputWrap, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Password"
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
              {isSignUp && (
                <Field icon="lock-closed-outline" placeholder="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} theme={theme} secureTextEntry={!showPassword} autoCapitalize="none" />
              )}

              {error ? <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text> : null}
              {resetSent ? <Text style={[styles.successText, { color: theme.success }]}>Password reset email sent.</Text> : null}

              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.primary }]} onPress={handleEmailAuth} disabled={emailLoading}>
                {emailLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{isSignUp ? 'Create account' : 'Log in'}</Text>}
              </TouchableOpacity>

              {!isSignUp && (
                <TouchableOpacity onPress={handleForgot} disabled={resetLoading} style={styles.forgotBtn}>
                  {resetLoading ? <ActivityIndicator size="small" color={theme.textMuted} /> : <Text style={[styles.forgotText, { color: theme.textMuted }]}>Forgot password?</Text>}
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => { setIsSignUp((v) => !v); setError(''); }} style={styles.toggleBtn}>
                <Text style={[styles.toggleText, { color: theme.primary }]}>
                  {isSignUp ? 'Log in instead' : 'Create an account'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.welcomeTitle, { color: theme.text }]}>Welcome</Text>
              <Text style={[styles.welcomeSub, { color: theme.textSecondary }]}>
                Sign in to sync your runs, or continue without an account — everything works either way.
              </Text>

              {googleConfigured && (
                <TouchableOpacity style={[styles.googleBtn, { borderColor: theme.border }]} onPress={handleGoogle} disabled={googleLoading}>
                  {googleLoading ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <>
                      <Image source={{ uri: 'https://www.google.com/favicon.ico' }} style={styles.googleIcon} />
                      <Text style={[styles.googleBtnText, { color: theme.text }]}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.emailBtn, { backgroundColor: theme.primary }]} onPress={() => openEmailForm(false)}>
                <Ionicons name="mail-outline" size={20} color="#fff" />
                <Text style={styles.emailBtnText}>Sign in with email</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => openEmailForm(true)} style={styles.signUpLink}>
                <Text style={[styles.signUpLinkText, { color: theme.textMuted }]}>
                  No account? <Text style={{ color: theme.primary, fontWeight: '700' }}>Create one</Text>
                </Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <Text style={[styles.dividerText, { color: theme.textSecondary }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

              <TouchableOpacity style={[styles.guestBtn, { borderColor: theme.border }]} onPress={handleGuest} disabled={guestLoading}>
                {guestLoading ? (
                  <ActivityIndicator size="small" color={theme.textSecondary} />
                ) : (
                  <>
                    <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
                    <Text style={[styles.guestBtnText, { color: theme.textSecondary }]}>Continue as guest</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.noAccountBtn} onPress={() => setUser(LOCAL_USER)}>
                <Text style={[styles.noAccountText, { color: theme.textMuted }]}>Continue without an account</Text>
              </TouchableOpacity>

              {error ? <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text> : null}

              <View style={styles.features}>
                {[
                  { icon: 'scan-outline', label: 'Run open X-ray models on your images' },
                  { icon: 'book-outline', label: 'Reference for all 14 ChestX-ray14 findings' },
                  { icon: 'cloud-outline', label: 'Optional cross-device run history' },
                ].map((f) => (
                  <View key={f.label} style={styles.featureRow}>
                    <Ionicons name={f.icon as any} size={18} color={theme.primary} />
                    <Text style={[styles.featureText, { color: theme.textSecondary }]}>{f.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ icon, theme, ...props }: any) {
  return (
    <View style={[styles.inputWrap, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <Ionicons name={icon} size={18} color={theme.textMuted} style={styles.inputIcon} />
      <TextInput style={[styles.input, { color: theme.text }]} placeholderTextColor={theme.textMuted} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { alignItems: 'center', paddingTop: 44, paddingBottom: 44, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  iconWrap: {
    width: 90, height: 90, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  appName: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6 },
  body: { paddingHorizontal: 28, paddingTop: 30, paddingBottom: 40, gap: 14 },
  welcomeTitle: { fontSize: 25, fontWeight: '800' },
  welcomeSub: { fontSize: 14, lineHeight: 21 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: '#fff', borderWidth: 1, borderRadius: 14, paddingVertical: 15, minHeight: 54,
  },
  googleIcon: { width: 22, height: 22 },
  googleBtnText: { fontSize: 16, fontWeight: '700' },
  emailBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 14, paddingVertical: 15, minHeight: 54,
  },
  emailBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  signUpLink: { alignItems: 'center', marginTop: -4 },
  signUpLinkText: { fontSize: 14 },
  guestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14, paddingVertical: 15, minHeight: 54,
  },
  guestBtnText: { fontSize: 16, fontWeight: '600' },
  noAccountBtn: { alignItems: 'center', paddingVertical: 6 },
  noAccountText: { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontWeight: '500' },
  features: { marginTop: 8, gap: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { flex: 1, fontSize: 14, fontWeight: '500' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  backText: { fontSize: 15, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, minHeight: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
  eyeBtn: { padding: 4 },
  primaryBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  forgotBtn: { alignItems: 'center', paddingVertical: 4 },
  forgotText: { fontSize: 14 },
  toggleBtn: { alignItems: 'center', paddingVertical: 4 },
  toggleText: { fontSize: 15, fontWeight: '600' },
  errorText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  successText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
