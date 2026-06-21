import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { onMessage } from "firebase/messaging";
import { generateFcmToken, getMessagingInstance } from "../config/firebase";
import { useRealtime } from "../hooks/useRealtime";

const AuthenticatedEffects = () => {
  const [, setRealtimeTick] = useState(0);

  useRealtime({
    onNotification: () => setRealtimeTick((n) => n + 1),
    onWorkflowCreated: () => setRealtimeTick((n) => n + 1),
    onAnnouncement: () => setRealtimeTick((n) => n + 1),
  });

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const messaging = await getMessagingInstance();
        await generateFcmToken();
        if (messaging) {
          onMessage(messaging, (payload) => {
            const body = payload?.notification?.body;
            if (body) toast(body, { icon: "🔔" });
          });
        }
      } catch (err) {
        console.warn("Push notifications unavailable:", err?.message || err);
      }
    };

    setupNotifications();
  }, []);

  return null;
};

export default AuthenticatedEffects;
