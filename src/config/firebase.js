import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const getEnv = (key) => import.meta.env[key]?.trim() || "";

let firebaseAppInstance = null;
let authInstance = null;
let messagingInstance = null;

const initFirebaseApp = () => {
  if (firebaseAppInstance) return firebaseAppInstance;

  const apiKey = getEnv("VITE_FIREBASE_API_KEY");
  if (!apiKey) return null;

  firebaseAppInstance = initializeApp({
    apiKey,
    authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: getEnv("VITE_FIREBASE_APP_ID"),
    measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID") || undefined,
  });

  return firebaseAppInstance;
};

const getFirebaseAuth = () => {
  const app = initFirebaseApp();
  if (!app) return null;
  if (!authInstance) authInstance = getAuth(app);
  return authInstance;
};

export const firebaseApp = {
  get value() {
    return initFirebaseApp();
  },
};

export const auth = {
  get currentUser() {
    return getFirebaseAuth()?.currentUser ?? null;
  },
};

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const signInWithGooglePopup = async () => {
  const authClient = getFirebaseAuth();
  if (!authClient) {
    throw new Error("Firebase is not configured. Set VITE_FIREBASE_* in .env");
  }

  const result = await signInWithPopup(authClient, googleProvider);
  const idToken = await result.user.getIdToken();
  return {
    idToken,
    user: result.user,
  };
};

export const firebaseSignOut = () => {
  const authClient = getFirebaseAuth();
  return authClient ? signOut(authClient) : Promise.resolve();
};

export const requestPasswordReset = (email) => {
  const authClient = getFirebaseAuth();
  if (!authClient) {
    return Promise.reject(new Error("Firebase is not configured. Set VITE_FIREBASE_* in .env"));
  }
  return sendPasswordResetEmail(authClient, email.trim());
};

export const getMessagingInstance = async () => {
  if (messagingInstance) return messagingInstance;

  const app = initFirebaseApp();
  if (!app) return null;

  try {
    const supported = await isSupported();
    if (supported && typeof window !== "undefined" && "serviceWorker" in navigator) {
      messagingInstance = getMessaging(app);
    }
  } catch (err) {
    console.warn("Firebase messaging not supported:", err?.message || err);
  }
  return messagingInstance;
};

export const generateFcmToken = async () => {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
  if (!vapidKey) {
    return null;
  }

  const messaging = await getMessagingInstance();
  if (!messaging || typeof Notification === "undefined") return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  try {
    return await getToken(messaging, {
      vapidKey,
    });
  } catch (err) {
    const message = err?.message || String(err);
    if (!/token-subscribe-failed|authentication credential/i.test(message)) {
      console.warn("FCM token unavailable:", message);
    }
    return null;
  }
};
