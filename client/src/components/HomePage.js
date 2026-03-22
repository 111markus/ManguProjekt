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

  const durations = [15, 30, 45, 60];

  return (
    <div className="home-page">
      {/* Animated Background Elements */}
      <div className="home-bg-effects">
        <div className="home-glow home-glow-1"></div>
        <div className="home-glow home-glow-2"></div>
        <div className="home-glow home-glow-3"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="home-grid-overlay"></div>

      {/* Header with Crosshair */}
      <div className="hero">
        <div className="hero-crosshair-wrap">
          <svg className="hero-crosshair-outer" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="22" y1="12" x2="18" y2="12" />
            <line x1="6" y1="12" x2="2" y2="12" />
            <line x1="12" y1="6" x2="12" y2="2" />
            <line x1="12" y1="22" x2="12" y2="18" />
          </svg>
          <svg className="hero-crosshair-inner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </div>
        <h1 className="hero-title-new">
          <span className="hero-react">REACT</span>
          <span className="hero-aim">AIM</span>
        </h1>
        <div className="hero-3d-badge">
          <div className="hero-3d-line"></div>
          <span className="hero-3d-text">3D</span>
          <div className="hero-3d-line"></div>
        </div>
      </div>

      <div className="home-container">
        <p className="hero-tagline splash-tagline">Train your precision • Master your accuracy</p>

        {/* Main Card with Glass Effect */}
        <div className="home-content">
          <div className="home-card">
            {/* Top Accent Bar */}
            <div className="home-card-accent"></div>

            <div className="home-card-inner">
              <div className="home-card-grid">
                {/* Player Name Section */}
                <div className="home-card-section">
                  <label className="home-label">
                    <span className="home-label-icon home-label-icon-purple">👤</span>
                    Player Name
                  </label>
                  <div className="home-input-wrap">
                    <input
                      ref={nameInputRef}
                      type="text"
                      placeholder="Enter your name..."
                      className="home-name-input"
                      value={state.playerName}
                      onChange={(e) =>
                        dispatch({ type: "SET_PLAYER_NAME", payload: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleStart()}
                      maxLength={20}
                    />
                  </div>
                </div>

                {/* Duration Section */}
                <div className="home-card-section">
                  <label className="home-label">
                    <span className="home-label-icon">⏱️</span>
                    Duration
                  </label>
                  <div className="home-dur-grid">
                    {durations.map((d) => (
                      <button
                        key={d}
                        className={`home-dur-btn ${state.gameSettings.duration === d ? "active" : ""
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
              </div>

              {/* Action Buttons */}
              <div className="home-actions-new">
                <button
                  className="home-btn-start"
                  onClick={handleStart}
                  disabled={!state.playerName.trim()}
                >
                  <span className="home-btn-start-overlay"></span>
                  {state.playerName.trim() ? (
                    <>
                      <span className="home-btn-icon">▶</span>
                      <span className="home-btn-text">START TRAINING</span>
                    </>
                  ) : (
                    <span className="home-btn-disabled-text">Enter name to start</span>
                  )}
                </button>

                <button
                  className="home-btn-lb"
                  onClick={() =>
                    dispatch({ type: "SET_PAGE", payload: "leaderboard" })
                  }
                >
                  <span className="home-btn-lb-icon">🏆</span>
                  <span>Leaderboard</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
