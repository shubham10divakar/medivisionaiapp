import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Replace with the Web client ID from your Firebase project
// (Firebase console → Authentication → Sign-in method → Google → Web SDK
// configuration). See FIREBASE_SETUP.md. Google sign-in stays disabled until
// this is a real value.
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? 'REPLACE_WITH_FIREBASE_WEB_CLIENT_ID';

export const googleConfigured =
  GOOGLE_WEB_CLIENT_ID !== 'REPLACE_WITH_FIREBASE_WEB_CLIENT_ID' && GOOGLE_WEB_CLIENT_ID.length > 0;

if (googleConfigured) {
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
}

// ─── Google ─────────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  if (!googleConfigured) {
    throw new Error('Google Sign-In is not configured yet. See FIREBASE_SETUP.md.');
  }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  if (result.type !== 'success' || !result.data?.idToken) {
    throw new Error('Google Sign-In was cancelled');
  }
  const credential = auth.GoogleAuthProvider.credential(result.data.idToken);
  const userCredential = await auth().signInWithCredential(credential);
  return userCredential.user;
}

// ─── Guest ──────────────────────────────────────────────────────────────────

export async function signInAsGuest() {
  const userCredential = await auth().signInAnonymously();
  return userCredential.user;
}

// ─── Email / Password ───────────────────────────────────────────────────────

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const userCredential = await auth().createUserWithEmailAndPassword(email, password);
  if (displayName.trim()) {
    await userCredential.user.updateProfile({ displayName: displayName.trim() });
  }
  return userCredential.user;
}

export async function signInWithEmail(email: string, password: string) {
  const userCredential = await auth().signInWithEmailAndPassword(email, password);
  return userCredential.user;
}

export async function sendPasswordReset(email: string) {
  await auth().sendPasswordResetEmail(email);
}

// ─── Sign-out ───────────────────────────────────────────────────────────────

export async function signOut() {
  const currentUser = auth().currentUser;
  if (googleConfigured && currentUser && !currentUser.isAnonymous) {
    try {
      await GoogleSignin.signOut();
    } catch {
      /* not signed in with Google */
    }
  }
  await auth().signOut();
}

// ─── Demo logging ───────────────────────────────────────────────────────────

export interface CloudRunPayload {
  clientId: string;
  model: string;
  topFinding: string;
  positiveLabels: string[];
  positiveCount: number;
  inferenceMs: number;
  threshold: number;
}

export async function logRun(userId: string, payload: CloudRunPayload) {
  await firestore()
    .collection('users')
    .doc(userId)
    .collection('runs')
    .add({
      ...payload,
      timestamp: firestore.FieldValue.serverTimestamp(),
    });
}

export interface CloudRun extends CloudRunPayload {
  id: string;
  timestamp: FirebaseFirestoreTypes.Timestamp;
}

export async function fetchCloudRuns(
  userId: string,
  cursor?: FirebaseFirestoreTypes.DocumentSnapshot,
  pageSize = 20,
): Promise<{ records: CloudRun[]; lastDoc: FirebaseFirestoreTypes.DocumentSnapshot | null }> {
  let q: FirebaseFirestoreTypes.Query = firestore()
    .collection('users')
    .doc(userId)
    .collection('runs')
    .orderBy('timestamp', 'desc')
    .limit(pageSize);

  if (cursor) q = q.startAfter(cursor);

  const snap = await q.get();
  return {
    records: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CloudRun, 'id'>) })),
    lastDoc: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
  };
}

// ─── Feedback ───────────────────────────────────────────────────────────────

export async function submitFeedback(data: {
  userId: string;
  displayName: string;
  isGuest: boolean;
  rating: number;
  message: string;
  category: string;
  contactEmail: string;
  appVersion: string;
  device: string;
}) {
  await firestore()
    .collection('feedback')
    .add({ ...data, timestamp: firestore.FieldValue.serverTimestamp() });
}
