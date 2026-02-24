import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosInstance";

function Avatar({ photoUrl, name, email, size = "lg" }) {
  const initials = (name || email || "?").trim().charAt(0).toUpperCase();
  const sizeClass = size === "lg" ? "w-20 h-20 text-2xl" : "w-8 h-8 text-sm";

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt="Profile"
        className={`${sizeClass} rounded-full object-cover border-2 border-gray-200`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-full bg-pickle-green flex items-center justify-center text-white font-bold select-none`}
    >
      {initials}
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState("");

  // ── Profile form ──────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ name: "", photoUrl: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  // ── Password form ─────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    api
      .get("/api/user/profile")
      .then(({ data }) => {
        setProfile(data);
        setProfileForm({
          name: data.name ?? "",
          photoUrl: data.photoUrl ?? "",
        });
      })
      .catch(() => setLoadError("Failed to load profile."));
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess(false);
    try {
      const { data } = await api.put("/api/user/profile", {
        name: profileForm.name.trim() || null,
        photoUrl: profileForm.photoUrl.trim() || null,
      });
      setProfile(data);
      // Keep localStorage email display consistent (name isn't stored there, but email is)
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setProfileError("Failed to save profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }

    setPwSaving(true);
    try {
      await api.put("/api/user/password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(err.response?.data?.error ?? "Failed to change password.");
    } finally {
      setPwSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600 text-sm">{loadError}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-pickle-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Dashboard
          </Link>
          <span className="font-bold text-gray-800">Account Settings</span>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* ── Profile card ──────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-6">
            Profile
          </h2>

          {/* Avatar preview */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar
              photoUrl={profileForm.photoUrl || profile.photoUrl}
              name={profileForm.name || profile.name}
              email={profile.email}
              size="lg"
            />
            <div>
              <p className="font-semibold text-gray-800">
                {profile.name || profile.email}
              </p>
              <p className="text-sm text-gray-500">{profile.role}</p>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pickle-green focus:border-transparent transition"
              />
            </div>

            {/* Email — read-only */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Email
                <span className="ml-2 font-normal normal-case text-gray-400">
                  (cannot be changed)
                </span>
              </label>
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
              />
            </div>

            {/* Photo URL */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Photo URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={profileForm.photoUrl}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    photoUrl: e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pickle-green focus:border-transparent transition"
              />
              <p className="mt-1.5 text-xs text-gray-400">
                Paste a public image URL. Leave blank to use your initials.
              </p>
            </div>

            {profileError && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                {profileError}
              </p>
            )}
            {profileSuccess && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3.5 py-2.5">
                Profile saved.
              </p>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-pickle-green hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {profileSaving ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </form>
        </section>

        {/* ── Change password card ───────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-6">
            Change Password
          </h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={pwForm.currentPassword}
                onChange={(e) =>
                  setPwForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pickle-green focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={pwForm.newPassword}
                onChange={(e) =>
                  setPwForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pickle-green focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={pwForm.confirmPassword}
                onChange={(e) =>
                  setPwForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pickle-green focus:border-transparent transition"
              />
            </div>

            {pwError && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                {pwError}
              </p>
            )}
            {pwSuccess && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3.5 py-2.5">
                Password changed successfully.
              </p>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={pwSaving}
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-pickle-green hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {pwSaving ? "Updating…" : "Change Password"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
