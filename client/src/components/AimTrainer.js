import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useGame } from "../context/GameContext";

// ─── Ball generation helpers ───
function randomPosition(mode) {
  const spread = mode === "precision" ? 5 : 7;
  const x = (Math.random() - 0.5) * spread;
  const y = Math.random() * 2.5 + 0.8;
  const z = -(Math.random() * 4 + 4);
  return { x, y, z };
}

function getBallRadius(mode) {
  if (mode === "precision") return 0.2 + Math.random() * 0.1;
  if (mode === "speed") return 0.3 + Math.random() * 0.15;
  return 0.3 + Math.random() * 0.2;
}

function getBallColor() {
  const colors = [
    "#ff4444", "#ff6644", "#ff8800", "#ffaa00",
    "#44ff44", "#44ffaa", "#4488ff", "#aa44ff",
    "#ff44aa", "#ffff44",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getPoints(radius, mode) {
  const base = mode === "precision" ? 150 : mode === "speed" ? 75 : 100;
  return Math.round(base * (0.35 / Math.max(radius, 0.1)));
}

// ─── Main Component ───
function AimTrainer() {
  const { state, dispatch, saveScore } = useGame();
  const { mode, duration } = state.gameSettings;

  // Game state — only 1 ball at a time
  const [ball, setBall] = useState(null);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [hitEffect, setHitEffect] = useState(null);
  const [popEffect, setPopEffect] = useState(null);

  // Refs
  const sceneRef = useRef(null);
  const timerRef = useRef(null);
  const ballIdRef = useRef(0);
  const gameActiveRef = useRef(false);
  const ballTimeoutRef = useRef(null);
  const ballRef = useRef(null); // current ball data for click handler

  // Keep refs in sync
  useEffect(() => {
    gameActiveRef.current = gameActive;
  }, [gameActive]);
  useEffect(() => {
    ballRef.current = ball;
  }, [ball]);

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;

  // ─── Spawn a single ball ───
  const spawnBall = useCallback(() => {
    if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);

    const pos = randomPosition(mode);
    const radius = getBallRadius(mode);
    const color = getBallColor();
    const points = getPoints(radius, mode);
    const id = ++ballIdRef.current;

    setBall({ id, ...pos, radius, color, points });

    // Auto-expire: miss + spawn next
    const lifetime = mode === "speed" ? 1500 : mode === "precision" ? 4000 : 3000;
    ballTimeoutRef.current = setTimeout(() => {
      if (gameActiveRef.current) {
        setMisses((prev) => prev + 1);
        spawnBall();
      }
    }, lifetime);
  }, [mode]);

  // ─── Start game ───
  const startGame = useCallback(() => {
    setScore(0);
    setHits(0);
    setMisses(0);
    setTimeLeft(duration);
    setBall(null);
    setGameOver(false);
    setScoreSaved(false);
    setCountdown(3);
    setGameActive(false);
    setPopEffect(null);
    setHitEffect(null);
    ballIdRef.current = 0;
    if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);

    // Countdown 3..2..1
    let c = 3;
    const countdownInterval = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(countdownInterval);
        setCountdown(0);
        setGameActive(true);
      }
    }, 1000);
  }, [duration]);

  // ─── Timer ───
  useEffect(() => {
    if (!gameActive) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
          setGameActive(false);
          setGameOver(true);
          setBall(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [gameActive]);

  // ─── Spawn first ball when game starts ───
  useEffect(() => {
    if (gameActive) {
      spawnBall();
    }
    return () => {
      if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
    };
  }, [gameActive, spawnBall]);

  // ─── Auto-save score on game over ───
  useEffect(() => {
    if (gameOver && !scoreSaved && score > 0) {
      saveScore({ score, hits, misses, accuracy, mode, duration });
      setScoreSaved(true);
    }
  }, [gameOver, scoreSaved, score, hits, misses, accuracy, mode, duration, saveScore]);

  // ─── Handle ball hit ───
  const handleBallHit = useCallback(
    (ballId, points) => {
      if (!gameActiveRef.current) return;
      if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);

      // Pop effect at ball position
      setBall((currentBall) => {
        if (currentBall && currentBall.id === ballId) {
          setPopEffect({ x: currentBall.x, y: currentBall.y, z: currentBall.z });
          setTimeout(() => setPopEffect(null), 400);
        }
        return null;
      });

      setScore((prev) => prev + points);
      setHits((prev) => prev + 1);

      setHitEffect({ x: Math.random() * 60 + 20, y: Math.random() * 40 + 20, points });
      setTimeout(() => setHitEffect(null), 600);

      // Spawn next ball after tiny delay
      setTimeout(() => {
        if (gameActiveRef.current) spawnBall();
      }, 150);
    },
    [spawnBall]
  );

  // ─── Handle miss ───
  const handleSceneMiss = useCallback(() => {
    if (!gameActiveRef.current) return;
    setMisses((prev) => prev + 1);
  }, []);

  // ─── Init scene ───
  useEffect(() => {
    startGame();
    // eslint-disable-next-line
  }, []);

  // ─── Click detection using Three.js raycaster on the canvas ───
  useEffect(() => {
    const waitForScene = setInterval(() => {
      const scene = sceneRef.current;
      if (!scene || !scene.canvas) return;
      clearInterval(waitForScene);

      const canvas = scene.canvas;

      const onClick = (e) => {
        if (!gameActiveRef.current) return;

        // Get Three.js internals from A-Frame
        const threeScene = scene.object3D;
        const camera = scene.camera;
        if (!threeScene || !camera) return;

        // Get the THREE module from A-Frame
        const THREE = window.AFRAME.THREE || window.THREE;
        if (!THREE) return;

        // Calculate normalized mouse coordinates
        const rect = canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );

        // Raycast
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        // Find all meshes in the scene
        const meshes = [];
        threeScene.traverse((child) => {
          if (child.isMesh) {
            meshes.push(child);
          }
        });

        const intersects = raycaster.intersectObjects(meshes, false);

        // Check if we hit a ball (the entity with ball-target class)
        let hitBall = false;
        for (const hit of intersects) {
          // Walk up to find the A-Frame entity
          let obj = hit.object;
          while (obj) {
            if (obj.el && obj.el.classList && obj.el.classList.contains("ball-target")) {
              hitBall = true;
              // Get ball data from ref
              const currentBall = ballRef.current;
              if (currentBall) {
                handleBallHit(currentBall.id, currentBall.points);
              }
              break;
            }
            obj = obj.parent;
          }
          if (hitBall) break;
        }

        if (!hitBall) {
          handleSceneMiss();
        }
      };

      canvas.addEventListener("click", onClick);
      // Store cleanup function
      canvas._aimCleanup = () => canvas.removeEventListener("click", onClick);
    }, 100);

    return () => {
      clearInterval(waitForScene);
      const scene = sceneRef.current;
      if (scene && scene.canvas && scene.canvas._aimCleanup) {
        scene.canvas._aimCleanup();
      }
    };
  }, [handleBallHit, handleSceneMiss]);

  return (
    <div className="aim-trainer">
      {/* ─── HUD Overlay ─── */}
      <div className="hud">
        <div className="hud-left">
          <div className="hud-item">
            <span className="hud-label">Score</span>
            <span className="hud-value score-val">{score}</span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Accuracy</span>
            <span className="hud-value">{accuracy}%</span>
          </div>
        </div>

        <div className="hud-center">
          {/* Conditional rendering for countdown / timer */}
          {countdown > 0 && (
            <div className="countdown-display">{countdown}</div>
          )}
          {countdown <= 0 && !gameOver && (
            <div className={`timer-display ${timeLeft <= 5 ? "timer-danger" : ""}`}>
              {timeLeft}
            </div>
          )}
        </div>

        <div className="hud-right">
          <div className="hud-item">
            <span className="hud-label">Hits</span>
            <span className="hud-value hit-val">{hits}</span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Mode</span>
            <span className="hud-value mode-val">{mode}</span>
          </div>
        </div>
      </div>

      {/* ─── Hit effect ─── */}
      {hitEffect && (
        <div
          className="hit-effect"
          style={{ left: `${hitEffect.x}%`, top: `${hitEffect.y}%` }}
        >
          +{hitEffect.points}
        </div>
      )}

      {/* ─── Crosshair ─── */}
      {gameActive && <div className="crosshair" />}

      {/* ─── 3D Scene ─── */}
      <div className="scene-container">
        <a-scene
          ref={sceneRef}
          embedded
          vr-mode-ui="enabled: false"
          style={{ width: "100%", height: "100%" }}
        >
          {/* Lighting */}
          <a-light type="ambient" color="#334" intensity="0.4" />
          <a-light type="directional" color="#fff" intensity="0.8" position="2 8 3" />
          <a-light type="point" color="#ff4444" intensity="0.3" position="0 3 -5" />
          <a-light type="point" color="#4488ff" intensity="0.2" position="-4 2 -3" />

          {/* Environment — dark shooting range */}
          <a-sky color="#0a0a12" />
          <a-plane
            rotation="-90 0 0"
            width="30"
            height="30"
            color="#111118"
            position="0 0 -5"
          />

          {/* Back wall */}
          <a-plane
            position="0 3 -10"
            width="30"
            height="12"
            color="#0d0d18"
          />

          {/* Grid lines on floor */}
          {Array.from({ length: 11 }).map((_, i) => (
            <a-entity key={`grid-${i}`}>
              <a-box
                position={`${(i - 5) * 3} 0.01 -5`}
                width="0.02"
                height="0.02"
                depth="30"
                color="#1a1a2e"
              />
            </a-entity>
          ))}

          {/* Camera — no pointer lock so clicking works */}
          <a-camera
            position="0 1.8 0"
            look-controls="enabled: false"
            wasd-controls="enabled: false"
          />

          {/* ─── Single ball ─── */}
          {ball && (
            <a-sphere
              key={ball.id}
              class="ball-target"
              position={`${ball.x} ${ball.y} ${ball.z}`}
              radius={ball.radius}
              color={ball.color}
              metalness="0.3"
              roughness="0.4"
              animation__spawn="property: scale; from: 0 0 0; to: 1 1 1; dur: 200; easing: easeOutBack"
            />
          )}

          {/* ─── Pop effect ─── */}
          {popEffect && (
            <a-sphere
              key={`pop-${Date.now()}`}
              position={`${popEffect.x} ${popEffect.y} ${popEffect.z}`}
              radius="0.1"
              color="#ffaa00"
              opacity="0.6"
              material="transparent: true"
              animation="property: scale; from: 1 1 1; to: 5 5 5; dur: 300; easing: easeOutQuad"
              animation__fade="property: material.opacity; from: 0.6; to: 0; dur: 300; easing: easeOutQuad"
            />
          )}
        </a-scene>
      </div>

      {/* ─── Game Over screen ─── */}
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-card">
            <h2 className="game-over-title">TRAINING COMPLETE</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Final Score</span>
                <span className="stat-value big">{score}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Hits</span>
                <span className="stat-value">{hits}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Misses</span>
                <span className="stat-value">{misses}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Accuracy</span>
                <span className="stat-value">{accuracy}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Mode</span>
                <span className="stat-value">{mode}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Duration</span>
                <span className="stat-value">{duration}s</span>
              </div>
            </div>

            {/* Conditional — accuracy feedback */}
            {accuracy >= 80 && (
              <p className="feedback good">🎯 Excellent accuracy! Sharpshooter!</p>
            )}
            {accuracy >= 50 && accuracy < 80 && (
              <p className="feedback ok">👍 Good aim, keep practicing!</p>
            )}
            {accuracy < 50 && accuracy > 0 && (
              <p className="feedback bad">😤 Keep training, you'll get better!</p>
            )}
            {accuracy === 0 && (
              <p className="feedback bad">🤔 Did you even try?</p>
            )}

            {scoreSaved && (
              <p className="score-saved-msg">✅ Score saved!</p>
            )}

            <div className="game-over-actions">
              <button className="btn-primary" onClick={startGame}>
                🔄 Play Again
              </button>
              <button
                className="btn-secondary"
                onClick={() => dispatch({ type: "SET_PAGE", payload: "home" })}
              >
                🏠 Home
              </button>
              <button
                className="btn-secondary"
                onClick={() =>
                  dispatch({ type: "SET_PAGE", payload: "leaderboard" })
                }
              >
                🏆 Leaderboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Back button (top-left, only during game) ─── */}
      {!gameOver && (
        <button
          className="back-btn"
          onClick={() => {
            clearInterval(timerRef.current);
            if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
            dispatch({ type: "SET_PAGE", payload: "home" });
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default AimTrainer;
