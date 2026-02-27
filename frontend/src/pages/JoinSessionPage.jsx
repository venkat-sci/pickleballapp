import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axiosInstance";

export default function JoinSessionPage() {
  const { code: urlCode } = useParams();
  const [code, setCode] = useState((urlCode ?? "").toUpperCase());
  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState("");
  const [loadingSession, setLoadingSession] = useState(false);

  const [playerName, setPlayerName] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joined, setJoined] = useState(false);

  const [participants, setParticipants] = useState([]);

  // Auto-load session when code comes from URL
  useEffect(() => {
    if (urlCode) lookupSession(urlCode.toUpperCase());
  }, [urlCode]); // eslint-disable-line

  const lookupSession = async (lookupCode) => {
    const trimmed = (lookupCode ?? code).trim().toUpperCase();
    if (!trimmed) return;

    setLoadingSession(true);
    setSessionError("");
    setSession(null);
    try {
      const { data } = await api.get(`/api/sessions/${trimmed}`);
      setSession(data);
      loadParticipants(trimmed);
    } catch (err) {
      setSessionError(
        err.response?.status === 404
          ? "Session not found. Check the code and try again."
          : "Could not load session.",
      );
    } finally {
      setLoadingSession(false);
    }
  };

  const loadParticipants = async (lookupCode) => {
    try {
      const { data } = await api.get(
        `/api/sessions/${lookupCode}/participants`,
      );
      setParticipants(data);
    } catch {
      // silent
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setJoinError("Enter your name first.");
      return;
    }
    if (!session) return;

    setJoining(true);
    setJoinError("");
    try {
      await api.post(`/api/sessions/${session.code}/join`, {
        playerName: playerName.trim(),
      });
      setJoined(true);
      loadParticipants(session.code);
    } catch (err) {
      setJoinError(
        err.response?.status === 410
          ? "This session has been closed."
          : "Could not join. Try again.",
      );
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start pt-16 px-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-full bg-pickle-green flex items-center justify-center text-white text-xl select-none">
          🏓
        </div>
        <span className="font-bold text-gray-800 text-xl">
          Pickleball Planner
        </span>
      </div>

      <div className="w-full max-w-sm space-y-5">
        {/* Code lookup */}
        {!session && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h1 className="text-lg font-bold text-gray-800 text-center">
              Join a Session
            </h1>
            <p className="text-sm text-gray-500 text-center">
              Enter the session code from the court organiser
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setSessionError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && lookupSession(code)}
                placeholder="e.g. PCKL-7B2Q"
                maxLength={9}
                className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono font-bold text-gray-800 uppercase placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pickle-green focus:border-transparent tracking-widest"
              />
              <button
                onClick={() => lookupSession(code)}
                disabled={loadingSession || !code.trim()}
                className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-pickle-green hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loadingSession ? "…" : "Find"}
              </button>
            </div>
            {sessionError && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2 text-center">
                {sessionError}
              </p>
            )}
          </div>
        )}

        {/* Session found */}
        {session && !joined && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="text-center space-y-1">
              <div className="text-3xl select-none">🏓</div>
              <h2 className="text-xl font-bold text-gray-800">
                {session.name}
              </h2>
              {session.groupName && (
                <p className="text-sm text-gray-400">{session.groupName}</p>
              )}
              <span
                className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-1 ${
                  session.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {session.status === "ACTIVE" ? "🟢 Open" : "🔴 Closed"}
              </span>
            </div>

            {session.status === "CLOSED" ? (
              <p className="text-sm text-gray-500 text-center">
                This session has been closed by the organiser.
              </p>
            ) : (
              <form onSubmit={handleJoin} className="space-y-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Your name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    setJoinError("");
                  }}
                  placeholder="e.g. Alex"
                  className="w-full px-3.5 py-3 border border-gray-300 rounded-xl text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pickle-green focus:border-transparent transition"
                />
                {joinError && (
                  <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2">
                    {joinError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={joining}
                  className="w-full py-3 text-base font-bold text-white rounded-xl bg-pickle-green hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {joining ? "Joining…" : "✅ Join Session"}
                </button>
              </form>
            )}

            {/* Who's already here */}
            {participants.length > 0 && (
              <div className="pt-2 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Already here ({participants.length})
                </p>
                <ul className="space-y-1.5">
                  {participants.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <div className="w-7 h-7 rounded-full bg-pickle-green flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
                        {p.displayName.charAt(0).toUpperCase()}
                      </div>
                      {p.displayName}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Joined confirmation */}
        {joined && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center space-y-4">
            <div className="text-5xl select-none">🎉</div>
            <h2 className="text-xl font-bold text-gray-800">You're in!</h2>
            <p className="text-sm text-gray-500">
              Welcome to <strong>{session?.name}</strong>
            </p>

            {participants.length > 0 && (
              <div className="text-left space-y-2 pt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Players ({participants.length})
                </p>
                <ul className="space-y-1.5">
                  {participants.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <div className="w-7 h-7 rounded-full bg-pickle-green flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
                        {p.displayName.charAt(0).toUpperCase()}
                      </div>
                      {p.displayName}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-gray-400 pt-2">
              The organiser will use the app to set up matches. Just show up and
              play! 🏓
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
