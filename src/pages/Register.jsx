import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BiUser,
  BiEnvelope,
  BiLock,
  BiBuilding,
  BiIdCard,
  BiShow,
  BiHide,
} from "react-icons/bi";
import photo from "../assets/register.png";
import toast from "react-hot-toast";
import { buildApiUrl } from "../config/api";
import AuthLayout, { AuthField, AuthLink } from "../Components/ui/AuthLayout";
import GoogleSignInButton from "../Components/ui/GoogleSignInButton";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { useAuth } from "../context/AuthContext";
import { googleRegister } from "../services/sangamApi";
import { homePathForRole } from "../utils/authRedirect";
import { completeAuthSession } from "../utils/completeAuthSession";
import { generateFcmToken } from "../config/firebase";

const DEPARTMENTS = ["Water", "Gas", "Road Construction"];
const ROLES = [
  { value: "Main Admin", label: "Admin" },
  { value: "Officer", label: "Officer" },
  { value: "Worker", label: "Worker" },
];

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { signInWithGoogle, googleLoading } = useGoogleAuth();
  const googlePrefill = location.state?.google;
  const isGoogleSignup = Boolean(googlePrefill?.idToken);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
    role: "",
    department: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (googlePrefill) {
      setFormData((prev) => ({
        ...prev,
        email: googlePrefill.email || prev.email,
        fullName: googlePrefill.fullName || prev.fullName,
      }));
    }
  }, [googlePrefill]);

  const isMainAdmin = formData.role === "Main Admin";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "role" && value === "Main Admin" ? { department: "" } : {}),
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isGoogleSignup) {
        if (!formData.role) {
          throw new Error("Please select a role");
        }
        const fcmToken = await generateFcmToken().catch(() => null);
        const result = await googleRegister({
          idToken: googlePrefill.idToken,
          role: formData.role,
          department: isMainAdmin ? undefined : formData.department,
          username: formData.username.trim() || undefined,
          fullName: formData.fullName.trim(),
          fcmToken,
        });
        const user = result?.user;
        const accessToken = result?.accessToken;
        if (!user || !accessToken) {
          throw new Error("Registration succeeded but login failed");
        }
        await completeAuthSession({ login, accessToken, user, fcmToken });
        toast.success("Welcome to Sangam!");
        navigate(homePathForRole(user.role));
        return;
      }

      const payload = {
        ...formData,
        department: isMainAdmin ? undefined : formData.department,
      };

      const response = await axios.post(buildApiUrl("/admin/register"), payload);

      if (response.status === 201) {
        toast.success("Account created! Please sign in.");
        navigate("/login");
      }
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Registration failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputWithIcon = (Icon, props) => (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500" />
      <input {...props} className={`auth-input pl-11 ${props.className || ""}`} />
    </div>
  );

  const busy = loading || googleLoading;

  return (
    <AuthLayout
      title={isGoogleSignup ? "Finish Google sign-up" : "Create your account"}
      kicker={isGoogleSignup ? "Almost there" : "Create Sangam account"}
      subtitle={
        isGoogleSignup
          ? "Choose your role and department to complete your Sangam workspace."
          : "Join Sangam with email or Google."
      }
      image={photo}
      imageAlt="Register illustration"
      reverse
      footer={
        <p className="text-center text-sm text-slate-400">
          Already have an account? <AuthLink to="/login">Sign in</AuthLink>
        </p>
      }
    >
      {!isGoogleSignup && (
        <>
          <GoogleSignInButton onClick={signInWithGoogle} disabled={busy} label="Sign up with Google" />
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-slate-950 px-3 text-slate-500">or email</span>
            </div>
          </div>
        </>
      )}

      {isGoogleSignup && googlePrefill?.photoURL && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3">
          <img
            src={googlePrefill.photoURL}
            alt=""
            className="h-12 w-12 rounded-full border border-white/20"
          />
          <div>
            <p className="text-sm font-medium text-white">{googlePrefill.fullName}</p>
            <p className="text-xs text-slate-400">{googlePrefill.email}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4 max-w-md">
        {error && <div className="auth-error">{error}</div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthField label="Full name" id="fullName">
            {inputWithIcon(BiUser, {
              type: "text",
              id: "fullName",
              name: "fullName",
              value: formData.fullName,
              onChange: handleChange,
              placeholder: "Your full name",
              required: true,
              readOnly: isGoogleSignup,
            })}
          </AuthField>

          <AuthField label="Username" id="username" hint={isGoogleSignup ? "Optional — auto-generated if empty" : undefined}>
            {inputWithIcon(BiIdCard, {
              type: "text",
              id: "username",
              name: "username",
              value: formData.username,
              onChange: handleChange,
              placeholder: "Choose a username",
              required: !isGoogleSignup,
            })}
          </AuthField>

          <AuthField label="Email" id="email">
            {inputWithIcon(BiEnvelope, {
              type: "email",
              id: "email",
              name: "email",
              value: formData.email,
              onChange: handleChange,
              placeholder: "you@company.com",
              required: true,
              readOnly: isGoogleSignup,
            })}
          </AuthField>

          {!isGoogleSignup && (
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
                  placeholder="Min. 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
                >
                  {showPassword ? <BiHide className="text-xl" /> : <BiShow className="text-xl" />}
                </button>
              </div>
            </AuthField>
          )}

          <AuthField label="Role" id="role">
            <div className="relative">
              <BiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500" />
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="auth-input pl-11"
                required
              >
                <option value="">Select role</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </AuthField>

          <AuthField
            label="Department"
            id="department"
            hint={isMainAdmin ? "Not required for admin accounts" : undefined}
          >
            <div className="relative">
              <BiBuilding className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500" />
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={isMainAdmin}
                className="auth-input pl-11 disabled:cursor-not-allowed disabled:opacity-50"
                required={!isMainAdmin}
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </AuthField>
        </div>

        <button type="submit" disabled={busy} className="auth-btn-primary mt-2">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="loading-spinner !h-5 !w-5 !border-2" />
              {isGoogleSignup ? "Finishing..." : "Creating account..."}
            </span>
          ) : isGoogleSignup ? (
            "Complete sign-up"
          ) : (
            "Create account"
          )}
        </button>

        <button type="button" onClick={() => navigate("/login")} className="auth-btn-secondary">
          Back to sign in
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;
