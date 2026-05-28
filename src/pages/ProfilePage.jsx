import React, { useEffect, useState } from "react";
import { BiLock } from "react-icons/bi";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { changePassword } from "../services/sangamApi";
import PageHeader from "../Components/ui/PageHeader";
import { getUserAvatarUrl } from "../utils/userAvatar";

const ProfilePage = () => {
  const { userData } = useAuth();
  const isGoogleAccount = userData?.authProvider === "google";
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(() => getUserAvatarUrl(userData));

  useEffect(() => {
    setAvatarSrc(getUserAvatarUrl(userData));
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwords.newPassword !== passwords.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });
      toast.success("Password updated successfully");
      setPasswords({ oldPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page pb-10">
      <PageHeader
        kicker="Account"
        title="Profile & security"
        subtitle="View your workspace identity and update your password."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel p-6">
          <div className="flex items-center gap-4">
            <img
              src={avatarSrc}
              alt={userData?.fullName || "Profile"}
              className="h-16 w-16 rounded-2xl border border-white/20 object-cover bg-slate-800"
              referrerPolicy="no-referrer"
              onError={() => setAvatarSrc(getUserAvatarUrl(userData, { skipPhoto: true }))}
            />
            <div>
              <p className="text-lg font-semibold text-white">{userData?.fullName || "User"}</p>
              <p className="text-sm text-slate-400">{userData?.email}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-cyan-200/80">
                {userData?.role || localStorage.getItem("userRole")}
                {userData?.department ? ` · ${userData.department}` : ""}
                {isGoogleAccount ? " · Google" : ""}
              </p>
            </div>
          </div>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <dt className="text-slate-400">Username</dt>
              <dd className="text-slate-100">{userData?.username || "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <dt className="text-slate-400">User ID</dt>
              <dd className="font-mono text-xs text-slate-300">{userData?._id || "—"}</dd>
            </div>
          </dl>
        </div>

        {isGoogleAccount ? (
          <div className="glass-panel p-6 text-sm text-slate-300">
            <h2 className="mb-2 text-lg font-semibold text-white">Password</h2>
            <p>
              This account uses Google sign-in. Use{" "}
              <strong className="text-slate-100">Forgot password</strong> on the login page with your
              Google email, or manage your password in your Google account.
            </p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="glass-panel p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <BiLock className="text-cyan-300" />
            Change password
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Current password
              </label>
              <input
                type="password"
                name="oldPassword"
                value={passwords.oldPassword}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                New password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Confirm new password
              </label>
              <input
                type="password"
                name="confirm"
                value={passwords.confirm}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary mt-6 w-full">
            {saving ? "Updating..." : "Update password"}
          </button>
        </form>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
