import React, {
  createContext,
  useReducer,
  useContext,
  useCallback,
} from "react";
import { database } from "../firebase";
import { ref, push, get, remove, child } from "firebase/database";

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
  filterQuery: "", // New State for searching
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
    case "SET_FILTER":
      return { ...state, filterQuery: action.payload };
    default:
      return state;
  }
}

// ─── Context ───
const GameContext = createContext(null);

// ─── Provider ───
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Fetch scores from Firebase
  const loadScores = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, "scores"));
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Convert object to array with IDs
        const scoresArray = Object.entries(data).map(([id, score]) => ({
          id,
          ...score,
        }));
        dispatch({ type: "SET_SCORES", payload: scoresArray });
      } else {
        dispatch({ type: "SET_SCORES", payload: [] });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, []);

  // Save score to Firebase
  const saveScore = useCallback(
    async (scoreData) => {
      try {
        const scoresRef = ref(database, "scores");
        const newScore = {
          name: state.playerName || "Anonymous",
          ...scoreData,
          date: new Date().toISOString(),
        };
        const newRef = await push(scoresRef, newScore);
        const savedScore = { id: newRef.key, ...newScore };
        dispatch({ type: "ADD_SCORE", payload: savedScore });
        return savedScore;
      } catch (err) {
        dispatch({ type: "SET_ERROR", payload: err.message });
        return null;
      }
    },
    [state.playerName],
  );

  // Delete a score from Firebase
  const deleteScore = useCallback(async (id) => {
    try {
      const scoreRef = ref(database, `scores/${id}`);
      await remove(scoreRef);
      // Reload scores after deletion
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, "scores"));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const scoresArray = Object.entries(data).map(([id, score]) => ({
          id,
          ...score,
        }));
        dispatch({ type: "SET_SCORES", payload: scoresArray });
      } else {
        dispatch({ type: "SET_SCORES", payload: [] });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, []);

  // Derived: sorted & filtered scores
  const getSortedScores = useCallback(() => {
    let filtered = [...state.scores];

    // Apply Filter
    if (state.filterQuery.trim()) {
      const q = state.filterQuery.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(q));
    }

    // Apply Sort
    filtered.sort((a, b) => {
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
    return filtered;
  }, [state.scores, state.sortField, state.sortOrder, state.filterQuery]);

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
