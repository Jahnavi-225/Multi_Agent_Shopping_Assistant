import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Helper to check if user has configured real Firebase API keys in client/.env
export const isFirebaseConfigured = () => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith("AIza"));
};

let app = null;
let auth = null;
let googleProvider = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.error("Firebase init error:", e);
  }
}

// 1. Real Google Account Popup Sign-In
export const signInWithRealGoogle = async () => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase API keys are missing in client/.env. Please configure VITE_FIREBASE_API_KEY.");
  }
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const idToken = await user.getIdToken();

  return {
    user: {
      id: user.uid,
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      avatar_url: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      provider: "google"
    },
    idToken
  };
};

// Clears any previously rendered reCAPTCHA widget so a fresh one can be created.
export const resetPhoneRecaptcha = () => {
  if (window.recaptchaVerifier) {
    try { window.recaptchaVerifier.clear(); } catch (e) { /* no-op */ }
    window.recaptchaVerifier = null;
  }
  const el = document.getElementById('recaptcha-container');
  if (el) el.innerHTML = '';
};

// 2. Initialize Invisible / Visible Recaptcha for Real SMS OTP
export const setupPhoneRecaptcha = (containerId = 'recaptcha-container') => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase API keys missing in client/.env.");
  }
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => { resetPhoneRecaptcha(); }
    });
  }
  return window.recaptchaVerifier;
};

// 3. Send REAL SMS OTP to Mobile Phone Number
export const sendRealSMSOTP = async (phoneNumber) => {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase API keys missing in client/.env.");
  }
  const appVerifier = setupPhoneRecaptcha('recaptcha-container');
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  } catch (e) {
    resetPhoneRecaptcha();
    throw e;
  }
};

// 4. Verify REAL 6-Digit SMS OTP Code
export const verifyRealSMSOTP = async (otpCode) => {
  if (!window.confirmationResult) {
    throw new Error("No SMS verification session found. Please request OTP code first.");
  }
  const result = await window.confirmationResult.confirm(otpCode);
  const user = result.user;
  const idToken = await user.getIdToken();

  return {
    user: {
      id: user.uid,
      name: user.displayName || `User (${user.phoneNumber.slice(-4)})`,
      phone: user.phoneNumber,
      avatar_url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
      provider: "phone"
    },
    idToken
  };
};
