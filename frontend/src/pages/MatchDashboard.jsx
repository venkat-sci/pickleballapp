import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import api from "../api/axiosInstance";
import CreateMatchForm from "./CreateMatchForm";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse space-y-3">
      <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
      <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
      <div className="h-9 bg-gray-100 rounded-xl" />
    </div>
  );
}

function StepBadge({ number, label, active, done }) {
  return (
    <div
      className={`flex items-center gap-2 ${active || done ? "opacity-100" : "opacity-40"}`}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          done
            ? "bg-pickle-green text-white"
            : active
              ? "bg-pickle-green text-white ring-2 ring-pickle-green/30"
              : "bg-gray-200 text-gray-500"
        }`}
      >
        {done ? "\u2713" : number}
      </div>
      <span
        className={`text-sm font-medium ${active ? "text-gray-800" : "text-gray-500"}`}
      >
        {label}
      </span>
    </div>
  );
}

export default function MatchDashboard() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email") ?? "";

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState("");
  const [createGroupSuccess, setCreateGroupSuccess] = useState("");

  // Members
  const [groupMembers, setGroupMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState("");
  const [addMemberSuccess, setAddMemberSuccess] = useState("");

  const [scoreMap, setScoreMap] = useState({});

  // logged-in user id (for owner checks)
  const userId = localStorage.getItem("userId") ?? "";

  // user search (add member by search)
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchTimerRef = useRef(null);

  // member removal & group deletion
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [deleteGroupError, setDeleteGroupError] = useState("");

  // Sessions
  const [activeSession, setActiveSession] = useState(null);
  const [sessionName, setSessionName] = useState("");
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [closingSession, setClosingSession] = useState(false);

  // Guest player add
  const [guestName, setGuestName] = useState("");
  const [addingGuest, setAddingGuest] = useState(false);
  const [addGuestError, setAddGuestError] = useState("");
  const [addGuestSuccess, setAddGuestSuccess] = useState("");

  const fetchGroupMembers = useCallback(async (gId) => {
    if (!gId) {
      setGroupMembers([]);
      return;
    }
    try {
      setMembersLoading(true);
      const { data } = await api.get(`/api/groups/${gId}/members`);
      setGroupMembers(data);
    } catch {
      setGroupMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    fetchMyGroups();
  }, []);

  useEffect(() => {
    fetchGroupMembers(groupId);
    setAddMemberError("");
    setAddMemberSuccess("");
    // Reset guest/session state when group changes
    setAddGuestError("");
    setAddGuestSuccess("");
    setActiveSession(null);
    setShowQR(false);
    setSessionError("");
  }, [groupId, fetchGroupMembers]);

  const fetchMyGroups = async (preferredGroupId) => {
    try {
      setGroupsLoading(true);
      const { data } = await api.get("/api/groups/my");
      setGroups(data);

      if (data.length === 0) {
        setGroupId("");
        return;
      }

      if (
        preferredGroupId &&
        data.some((group) => String(group.id) === String(preferredGroupId))
      ) {
        setGroupId(String(preferredGroupId));
        return;
      }

      if (
        groupId &&
        data.some((group) => String(group.id) === String(groupId))
      ) {
        setGroupId(String(groupId));
        return;
      }

      setGroupId(String(data[0].id));
    } catch {
      setGroups([]);
      setGroupId("");
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    const groupName = newGroupName.trim();

    if (!groupName) {
      setCreateGroupError("Group name is required.");
      setCreateGroupSuccess("");
      return;
    }

    try {
      setCreatingGroup(true);
      setCreateGroupError("");
      setCreateGroupSuccess("");
      const { data } = await api.post("/api/groups", { name: groupName });
      setNewGroupName("");
      await fetchMyGroups(data.id);
      setCreateGroupSuccess("Group created successfully.");
    } catch {
      setCreateGroupError("Failed to create group.");
      setCreateGroupSuccess("");
    } finally {
      setCreatingGroup(false);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setFetchError("");
      const { data } = await api.get("/api/matches");
      setMatches(data);
    } catch {
      setFetchError("Failed to load matches.");
    } finally {
      setLoading(false);
    }
  };

  const toggleScore = (id) =>
    setScoreMap((prev) => ({
      ...prev,
      [id]: {
        open: !prev[id]?.open,
        value: prev[id]?.value ?? "",
        saving: false,
        error: "",
      },
    }));

  const handleScoreChange = (id, value) =>
    setScoreMap((prev) => ({
      ...prev,
      [id]: { ...prev[id], value, error: "" },
    }));

  const handleScoreSave = async (id) => {
    const score = scoreMap[id]?.value?.trim();
    if (!score) {
      setScoreMap((prev) => ({
        ...prev,
        [id]: { ...prev[id], error: "Enter a score first." },
      }));
      return;
    }

    setScoreMap((prev) => ({ ...prev, [id]: { ...prev[id], saving: true } }));
    try {
      await api.put(`/api/matches/${id}`, { score });
      setScoreMap((prev) => ({
        ...prev,
        [id]: { open: false, value: "", saving: false, error: "" },
      }));
      await fetchMatches();
    } catch {
      setScoreMap((prev) => ({
        ...prev,
        [id]: { ...prev[id], saving: false, error: "Save failed." },
      }));
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    const em = memberEmail.trim();
    if (!em) {
      setAddMemberError("Enter a valid email.");
      return;
    }
    if (!groupId) {
      setAddMemberError("Select a group first.");
      return;
    }
    try {
      setAddingMember(true);
      setAddMemberError("");
      setAddMemberSuccess("");
      await api.post(`/api/groups/${groupId}/add-member`, { email: em });
      setMemberEmail("");
      setAddMemberSuccess(`${em} added to the group!`);
      await fetchGroupMembers(groupId);
    } catch (err) {
      setAddMemberError(
        err.response?.status === 404
          ? "No user found with that email."
          : "Failed to add member.",
      );
    } finally {
      setAddingMember(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId) return;
    if (!window.confirm("Delete this group? This cannot be undone.")) return;
    try {
      setDeletingGroup(true);
      setDeleteGroupError("");
      await api.delete(`/api/groups/${groupId}`);
      setGroupId("");
      setGroups((prev) => prev.filter((g) => String(g.id) !== String(groupId)));
      setGroupMembers([]);
    } catch {
      setDeleteGroupError("Failed to delete group.");
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!groupId) return;
    try {
      setRemovingMemberId(memberId);
      await api.delete(`/api/groups/${groupId}/members/${memberId}`);
      await fetchGroupMembers(groupId);
    } catch {
      // silent failure — members list stays as-is
    } finally {
      setRemovingMemberId(null);
    }
  };

  const runUserSearch = useCallback(async (query) => {
    try {
      setUserSearchLoading(true);
      const { data } = await api.get(
        `/api/user/search?query=${encodeURIComponent(query)}`,
      );
      setUserSearchResults(data);
      setSearchDropdownOpen(data.length > 0);
    } catch {
      setUserSearchResults([]);
      setSearchDropdownOpen(false);
    } finally {
      setUserSearchLoading(false);
    }
  }, []);

  const handleUserSearchInput = (query) => {
    setUserSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (query.length < 2) {
      setUserSearchResults([]);
      setSearchDropdownOpen(false);
      return;
    }
    searchTimerRef.current = setTimeout(() => runUserSearch(query), 300);
  };

  const handleAddBySearch = async (user) => {
    setSearchDropdownOpen(false);
    setUserSearchQuery("");
    setUserSearchResults([]);
    if (!groupId) return;
    try {
      setAddMemberError("");
      setAddMemberSuccess("");
      await api.post(`/api/groups/${groupId}/add-member`, {
        email: user.email,
      });
      setAddMemberSuccess(`${user.name || user.email} added!`);
      await fetchGroupMembers(groupId);
    } catch (err) {
      setAddMemberError(
        err.response?.status === 404
          ? "User not found."
          : err.response?.status === 409
            ? "User is already a member."
            : "Failed to add member.",
      );
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!groupId) return;
    const name = sessionName.trim() || selectedGroup?.name || "Court Session";
    setSessionLoading(true);
    setSessionError("");
    try {
      const { data } = await api.post("/api/sessions", {
        name,
        groupId: Number(groupId),
      });
      setActiveSession(data);
      setSessionName("");
      setShowQR(true);
    } catch {
      setSessionError("Could not create session. Try again.");
    } finally {
      setSessionLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    setClosingSession(true);
    try {
      await api.put(`/api/sessions/${activeSession.code}/close`);
      setActiveSession(null);
      setShowQR(false);
    } catch {
      // ignore
    } finally {
      setClosingSession(false);
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    const name = guestName.trim();
    if (!name || !groupId) return;
    setAddingGuest(true);
    setAddGuestError("");
    setAddGuestSuccess("");
    try {
      await api.post(`/api/groups/${groupId}/add-guest`, { displayName: name });
      setGuestName("");
      setAddGuestSuccess(`${name} added as a guest player!`);
      await fetchGroupMembers(groupId);
    } catch (err) {
      setAddGuestError(err.response?.data?.message || "Could not add guest.");
    } finally {
      setAddingGuest(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  const selectedGroup = groups.find((g) => String(g.id) === String(groupId));
  const hasGroup = !!selectedGroup;
  const hasEnoughMembers = groupMembers.length >= 2;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-pickle-green flex items-center justify-center text-white text-sm select-none">
              🏓
            </div>
            <span className="font-bold text-gray-800 text-lg">
              Pickleball Planner
            </span>
          </div>
          <div className="flex items-center gap-3">
            {email && (
              <span className="hidden sm:block text-sm text-gray-500 truncate max-w-48">
                {email}
              </span>
            )}
            <Link
              to="/profile"
              title="Account settings"
              className="w-8 h-8 rounded-full bg-pickle-green flex items-center justify-center text-white text-sm font-bold hover:opacity-80 transition-opacity select-none"
            >
              {(email || "?").charAt(0).toUpperCase()}
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm px-3.5 py-1.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Progress steps */}
        <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 px-6 py-4 shadow-sm flex-wrap sm:flex-nowrap">
          <StepBadge
            number="1"
            label="Create / select group"
            active={!hasGroup}
            done={hasGroup}
          />
          <div className="hidden sm:block h-px flex-1 bg-gray-200" />
          <StepBadge
            number="2"
            label="Add members"
            active={hasGroup && !hasEnoughMembers}
            done={hasGroup && hasEnoughMembers}
          />
          <div className="hidden sm:block h-px flex-1 bg-gray-200" />
          <StepBadge
            number="3"
            label="Create a match"
            active={hasGroup && hasEnoughMembers}
            done={false}
          />
        </div>

        {/* Step 1: Group */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-800">
            Step 1 &#8212; Group
          </h2>
          <form onSubmit={handleCreateGroup} className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Create new group
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => {
                  setNewGroupName(e.target.value);
                  if (createGroupError) setCreateGroupError("");
                  if (createGroupSuccess) setCreateGroupSuccess("");
                }}
                placeholder="e.g. Tuesday Morning Crew"
                className="w-full sm:w-80 px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pickle-green focus:border-transparent transition"
              />
              <button
                type="submit"
                disabled={creatingGroup}
                className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-pickle-green hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {creatingGroup ? "Creating\u2026" : "+ Create"}
              </button>
            </div>
            {createGroupError && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2">
                {createGroupError}
              </p>
            )}
            {createGroupSuccess && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3.5 py-2">
                {createGroupSuccess}
              </p>
            )}
          </form>
          {!groupsLoading && groups.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Active group
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full sm:w-72 px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pickle-green focus:border-transparent transition"
              >
                {groups.map((g) => (
                  <option key={g.id} value={String(g.id)}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {groupsLoading && (
            <p className="text-sm text-gray-400 animate-pulse">
              Loading your groups&hellip;
            </p>
          )}
          {!groupsLoading &&
            selectedGroup &&
            String(selectedGroup.createdById) === userId && (
              <div className="pt-1 space-y-2">
                <button
                  onClick={handleDeleteGroup}
                  disabled={deletingGroup}
                  className="text-sm text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl disabled:opacity-50 transition-colors"
                >
                  {deletingGroup
                    ? "Deleting\u2026"
                    : "\uD83D\uDDD1 Delete Group"}
                </button>
                {deleteGroupError && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2">
                    {deleteGroupError}
                  </p>
                )}
              </div>
            )}
        </section>

        {/* Session Panel — start a live session with a join code + QR */}
        {hasGroup && (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">
                🏓 Live Session
              </h2>
              <span className="text-xs text-gray-400">
                Share a code so players can join without registering
              </span>
            </div>

            {!activeSession ? (
              <form onSubmit={handleCreateSession} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder={
                      selectedGroup?.name
                        ? `e.g. ${selectedGroup.name}`
                        : "e.g. Tuesday Night Courts"
                    }
                    className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pickle-green focus:border-transparent transition"
                  />
                  <button
                    type="submit"
                    disabled={sessionLoading}
                    className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-pickle-green hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
                  >
                    {sessionLoading ? "Starting…" : "▶ Start Session"}
                  </button>
                </div>
                {sessionError && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2">
                    {sessionError}
                  </p>
                )}
              </form>
            ) : (
              <div className="space-y-4">
                {/* Active session info */}
                <div className="flex items-start justify-between gap-4 bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                      🟢 Session Active
                    </p>
                    <p className="font-bold text-gray-800 text-lg">
                      {activeSession.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Share this code:&nbsp;
                      <span className="font-mono font-bold text-gray-800 tracking-widest text-base">
                        {activeSession.code}
                      </span>
                    </p>
                    <a
                      href={`/join/${activeSession.code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-pickle-green underline underline-offset-2"
                    >
                      🔗 Open join link
                    </a>
                  </div>
                  <button
                    onClick={() => setShowQR((v) => !v)}
                    className="shrink-0 px-3 py-1.5 text-xs font-semibold border border-green-300 text-green-700 rounded-xl hover:bg-green-100 transition-colors"
                  >
                    {showQR ? "Hide QR" : "📷 Show QR"}
                  </button>
                </div>

                {/* QR code */}
                {showQR && (
                  <div className="flex flex-col items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl">
                    <QRCodeSVG
                      value={`${window.location.origin}/join/${activeSession.code}`}
                      size={180}
                      bgColor="#ffffff"
                      fgColor="#1a6b3a"
                      level="M"
                    />
                    <p className="text-xs text-gray-400 text-center">
                      Players scan this to join without registering
                    </p>
                  </div>
                )}

                <button
                  onClick={handleCloseSession}
                  disabled={closingSession}
                  className="text-sm text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl disabled:opacity-50 transition-colors"
                >
                  {closingSession ? "Closing…" : "🔴 End Session"}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Step 2: Members */}
        {hasGroup && (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">
                Step 2 &#8212; Members of{" "}
                <span className="text-pickle-green">{selectedGroup.name}</span>
              </h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {groupMembers.length} member
                {groupMembers.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Search all users */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Search &amp; add player
              </label>
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => handleUserSearchInput(e.target.value)}
                  onBlur={() =>
                    setTimeout(() => setSearchDropdownOpen(false), 150)
                  }
                  placeholder="Name or email\u2026"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pickle-green focus:border-transparent transition"
                />
                {userSearchLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-pulse">
                    Searching\u2026
                  </span>
                )}
                {searchDropdownOpen && userSearchResults.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {userSearchResults.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          onMouseDown={() => handleAddBySearch(u)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-pickle-green flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
                            {(u.name || u.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            {u.name && (
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {u.name}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 truncate">
                              {u.email}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {searchDropdownOpen &&
                  userSearchResults.length === 0 &&
                  !userSearchLoading && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
                      <p className="text-sm text-gray-400">No users found.</p>
                    </div>
                  )}
              </div>
            </div>

            {/* Add by email (fallback) */}
            <form onSubmit={handleAddMember} className="space-y-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Or add by email
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => {
                    setMemberEmail(e.target.value);
                    if (addMemberError) setAddMemberError("");
                    if (addMemberSuccess) setAddMemberSuccess("");
                  }}
                  placeholder="member@example.com"
                  className="w-full sm:w-80 px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pickle-green focus:border-transparent transition"
                />
                <button
                  type="submit"
                  disabled={addingMember}
                  className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-pickle-green hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {addingMember ? "Adding\u2026" : "+ Add"}
                </button>
              </div>
              {addMemberError && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2">
                  {addMemberError}
                </p>
              )}
              {addMemberSuccess && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3.5 py-2">
                  {addMemberSuccess}
                </p>
              )}
            </form>

            {/* Add guest player (name only — no registration) */}
            <form onSubmit={handleAddGuest} className="space-y-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Add Guest Player{" "}
                <span className="normal-case font-normal">
                  (name only, no account needed)
                </span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    if (addGuestError) setAddGuestError("");
                    if (addGuestSuccess) setAddGuestSuccess("");
                  }}
                  placeholder="Guest's name…"
                  className="w-full sm:w-80 px-3.5 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pickle-green focus:border-transparent transition bg-gray-50"
                />
                <button
                  type="submit"
                  disabled={addingGuest}
                  className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-pickle-green hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {addingGuest ? "Adding…" : "+ Add Guest"}
                </button>
              </div>
              {addGuestError && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2">
                  {addGuestError}
                </p>
              )}
              {addGuestSuccess && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3.5 py-2">
                  {addGuestSuccess}
                </p>
              )}
            </form>

            {/* Member list */}
            {membersLoading ? (
              <p className="text-sm text-gray-400 animate-pulse">
                Loading members\u2026
              </p>
            ) : groupMembers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center">
                <p className="text-sm text-gray-500">
                  No members yet. Add at least 2 players to unlock match
                  creation.
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {groupMembers.map((member) => {
                  const isGuest =
                    member.guest ||
                    (member.email || "").endsWith("@pickleball.local");
                  return (
                    <li
                      key={member.id}
                      className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 select-none ${isGuest ? "bg-amber-400" : "bg-pickle-green"}`}
                      >
                        {(member.name || member.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {member.name || member.email}
                          </p>
                          {isGuest && (
                            <span className="shrink-0 text-xs bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full">
                              Guest
                            </span>
                          )}
                        </div>
                        {!isGuest && (
                          <p className="text-xs text-gray-400 truncate">
                            {member.email}
                          </p>
                        )}
                      </div>
                      {(String(selectedGroup.createdById) === userId ||
                        String(member.id) === userId ||
                        isGuest) && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={removingMemberId === member.id}
                          title="Remove member"
                          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                        >
                          {removingMemberId === member.id ? (
                            <span className="text-xs animate-pulse">⋯</span>
                          ) : (
                            <span className="text-xs">✕</span>
                          )}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {!hasEnoughMembers && groupMembers.length > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2">
                Add {2 - groupMembers.length} more member
                {2 - groupMembers.length !== 1 ? "s" : ""} to unlock match
                creation.
              </p>
            )}
          </section>
        )}

        {/* Step 3: Create match */}
        {hasGroup && hasEnoughMembers && (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-5">
              Step 3 &#8212; New Match in{" "}
              <span className="text-pickle-green">{selectedGroup.name}</span>
            </h2>
            <CreateMatchForm groupId={groupId} onMatchCreated={fetchMatches} />
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              Match History
              {!loading && (
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {matches.length}
                </span>
              )}
            </h2>
            <button
              onClick={fetchMatches}
              className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : fetchError ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-700">
              {fetchError}
            </div>
          ) : matches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-3 select-none">🏓</div>
              <p className="text-gray-500 text-sm">
                No matches yet. Create your first one above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matches.map((match) => {
                const state = scoreMap[match.id] ?? {};
                const teamOneNames = (match.teamOne ?? [])
                  .map((user) => user?.name?.trim() || user?.email)
                  .filter(Boolean)
                  .join(" / ");
                const teamTwoNames = (match.teamTwo ?? [])
                  .map((user) => user?.name?.trim() || user?.email)
                  .filter(Boolean)
                  .join(" / ");

                return (
                  <div
                    key={match.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {teamOneNames || "Team 1"}
                          <span className="mx-1.5 font-normal text-gray-400 text-sm">
                            vs
                          </span>
                          {teamTwoNames || "Team 2"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(match.matchDate)}
                          {match.matchType && ` • ${match.matchType}`}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          match.score
                            ? "bg-pickle-green text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {match.score ?? "No score"}
                      </span>
                    </div>

                    {!state.open ? (
                      <button
                        onClick={() => toggleScore(match.id)}
                        className="w-full py-2 text-sm font-medium border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Record Score
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            type="text"
                            placeholder="e.g. 11-7"
                            value={state.value ?? ""}
                            onChange={(e) =>
                              handleScoreChange(match.id, e.target.value)
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleScoreSave(match.id)
                            }
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pickle-green focus:border-transparent transition"
                          />
                          <button
                            onClick={() => handleScoreSave(match.id)}
                            disabled={state.saving}
                            className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-pickle-green hover:opacity-90 disabled:opacity-50 transition-opacity"
                          >
                            {state.saving ? "…" : "Save"}
                          </button>
                          <button
                            onClick={() => toggleScore(match.id)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                        {state.error && (
                          <p className="text-xs text-red-600 pl-0.5">
                            {state.error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
