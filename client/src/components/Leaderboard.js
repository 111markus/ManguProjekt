import React, { useEffect, useRef } from "react";
import { useGame } from "../context/GameContext";

function Leaderboard() {
  const { state, dispatch, loadScores, getSortedScores, deleteScore } =
    useGame();
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
      {/* Background effects same as home page for consistency */}
      <div className="home-bg-effects">
        <div className="home-glow home-glow-1" />
        <div className="home-glow home-glow-2" />
        <div className="home-glow home-glow-3" />
      </div>
      <div className="home-grid-overlay" />

      <header className="lb-header">
        <button
          className="back-btn-lb"
          onClick={() => dispatch({ type: "SET_PAGE", payload: "home" })}
        >
          ← EXIT
        </button>
        <h1 className="lb-title">
          <span className="lb-title-icon">🏆</span> LEADERBOARD
        </h1>
        
        {/* Search Input — Meeting Requirement: useReducer Filters */}
        <div className="lb-search-wrap">
          <span className="lb-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search player..."
            className="lb-search-input"
            value={state.filterQuery}
            onChange={(e) =>
              dispatch({ type: "SET_FILTER", payload: e.target.value })
            }
          />
        </div>
      </header>

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
                <th className="rank">#</th>
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
                <th onClick={() => handleSort("date")} className="sortable">
                  Date{sortIndicator("date")}
                </th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Array mapping — render score rows */}
              {sortedScores.map((s, index) => (
                <tr key={s.id} className={index < 3 ? `top-${index + 1}` : ""}>
                  <td className="rank">
                    {index === 0 && <span className="rank-medal">🥇</span>}
                    {index === 1 && <span className="rank-medal">🥈</span>}
                    {index === 2 && <span className="rank-medal">🥉</span>}
                    {index > 2 && index + 1}
                  </td>
                  <td className="player-name">{s.name}</td>
                  <td className="score-cell">{s.score}</td>
                  <td className="accuracy-cell">{s.accuracy}%</td>
                  <td className="hits-cell">{s.hits}</td>
                  <td className="date-cell">
                    {new Date(s.date).toLocaleDateString("et-EE")}
                  </td>
                  <td className="actions-cell">
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
