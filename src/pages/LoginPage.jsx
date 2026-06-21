import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BiEnvelope, BiLock, BiShow, BiHide } from "react-icons/bi";
import photo from "../assets/photoforlogin.png";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { fetchJson } from "../config/api";
import { generateFcmToken, requestPasswordReset } from "../config/firebase";
import AuthLayout, { AuthField, AuthLink } from "../Components/ui/AuthLayout";
import GoogleSignInButton from "../Components/ui/GoogleSignInButton";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { homePathForRole } from "../utils/authRedirect";
import { completeAuthSession } from "../utils/completeAuthSession";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { signInWithGoogle, googleLoading } = useGoogleAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const identifier = formData.email.trim();
      const loginPayload = identifier.includes("@")
        ? { email: identifier, password: formData.password }
        : { username: identifier, password: formData.password };

      const { response, data } = await fetchJson("/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginPayload),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(data?.message || "Incorrect email or password");
      }

      const user = data?.data?.user;

      if (!user) {
        throw new Error("Invalid login response");
      }

      const fcmToken = await generateFcmToken().catch(() => null);
      await completeAuthSession({ login, user, fcmToken });
      toast.success("Welcome back!");
      navigate(homePathForRole(user.role));
    } catch (error) {
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = resetEmail.trim() || formData.email.trim();
    if (!email) {
      toast.error("Enter your email first");
      setShowReset(true);
      return;
    }
    try {
      await requestPasswordReset(email);
      toast.success("Password reset email sent — check your inbox");
      setShowReset(false);
    } catch (err) {
      toast.error(
        err?.message ||
          "Could not send reset email. Use Google sign-in or contact your admin."
      );
    }
  };

  const busy = loading || googleLoading;

  return (
    <AuthLayout
      title="Welcome back"
      kicker="Sign in to Sangam"
      subtitle="Sign in with Google or your email to manage infrastructure projects."
      image={photo}
      imageAlt="Login illustration"
      footer={
        <p className="text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <AuthLink to="/register">Create an account</AuthLink>
        </p>
      }
    >
      {error && (
        <div className="auth-error mb-4" role="alert">
          {error}
        </div>
      )}

      <GoogleSignInButton onClick={signInWithGoogle} disabled={busy} />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider">
          <span className="bg-slate-950 px-3 text-slate-500">or sign in with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
        <AuthField label="Email or username" id="email">
          <div className="relative">
            <BiEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500" />
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="auth-input pl-11"
              placeholder="you@company.com or username"
              autoComplete="username"
              required
            />
          </div>
        </AuthField>

        <AuthField label="Password" id="password">
          <div className="relative">
            <BiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="auth-input pl-11 pr-12"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <BiHide className="text-xl" /> : <BiShow className="text-xl" />}
            </button>
          </div>
        </AuthField>

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-slate-400">
            <input
              type="checkbox"
              className="rounded border-white/20 bg-slate-900 text-cyan-500 focus:ring-cyan-500/30"
            />
            Remember me
          </label>
          <button
            type="button"
            className="text-cyan-300 transition hover:text-cyan-200"
            onClick={() => setShowReset((v) => !v)}
          >
            Forgot password?
          </button>
        </div>

        {showReset && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-2 text-xs text-slate-400">
              We&apos;ll email a reset link (Firebase). Google users can use &quot;Continue with Google&quot;.
            </p>
            <input
              type="email"
              placeholder="your@email.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="auth-input mb-3"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="btn flex-1 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="btn btn-primary flex-1 text-sm"
              >
                Send reset link
              </button>
            </div>
          </div>
        )}

        <button type="submit" disabled={busy} className="auth-btn-primary">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="loading-spinner !h-5 !w-5 !border-2" />
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
