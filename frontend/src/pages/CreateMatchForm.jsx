import { useMemo, useState } from "react";
import api from "../api/axiosInstance";

const SLOTS = {
  SINGLES: ["Player 1", "Player 2"],
  DOUBLES: [
    "Team 1 - Player A",
    "Team 1 - Player B",
    "Team 2 - Player A",
    "Team 2 - Player B",
  ],
};

function emptySelections(type) {
  return Array.from({ length: type === "SINGLES" ? 2 : 4 }, () => ({
    query: "",
    selectedUser: null,
    suggestions: [],
    loading: false,
  }));
}

function userLabel(user) {
  return user?.name?.trim() ? `${user.name} (${user.email})` : user.email;
}

export default function CreateMatchForm({ groupId, onMatchCreated }) {
  const [matchType, setMatchType] = useState("SINGLES");
  const [selections, setSelections] = useState(() =>
    emptySelections("SINGLES"),
  );
  const [teamOneScore, setTeamOneScore] = useState(0);
  const [teamTwoScore, setTeamTwoScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const slotLabels = useMemo(() => SLOTS[matchType], [matchType]);

  const setType = (nextType) => {
    setMatchType(nextType);
    setSelections(emptySelections(nextType));
    setError("");
    setSuccess("");
  };

  const updateSelection = (index, patch) => {
    setSelections((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  };

  const searchMembers = async (index, value) => {
    updateSelection(index, {
      query: value,
      selectedUser: null,
      suggestions: [],
      loading: false,
    });

    const trimmed = value.trim();
    if (!groupId || !trimmed) {
      return;
    }

    updateSelection(index, { loading: true });
    try {
      const { data } = await api.get(`/api/groups/${groupId}/search-members`, {
        params: { query: trimmed },
      });
      updateSelection(index, { suggestions: data, loading: false });
    } catch {
      updateSelection(index, { suggestions: [], loading: false });
    }
  };

  const selectUser = (index, user) => {
    updateSelection(index, {
      query: userLabel(user),
      selectedUser: user,
      suggestions: [],
      loading: false,
    });
  };

  const clearInput = (index) => {
    updateSelection(index, {
      query: "",
      selectedUser: null,
      suggestions: [],
      loading: false,
    });
  };

  const selectedIds = selections
    .map((slot) => slot.selectedUser?.id)
    .filter(Boolean);
  const hasDuplicates = new Set(selectedIds).size !== selectedIds.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!groupId) {
      setError("Please select a group first.");
      return;
    }

    if (selections.some((slot) => !slot.selectedUser)) {
      setError("Select all players from the suggestion list.");
      return;
    }

    if (hasDuplicates) {
      setError("The same player cannot be selected more than once.");
      return;
    }

    const teamOneUserIds =
      matchType === "SINGLES"
        ? [selections[0].selectedUser.id]
        : [selections[0].selectedUser.id, selections[1].selectedUser.id];

    const teamTwoUserIds =
      matchType === "SINGLES"
        ? [selections[1].selectedUser.id]
        : [selections[2].selectedUser.id, selections[3].selectedUser.id];

    setSubmitting(true);
    try {
      await api.post("/api/matches", {
        groupId: Number(groupId),
        matchType,
        teamOneUserIds,
        teamTwoUserIds,
        teamOneScore: Number(teamOneScore),
        teamTwoScore: Number(teamTwoScore),
      });

      setSuccess("Match created successfully!");
      setSelections(emptySelections(matchType));
      setTeamOneScore(0);
      setTeamTwoScore(0);
      onMatchCreated?.();
    } catch (submitError) {
      setError(
        submitError.response?.data?.message || "Failed to create match.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Match Type</p>
        <div className="inline-flex rounded-xl border border-gray-300 p-1 bg-gray-50">
          {["SINGLES", "DOUBLES"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setType(type)}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                matchType === type
                  ? "bg-pickle-green text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {type === "SINGLES" ? "Singles" : "Doubles"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {slotLabels.map((label, index) => {
          const slot = selections[index];
          const typed = slot.query.trim().toLowerCase();
          const filteredSuggestions = slot.suggestions.filter((user) => {
            if (!typed) return true;
            const nameMatch = user.name?.toLowerCase().includes(typed);
            const emailMatch = user.email?.toLowerCase().includes(typed);
            return nameMatch || emailMatch;
          });

          return (
            <div key={label} className="relative">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                {label}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={slot.query}
                  onChange={(event) => searchMembers(index, event.target.value)}
                  placeholder="Search by name or email"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pickle-green focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => clearInput(index)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
                >
                  ✕
                </button>
              </div>

              {slot.loading && (
                <p className="text-xs text-gray-500 mt-1">Searching…</p>
              )}

              {!slot.loading && filteredSuggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  {filteredSuggestions.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => selectUser(index, user)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {userLabel(user)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "Team 1 Score", value: teamOneScore, set: setTeamOneScore },
          { label: "Team 2 Score", value: teamTwoScore, set: setTeamTwoScore },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {label}
            </label>
            <div className="flex items-center gap-0 border border-gray-300 rounded-xl overflow-hidden w-fit">
              <button
                type="button"
                onClick={() => set((v) => Math.max(0, Number(v) - 1))}
                className="px-4 py-2.5 text-lg font-bold text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors select-none"
              >
                −
              </button>
              <span className="w-12 text-center text-lg font-semibold text-gray-800 tabular-nums select-none">
                {value}
              </span>
              <button
                type="button"
                onClick={() => set((v) => Number(v) + 1)}
                className="px-4 py-2.5 text-lg font-bold text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors select-none"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3.5 py-2.5">
          {success}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-pickle-green hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitting ? "Saving…" : "🏓 Start Game"}
        </button>
      </div>
    </form>
  );
}
