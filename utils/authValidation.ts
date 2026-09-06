export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

export function mapAuthError(code: string): string {
  const map: Record<string, string> = {
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 8 characters.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/network-request-failed': 'No internet connection.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled for the project.',
    'auth/requires-recent-login': 'Please sign in again to continue.',
  };
  return map[code] ?? 'Something went wrong. Please try again.';
}
