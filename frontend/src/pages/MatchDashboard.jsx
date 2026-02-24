import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosInstance";

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

// Skeleton card shown while data is loading
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse space-y-3">
      <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
      <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
      <div className="h-9 bg-gray-100 rounded-xl" />
    </div>
  );
}

export default function MatchDashboard() {
  const navigate = useNavigate();
  const email = localStorage.getItem("email") ?? "";

  // ── Match list ────────────────────────────────────────────────────────────
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // ── New match form ────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    playerOne: "",
    playerTwo: "",
    matchDate: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  // ── Per-match score state ─────────────────────────────────────────────────
  // { [matchId]: { open: bool, value: string, saving: bool, error: string } }
  const [scoreMap, setScoreMap] = useState({});

  useEffect(() => {
    fetchMatches();
  }, []);

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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.playerOne.trim() || !form.playerTwo.trim() || !form.matchDate) {
      setFormError("All three fields are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await api.post("/api/matches", {
        playerOne: form.playerOne.trim(),
        playerTwo: form.playerTwo.trim(),
        matchDate: `${form.matchDate}T00:00:00`,
      });
      setForm({ playerOne: "", playerTwo: "", matchDate: "" });
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
      await fetchMatches();
    } catch {
      setFormError("Failed to create match.");
    } finally {
      setSubmitting(false);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky navbar ─────────────────────────────────────────────────── */}
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

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* ── New Match form ───────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">
            New Match
          </h2>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "Player 1",
                  name: "playerOne",
                  type: "text",
                  placeholder: "e.g. Alice",
                },
                {
                  label: "Player 2",
                  name: "playerTwo",
                  type: "text",
                  placeholder: "e.g. Bob",
                },
                {
                  label: "Date",
                  name: "matchDate",
                  type: "date",
                  placeholder: "",
                },
              ].map(({ label, name, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {label}
                  </label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[name]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [name]: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pickle-green focus:border-transparent transition"
                  />
                </div>
              ))}
            </div>

            {formError && (
              <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                {formError}
              </p>
            )}
            {formSuccess && (
              <p className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3.5 py-2.5">
                Match added successfully!
              </p>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-pickle-green hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {submitting ? "Adding…" : "+ Add Match"}
              </button>
            </div>
          </form>
        </section>

        {/* ── Match list ───────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              Matches
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

          {/* Loading skeletons */}
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
                return (
                  <div
                    key={match.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4"
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {match.playerOne}
                          <span className="mx-1.5 font-normal text-gray-400 text-sm">
                            vs
                          </span>
                          {match.playerTwo}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(match.matchDate)}
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

                    {/* Score recording */}
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
