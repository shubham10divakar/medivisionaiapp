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

// ─── Account deletion ───────────────────────────────────────────────────────

/** Thrown when Firebase wants a fresh sign-in before a sensitive operation. */
export class RecentLoginRequiredError extends Error {
  constructor() {
    super('For your security, please sign out, sign in again, and then delete your account.');
    this.name = 'RecentLoginRequiredError';
  }
}

// Firebase rejects account deletion when the last sign-in is more than a few
// minutes old. Check up front so we never delete the data and then fail to
// delete the account itself.
const RECENT_LOGIN_WINDOW_MS = 4 * 60 * 1000;

/**
 * Permanently deletes the signed-in user's cloud run history and then the
 * Firebase Auth account. Feedback already submitted is create-only and is
 * removed on request (see the privacy policy).
 */
export async function deleteAccount() {
  const currentUser = auth().currentUser;
  if (!currentUser) throw new Error('You are not signed in.');

  const lastSignIn = currentUser.metadata?.lastSignInTime
    ? new Date(currentUser.metadata.lastSignInTime).getTime()
    : 0;
  if (!currentUser.isAnonymous && Date.now() - lastSignIn > RECENT_LOGIN_WINDOW_MS) {
    throw new RecentLoginRequiredError();
  }

  const userDoc = firestore().collection('users').doc(currentUser.uid);
  for (;;) {
    const snap = await userDoc.collection('runs').limit(200).get();
    if (snap.empty) break;
    const batch = firestore().batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await userDoc.delete().catch(() => {
    /* no profile document, or rules only cover the runs subcollection */
  });

  const wasGoogle = currentUser.providerData.some((p) => p.providerId === 'google.com');
  try {
    await currentUser.delete();
  } catch (e: any) {
    if (e?.code === 'auth/requires-recent-login') throw new RecentLoginRequiredError();
    throw e;
  }
  if (googleConfigured && wasGoogle) {
    try {
      await GoogleSignin.revokeAccess();
    } catch {
      /* already revoked */
    }
  }
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
