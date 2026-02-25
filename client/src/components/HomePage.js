import React, { useRef, useEffect } from "react";
import { useGame } from "../context/GameContext";

function HomePage() {
  const { state, dispatch } = useGame();
  const nameInputRef = useRef(null);

  // useRef + useEffect — autofocus the name input
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const handleStart = () => {
    if (!state.playerName.trim()) {
      nameInputRef.current?.focus();
      return;
    }
    dispatch({ type: "SET_PAGE", payload: "game" });
  };

  const modes = [
    {
      id: "classic",
      title: "Classic",
      desc: "Shoot as many balls as possible in 30 seconds",
      icon: "🎯",
    },
    {
      id: "precision",
      title: "Precision",
      desc: "Smaller targets, higher points. Accuracy matters!",
      icon: "🔬",
    },
    {
      id: "speed",
      title: "Speed",
      desc: "Balls move fast and disappear quickly",
      icon: "⚡",
    },
  ];

  const durations = [15, 30, 45, 60];

  return (
    <div className="home-page">
      <div className="hero">
        <div className="hero-glow" />
        <h1 className="hero-title">
          AIM<span className="accent">TRAINER</span>
          <span className="hero-3d">3D</span>
        </h1>
        <p className="hero-sub">Train your aim in a 3D environment</p>
      </div>

      <div className="home-content">
        {/* Player Name */}
        <div className="card name-card">
          <h2>👤 Player Name</h2>
          <input
            ref={nameInputRef}
            type="text"
            placeholder="Enter your name..."
            className="name-input"
            value={state.playerName}
            onChange={(e) =>
              dispatch({ type: "SET_PLAYER_NAME", payload: e.target.value })
            }
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            maxLength={20}
          />
        </div>

        {/* Game Mode — array mapping */}
        <div className="card mode-card">
          <h2>🎮 Game Mode</h2>
          <div className="mode-grid">
            {modes.map((mode) => (
              <button
                key={mode.id}
                className={`mode-btn ${
                  state.gameSettings.mode === mode.id ? "active" : ""
                }`}
                onClick={() =>
                  dispatch({
                    type: "SET_GAME_SETTINGS",
                    payload: { mode: mode.id },
                  })
                }
              >
                <span className="mode-icon">{mode.icon}</span>
                <span className="mode-title">{mode.title}</span>
                <span className="mode-desc">{mode.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="card duration-card">
          <h2>⏱️ Duration</h2>
          <div className="duration-row">
            {durations.map((d) => (
              <button
                key={d}
                className={`dur-btn ${
                  state.gameSettings.duration === d ? "active" : ""
                }`}
                onClick={() =>
                  dispatch({
                    type: "SET_GAME_SETTINGS",
                    payload: { duration: d },
                  })
                }
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="home-actions">
          <button className="btn-primary btn-play" onClick={handleStart}>
            ▶ START TRAINING
          </button>
          <button
            className="btn-secondary"
            onClick={() => dispatch({ type: "SET_PAGE", payload: "leaderboard" })}
          >
            🏆 Leaderboard
          </button>
        </div>

        {/* Conditional — show warning if no name */}
        {!state.playerName.trim() && (
          <p className="name-warning">⚠️ Enter your name to start</p>
        )}
      </div>
    </div>
  );
}

export default HomePage;
