import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCpnRUv4FOfRzZowThODavq6k5ymoiikxQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sangam-d1e5d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sangam-d1e5d",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sangam-d1e5d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "663528087925",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:663528087925:web:d16678c31713dd451f333c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-81JC9PXFJ3",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const signInWithGooglePopup = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return {
    idToken,
    user: result.user,
  };
};

export const firebaseSignOut = () => signOut(auth);

export const requestPasswordReset = (email) =>
  sendPasswordResetEmail(auth, email.trim());

let messagingInstance = null;

export const getMessagingInstance = async () => {
  if (messagingInstance) return messagingInstance;
  try {
    const supported = await isSupported();
    if (supported && typeof window !== "undefined" && "serviceWorker" in navigator) {
      messagingInstance = getMessaging(firebaseApp);
    }
  } catch (err) {
    console.warn("Firebase messaging not supported:", err?.message || err);
  }
  return messagingInstance;
};

export const generateFcmToken = async () => {
  const messaging = await getMessagingInstance();
  if (!messaging || typeof Notification === "undefined") return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  try {
    return await getToken(messaging, {
      vapidKey:
        import.meta.env.VITE_FIREBASE_VAPID_KEY ||
        "BBxI8Dl1gctwWMHzlphfXmu58SVZvMDlyPAXZFhCgAw6fgneqmsdneG-1LDCMakriKdMz99NwVe0Np8e_EFUg8g",
    });
  } catch (err) {
    const message = err?.message || String(err);
    // Expected in local/dev when Web Push auth isn't fully configured.
    if (!/token-subscribe-failed|authentication credential/i.test(message)) {
      console.warn("FCM token unavailable:", message);
    }
    return null;
  }
};
