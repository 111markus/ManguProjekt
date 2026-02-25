import React, { useEffect, useRef } from "react";
import { useGame } from "../context/GameContext";

function Leaderboard() {
  const { state, dispatch, loadScores, getSortedScores, deleteScore } = useGame();
  const tableRef = useRef(null);

  // useEffect — load scores from backend on mount
  useEffect(() => {
    loadScores();
  }, [loadScores]);

  // useRef — scroll table to top when sort changes
  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
  }, [state.sortField, state.sortOrder]);

  const sortedScores = getSortedScores();

  const handleSort = (field) => {
    const newOrder =
      state.sortField === field && state.sortOrder === "desc" ? "asc" : "desc";
    dispatch({ type: "SET_SORT", payload: { field, order: newOrder } });
  };

  const sortIndicator = (field) => {
    if (state.sortField !== field) return "";
    return state.sortOrder === "desc" ? " ▼" : " ▲";
  };

  return (
    <div className="leaderboard-page">
      <div className="lb-header">
        <button
          className="back-btn-lb"
          onClick={() => dispatch({ type: "SET_PAGE", payload: "home" })}
        >
          ← Back
        </button>
        <h1 className="lb-title">
          🏆 LEADER<span className="accent">BOARD</span>
        </h1>
      </div>

      {/* Conditional — loading spinner */}
      {state.loading && (
        <div className="loading-spinner">
          <div className="spinner" />
          <p>Loading scores...</p>
        </div>
      )}

      {/* Conditional — error message */}
      {state.error && (
        <div className="error-msg">
          <p>⚠️ {state.error}</p>
          <button
            className="btn-secondary"
            onClick={() => {
              dispatch({ type: "CLEAR_ERROR" });
              loadScores();
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Conditional — empty state */}
      {!state.loading && !state.error && sortedScores.length === 0 && (
        <div className="empty-state">
          <p className="empty-icon">🎯</p>
          <p>No scores yet. Be the first to play!</p>
          <button
            className="btn-primary"
            onClick={() => dispatch({ type: "SET_PAGE", payload: "home" })}
          >
            Start Training
          </button>
        </div>
      )}

      {/* Scores table */}
      {sortedScores.length > 0 && (
        <div className="lb-table-wrapper" ref={tableRef}>
          <table className="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th onClick={() => handleSort("name")} className="sortable">
                  Player{sortIndicator("name")}
                </th>
                <th onClick={() => handleSort("score")} className="sortable">
                  Score{sortIndicator("score")}
                </th>
                <th onClick={() => handleSort("accuracy")} className="sortable">
                  Accuracy{sortIndicator("accuracy")}
                </th>
                <th>Hits</th>
                <th onClick={() => handleSort("mode")} className="sortable">
                  Mode{sortIndicator("mode")}
                </th>
                <th onClick={() => handleSort("date")} className="sortable">
                  Date{sortIndicator("date")}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Array mapping — render score rows */}
              {sortedScores.map((s, index) => (
                <tr
                  key={s.id}
                  className={index < 3 ? `top-${index + 1}` : ""}
                >
                  <td className="rank">
                    {index === 0 && "🥇"}
                    {index === 1 && "🥈"}
                    {index === 2 && "🥉"}
                    {index > 2 && index + 1}
                  </td>
                  <td className="player-name">{s.name}</td>
                  <td className="score-cell">{s.score}</td>
                  <td>{s.accuracy}%</td>
                  <td>{s.hits}</td>
                  <td className="mode-cell">{s.mode}</td>
                  <td className="date-cell">
                    {new Date(s.date).toLocaleDateString("et-EE")}
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => deleteScore(s.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
