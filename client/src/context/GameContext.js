import React, {
  createContext,
  useReducer,
  useContext,
  useCallback,
} from "react";

// ─── Initial State ───
const initialState = {
  playerName: "",
  scores: [],
  loading: false,
  error: null,
  currentPage: "home", // home | game | leaderboard
  gameSettings: {
    mode: "classic", // classic | precision | speed
    duration: 30, // seconds
    ballSpeed: "normal", // slow | normal | fast
  },
  sortField: "score",
  sortOrder: "desc",
};

// ─── Reducer ───
function gameReducer(state, action) {
  switch (action.type) {
    case "SET_PLAYER_NAME":
      return { ...state, playerName: action.payload };
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_SCORES":
      return { ...state, scores: action.payload, loading: false, error: null };
    case "ADD_SCORE":
      return { ...state, scores: [action.payload, ...state.scores] };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "SET_GAME_SETTINGS":
      return {
        ...state,
        gameSettings: { ...state.gameSettings, ...action.payload },
      };
    case "SET_SORT":
      return {
        ...state,
        sortField: action.payload.field,
        sortOrder: action.payload.order,
      };
    default:
      return state;
  }
}

// ─── Context ───
const GameContext = createContext(null);

// ─── Provider ───
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Fetch scores from backend
  const loadScores = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await fetch("/api/scores");
      if (!res.ok) throw new Error("Failed to load scores");
      const data = await res.json();
      dispatch({ type: "SET_SCORES", payload: data });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, []);

  // Save score to backend
  const saveScore = useCallback(
    async (scoreData) => {
      try {
        const res = await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: state.playerName || "Anonymous",
            ...scoreData,
          }),
        });
        if (!res.ok) throw new Error("Failed to save score");
        const saved = await res.json();
        dispatch({ type: "ADD_SCORE", payload: saved });
        return saved;
      } catch (err) {
        dispatch({ type: "SET_ERROR", payload: err.message });
        return null;
      }
    },
    [state.playerName],
  );

  // Delete a score
  const deleteScore = useCallback(async (id) => {
    try {
      await fetch(`/api/scores/${id}`, { method: "DELETE" });
      // Reload
      const res = await fetch("/api/scores");
      const data = await res.json();
      dispatch({ type: "SET_SCORES", payload: data });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, []);

  // Derived: sorted scores
  const getSortedScores = useCallback(() => {
    const sorted = [...state.scores];
    sorted.sort((a, b) => {
      const dir = state.sortOrder === "asc" ? 1 : -1;
      if (state.sortField === "date") {
        return (new Date(a.date) - new Date(b.date)) * dir;
      }
      if (typeof a[state.sortField] === "number") {
        return (a[state.sortField] - b[state.sortField]) * dir;
      }
      return (
        String(a[state.sortField] || "").localeCompare(
          String(b[state.sortField] || ""),
        ) * dir
      );
    });
    return sorted;
  }, [state.scores, state.sortField, state.sortOrder]);

  const value = {
    state,
    dispatch,
    loadScores,
    saveScore,
    deleteScore,
    getSortedScores,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// ─── Hook ───
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
