import React, { useState, useEffect, useRef, useCallback } from "react";
import { useGame } from "../context/GameContext";

// ─── Ball generation helpers ───
function randomPosition() {
  const x = (Math.random() - 0.5) * 7;
  const y = Math.random() * 2.5 + 0.8;
  const z = -(Math.random() * 4 + 4);
  return { x, y, z };
}

function getBallRadius() {
  return 0.3 + Math.random() * 0.2;
}

function getBallColor() {
  const colors = [
    "#ff4444",
    "#ff6644",
    "#ff8800",
    "#ffaa00",
    "#44ff44",
    "#44ffaa",
    "#4488ff",
    "#aa44ff",
    "#ff44aa",
    "#ffff44",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getPoints(radius) {
  return Math.round(100 * (0.35 / Math.max(radius, 0.1)));
}

// ─── Main Component ───
function AimTrainer() {
  const { state, dispatch, saveScore } = useGame();
  const { duration } = state.gameSettings;

  // Game state — only 1 ball at a time
  const [ball, setBall] = useState(null);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(0); // 0 = not counting
  const [waitingToStart, setWaitingToStart] = useState(true); // NEW: wait for click
  const [scoreSaved, setScoreSaved] = useState(false);
  const [hitEffect, setHitEffect] = useState(null);
  const [popEffect, setPopEffect] = useState(null);
  const [crosshairPos, setCrosshairPos] = useState({ x: 0, y: 0 });
  const [pointerLocked, setPointerLocked] = useState(false);
  const [showSettings, setShowSettings] = useState(false); // NEW: P-key menu
  const [sensitivity, setSensitivity] = useState(1); // NEW: mouse sensitivity

  // Refs
  const sceneRef = useRef(null);
  const timerRef = useRef(null);
  const ballIdRef = useRef(0);
  const gameActiveRef = useRef(false);
  const ballTimeoutRef = useRef(null);
  const ballRef = useRef(null);
  const containerRef = useRef(null);
  const sensitivityRef = useRef(1);

  // Keep refs in sync
  useEffect(() => {
    gameActiveRef.current = gameActive;
  }, [gameActive]);
  useEffect(() => {
    ballRef.current = ball;
  }, [ball]);
  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  const accuracy =
    hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;

  // ─── Track mouse for crosshair ───
  useEffect(() => {
    const onMouseMove = (e) => {
      setCrosshairPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  // ─── Track pointer lock state ───
  useEffect(() => {
    const onLockChange = () => {
      setPointerLocked(!!document.pointerLockElement);
    };
    document.addEventListener("pointerlockchange", onLockChange);
    return () => document.removeEventListener("pointerlockchange", onLockChange);
  }, []);

  // ─── Spawn a single ball ───
  const spawnBall = useCallback(() => {
    if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);

    const pos = randomPosition();
    const radius = getBallRadius();
    const color = getBallColor();
    const points = getPoints(radius);
    const id = ++ballIdRef.current;

    setBall({ id, ...pos, radius, color, points });

    // Auto-expire after 3 seconds: miss + spawn next
    ballTimeoutRef.current = setTimeout(() => {
      if (gameActiveRef.current) {
        setMisses((prev) => prev + 1);
        spawnBall();
      }
    }, 3000);
  }, []);

  // ─── Start game (called when user clicks "Click to Start") ───
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
    setWaitingToStart(false);
    setShowSettings(false);
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
      saveScore({ score, hits, misses, accuracy, mode: "classic", duration });
      setScoreSaved(true);
    }
  }, [
    gameOver,
    scoreSaved,
    score,
    hits,
    misses,
    accuracy,
    duration,
    saveScore,
  ]);

  // ─── Handle ball hit ───
  const handleBallHit = useCallback(
    (ballId, points) => {
      if (!gameActiveRef.current) return;
      if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);

      // Pop effect at ball position
      setBall((currentBall) => {
        if (currentBall && currentBall.id === ballId) {
          setPopEffect({
            x: currentBall.x,
            y: currentBall.y,
            z: currentBall.z,
          });
          setTimeout(() => setPopEffect(null), 400);
        }
        return null;
      });

      setScore((prev) => prev + points);
      setHits((prev) => prev + 1);

      setHitEffect({
        x: Math.random() * 60 + 20,
        y: Math.random() * 40 + 20,
        points,
      });
      setTimeout(() => setHitEffect(null), 600);

      // Spawn next ball after tiny delay
      setTimeout(() => {
        if (gameActiveRef.current) spawnBall();
      }, 150);
    },
    [spawnBall],
  );

  // ─── Handle miss ───
  const handleSceneMiss = useCallback(() => {
    if (!gameActiveRef.current) return;
    setMisses((prev) => prev + 1);
  }, []);

  // ─── Release pointer lock on game over ───
  useEffect(() => {
    if (gameOver && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, [gameOver]);

  // ─── P-key toggles settings menu ───
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "p" || e.key === "P") {
        // Don't toggle if typing in an input
        if (e.target.tagName === "INPUT") return;
        setShowSettings((prev) => !prev);
      }
      // ESC closes settings
      if (e.key === "Escape" && showSettings) {
        setShowSettings(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showSettings]);

  // ─── Apply sensitivity to look-controls via custom component ───
  useEffect(() => {
    const AFRAME = window.AFRAME;
    if (!AFRAME) return;

    // Register a custom component that overrides mouse sensitivity
    if (!AFRAME.components["custom-look-sensitivity"]) {
      AFRAME.registerComponent("custom-look-sensitivity", {
        schema: { sensitivity: { type: "number", default: 1 } },
        init() {
          this.onMouseMove = this.onMouseMove.bind(this);
          this.pitchObject = new AFRAME.THREE.Object3D();
          this.yawObject = new AFRAME.THREE.Object3D();
        },
        // We don't use this component to actually move the camera;
        // instead we patch the look-controls mousemove handler
      });
    }

    // Patch the look-controls to apply our sensitivity multiplier
    const scene = sceneRef.current;
    if (!scene) return;

    const applyPatch = () => {
      const cam = scene.querySelector("a-camera");
      if (!cam) return;
      const lc = cam.components["look-controls"];
      if (!lc) return;

      // Only patch once
      if (!lc._origOnMouseMove && lc.onMouseMove) {
        lc._origOnMouseMove = lc.onMouseMove.bind(lc);
        lc.onMouseMove = function (evt) {
          // Scale the movementX/Y by our sensitivity
          const sens = sensitivityRef.current;
          const fakeEvent = {
            movementX: (evt.movementX || 0) * sens,
            movementY: (evt.movementY || 0) * sens,
            screenX: evt.screenX,
            screenY: evt.screenY,
          };
          lc._origOnMouseMove(fakeEvent);
        };
      }
    };

    // A-Frame may not have initialized look-controls yet, wait a bit
    const timer = setTimeout(applyPatch, 500);
    return () => clearTimeout(timer);
  }, []);

  // ─── No auto-start — just mount the scene ───
  // (Game waits for user to click "Click to Start")

  // ─── Click detection using Three.js raycaster on the canvas ───
  useEffect(() => {
    const waitForScene = setInterval(() => {
      const scene = sceneRef.current;
      if (!scene || !scene.canvas) return;
      clearInterval(waitForScene);

      const canvas = scene.canvas;

      const onClick = () => {
        if (!gameActiveRef.current) return;

        const threeScene = scene.object3D;
        const camera = scene.camera;
        if (!threeScene || !camera) return;

        const THREE = window.AFRAME.THREE || window.THREE;
        if (!THREE) return;

        // Ray from camera center (where the crosshair/camera is pointing)
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

        const meshes = [];
        threeScene.traverse((child) => {
          if (child.isMesh) {
            meshes.push(child);
          }
        });

        const intersects = raycaster.intersectObjects(meshes, false);

        let hitBall = false;
        for (const hit of intersects) {
          let obj = hit.object;
          while (obj) {
            if (
              obj.el &&
              obj.el.classList &&
              obj.el.classList.contains("ball-target")
            ) {
              hitBall = true;
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
    <div className="aim-trainer" ref={containerRef}>
      {/* ─── "Click to Start" overlay ─── */}
      {waitingToStart && !gameOver && (
        <div className="start-overlay" onClick={startGame}>
          <div className="start-card">
            <h2 className="start-title">AIM TRAINER</h2>
            <p className="start-mode">Classic Mode — {duration}s</p>
            <div className="start-cta">🎯 Click anywhere to start</div>
            <p className="start-hint">Press <kbd>P</kbd> during game for settings</p>
          </div>
        </div>
      )}

      {/* ─── HUD Overlay ─── */}
      {!waitingToStart && (
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
          {countdown > 0 && (
            <div className="countdown-display">{countdown}</div>
          )}
          {countdown <= 0 && !gameOver && (
            <div
              className={`timer-display ${timeLeft <= 5 ? "timer-danger" : ""}`}
            >
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
            <span className="hud-label">Misses</span>
            <span className="hud-value miss-val">{misses}</span>
          </div>
        </div>
      </div>
      )}

      {/* ─── Hit effect ─── */}
      {hitEffect && (
        <div
          className="hit-effect"
          style={{ left: `${hitEffect.x}%`, top: `${hitEffect.y}%` }}
        >
          +{hitEffect.points}
        </div>
      )}

      {/* ─── Crosshair — fixed at center, camera follows mouse via pointer lock ─── */}
      {gameActive && (
        <div className="crosshair">
          <div className="crosshair-dot" />
        </div>
      )}

      {/* ─── Pointer lock prompt ─── */}
      {gameActive && !pointerLocked && !showSettings && (
        <div className="pointer-lock-prompt">
          <p>🖱️ Click on the game to lock your mouse</p>
          <p className="prompt-sub">Your mouse controls the camera view</p>
        </div>
      )}

      {/* ─── Settings menu (P key) ─── */}
      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-card">
            <h3 className="settings-title">⚙️ Settings</h3>
            <div className="settings-row">
              <label className="settings-label">
                Mouse Sensitivity: <strong>{sensitivity.toFixed(2)}</strong>
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.05"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                className="settings-slider"
              />
              <div className="slider-labels">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>
            <p className="settings-hint">Press <kbd>P</kbd> or <kbd>ESC</kbd> to close</p>
          </div>
        </div>
      )}

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
          <a-light
            type="directional"
            color="#fff"
            intensity="0.8"
            position="2 8 3"
          />
          <a-light
            type="point"
            color="#ff4444"
            intensity="0.3"
            position="0 3 -5"
          />
          <a-light
            type="point"
            color="#4488ff"
            intensity="0.2"
            position="-4 2 -3"
          />

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
          <a-plane position="0 3 -10" width="30" height="12" color="#0d0d18" />

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

          {/* Camera — pointer lock: mouse moves the view, crosshair stays centered */}
          <a-camera
            position="0 1.8 0"
            look-controls="enabled: true; pointerLockEnabled: true; reverseMouseDrag: false"
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
                <span className="stat-label">Duration</span>
                <span className="stat-value">{duration}s</span>
              </div>
            </div>

            {/* Conditional — accuracy feedback */}
            {accuracy >= 80 && (
              <p className="feedback good">
                🎯 Excellent accuracy! Sharpshooter!
              </p>
            )}
            {accuracy >= 50 && accuracy < 80 && (
              <p className="feedback ok">👍 Good aim, keep practicing!</p>
            )}
            {accuracy < 50 && accuracy > 0 && (
              <p className="feedback bad">
                😤 Keep training, you'll get better!
              </p>
            )}
            {accuracy === 0 && (
              <p className="feedback bad">🤔 Did you even try?</p>
            )}

            {scoreSaved && <p className="score-saved-msg">✅ Score saved!</p>}

            <div className="game-over-actions">
              <button className="btn-primary" onClick={() => {
                setGameOver(false);
                setWaitingToStart(true);
                setCountdown(0);
                setScore(0);
                setHits(0);
                setMisses(0);
                setTimeLeft(duration);
                setBall(null);
                setScoreSaved(false);
                setPopEffect(null);
                setHitEffect(null);
                ballIdRef.current = 0;
              }}>
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
