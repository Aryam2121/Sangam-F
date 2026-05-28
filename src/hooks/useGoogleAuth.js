import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { signInWithGooglePopup, generateFcmToken } from "../config/firebase";
import { googleLogin } from "../services/sangamApi";
import { useAuth } from "../context/AuthContext";
import { homePathForRole } from "../utils/authRedirect";
import { completeAuthSession } from "../utils/completeAuthSession";

export const useGoogleAuth = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { idToken } = await signInWithGooglePopup();
      const fcmToken = await generateFcmToken().catch(() => null);
      const result = await googleLogin({ idToken, fcmToken });

      if (result?.needsRegistration) {
        toast("Complete your profile to finish sign-up", { icon: "ℹ️" });
        navigate("/register", {
          state: {
            google: {
              idToken,
              email: result.email,
              fullName: result.fullName,
              photoURL: result.photoURL,
              firebaseUid: result.firebaseUid,
            },
          },
        });
        return;
      }

      const user = result?.user;
      const accessToken = result?.accessToken;
      if (!user || !accessToken) {
        throw new Error("Invalid Google login response");
      }

      await completeAuthSession({ login, accessToken, user, fcmToken });
      toast.success("Welcome!");
      navigate(homePathForRole(user.role));
    } catch (err) {
      const msg = err?.message || "Google sign-in failed";
      if (msg.includes("popup-closed") || msg.includes("cancelled")) {
        toast.error("Sign-in cancelled");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return { signInWithGoogle, googleLoading: loading };
};
