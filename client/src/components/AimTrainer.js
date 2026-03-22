import React, { useState, useEffect, useRef, useCallback } from "react";
import { useGame } from "../context/GameContext";
import crosshairImg from "../images/crosshair.png";

function randomPosition() {
  const x = (Math.random() - 0.5) * 7;
  const y = Math.random() * 2.5 + 0.8;
  const z = Math.random() * 4 + 4; // +Z direction (facing altar, 180° rotated)
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

function AimTrainer() {
  const { state, dispatch, saveScore } = useGame();
  const { duration } = state.gameSettings;


  const [ball, setBall] = useState(null);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(0); 
  const [waitingToStart, setWaitingToStart] = useState(true); 
  const [scoreSaved, setScoreSaved] = useState(false);
  const [hitEffect, setHitEffect] = useState(null);
  const [popEffect, setPopEffect] = useState(null);
  const [crosshairPos, setCrosshairPos] = useState({ x: 0, y: 0 });
  const [pointerLocked, setPointerLocked] = useState(false);
  const [showSettings, setShowSettings] = useState(false); 
  const [sensitivity, setSensitivity] = useState(0.5); 
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.1);
  const [reloading, setReloading] = useState(false);
  const [creditsUrl, setCreditsUrl] = useState(null);

  
  const sceneRef = useRef(null);
  const timerRef = useRef(null);
  const ballIdRef = useRef(0);
  const gameActiveRef = useRef(false);
  const ballTimeoutRef = useRef(null);
  const ballRef = useRef(null);
  const containerRef = useRef(null);
  const sensitivityRef = useRef(0.5);
  const gunRef = useRef(null); 
  const soundEnabledRef = useRef(true);
  const soundVolumeRef = useRef(0.1);
  const countdownIntervalRef = useRef(null);
  const showSettingsRef = useRef(false);
  const gameOverRef = useRef(false);

  
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { showSettingsRef.current = showSettings; }, [showSettings]);
  useEffect(() => { soundVolumeRef.current = soundVolume; }, [soundVolume]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  const countdownRef = useRef(0);
  useEffect(() => { countdownRef.current = countdown; }, [countdown]);

 
  useEffect(() => {
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
     
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        console.log("[Audio] ✅ AudioContext unlocked via user gesture");
      } catch (e) {
        console.warn("[Audio] Could not unlock AudioContext:", e);
      }
      
      try {
        const a = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
        a.volume = 0;
        a.play().catch(() => {});
      } catch (e) {}
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("mousedown", unlock);
    };
    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("mousedown", unlock);
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("mousedown", unlock);
    };
  }, []);

  
  const playSound = useCallback((src, volumeMultiplier = 1.0) => {
    console.log("[Audio] playSound called, enabled:", soundEnabledRef.current, "src:", src);
    if (!soundEnabledRef.current) {
      console.log("[Audio] Sound disabled, skipping");
      return;
    }
    try {
      const a = new Audio(src);
      a.volume = soundVolumeRef.current * volumeMultiplier;
      const promise = a.play();
      if (promise && promise.then) {
        promise.then(() => {
          console.log("[Audio] ✅ Playing:", src);
        }).catch((err) => {
          console.error("[Audio] ❌ Play failed:", err.message, err.name);
        });
      }
    } catch (e) {
      console.error("[Audio] ❌ Error creating Audio:", e);
    }
  }, []);

  
  const playFire = useCallback(() => playSound("/models/fire.mp3"), [playSound]);
  const playReload = useCallback(() => playSound("/models/reload.mp3"), [playSound]);

  
  useEffect(() => {
    const preload = (src) => {
      const a = new Audio(src);
      a.preload = "auto";
      a.load();
      console.log("[Audio] Preloading:", src);
    };
    preload("/models/fire.mp3");
    preload("/models/reload.mp3");
  }, []);

  
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

  
  useEffect(() => {
    const onMouseMove = (e) => {
      setCrosshairPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);


  // ─── Block pointer lock requests while settings are open ───
  useEffect(() => {
    const tryPatch = setInterval(() => {
      const scene = sceneRef.current;
      if (!scene || !scene.canvas) return;
      const canvas = scene.canvas;
      if (canvas._pointerLockPatched) { clearInterval(tryPatch); return; }

      canvas._origRequestPointerLock = canvas.requestPointerLock.bind(canvas);
      canvas.requestPointerLock = function () {
        if (showSettingsRef.current || gameOverRef.current) return;
        try {
          const promise = canvas._origRequestPointerLock();
          if (promise && promise.catch) {
            promise.catch((err) => {
              // Ignore standard "user exited before complete" or "not allowed" errors
              if (err.name !== 'NotAllowedError' && !err.message.includes('exited the lock')) {
                console.warn("[PointerLock] Request failed:", err);
              }
            });
          }
        } catch (e) {
          console.warn("[PointerLock] Sync error:", e);
        }
      };
      canvas._pointerLockPatched = true;
      clearInterval(tryPatch);
    }, 200);
    return () => clearInterval(tryPatch);
  }, []);

  
  useEffect(() => {
    let disposed = false;
    let retryTimer = null;

    const makeTransparent = () => {
      if (disposed) return;
      const scene = sceneRef.current;
      if (!scene || !scene.renderer) {
        retryTimer = setTimeout(makeTransparent, 300);
        return;
      }
      
      scene.renderer.setClearColor(0x000000, 0);
      
      if (scene.object3D) {
        scene.object3D.background = null;
      }
      
      const canvas = scene.canvas;
      if (canvas) {
        canvas.style.background = "transparent";
      }
    };

    retryTimer = setTimeout(makeTransparent, 300);
    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  
  useEffect(() => {
    let gunEntity = null;
    let disposed = false;
    let retryTimer = null;

    const setupGun = () => {
      if (disposed) return;
      const scene = sceneRef.current;
      if (!scene) {
        console.warn("[FPS Rig] Scene not ready, retrying in 500ms...");
        retryTimer = setTimeout(setupGun, 500);
        return;
      }

      
      const cam = scene.querySelector("[camera]") || scene.querySelector("a-camera");
      if (!cam) {
        console.warn("[FPS Rig] Camera not found, retrying in 500ms...");
        retryTimer = setTimeout(setupGun, 500);
        return;
      }

     
      if (cam.querySelector("#fps-weapon-rig")) {
        console.log("[FPS Rig] Already exists, skipping.");
        gunRef.current = cam.querySelector("#fps-weapon-rig");
        return;
      }

      console.log("[FPS Rig] Camera found:", cam.tagName, "- creating weapon entity...");

      
      gunEntity = document.createElement("a-entity");
      gunEntity.setAttribute("id", "fps-weapon-rig");
      gunEntity.setAttribute("gltf-model", "url(/models/fps-rig-akm.glb)");
      gunEntity.setAttribute("position", "0.4 -0.4 -0.6");
      gunEntity.setAttribute("rotation", "360 75 0");
      gunEntity.setAttribute("scale", "0.1 0.1 0.1");

      gunEntity.addEventListener("model-loaded", () => {
        console.log("[FPS Rig] ✅ Model loaded successfully!");
       
        const mesh = gunEntity.getObject3D("mesh");
        if (mesh && mesh.animations) {
          console.log("[FPS Rig] Available animations:", mesh.animations.map(a => a.name));
        }
        gunEntity.setAttribute("animation-mixer", {
          clip: "Armature|Idle",
          loop: "repeat",
          crossFadeDuration: 0.2,
        });
      });

      gunEntity.addEventListener("model-error", (e) => {
        console.error("[FPS Rig] ❌ Model failed to load:", e.detail);
      });

      
      cam.appendChild(gunEntity);

      
      gunRef.current = gunEntity;
      console.log("[FPS Rig] Entity appended to camera");
    };

    
    retryTimer = setTimeout(setupGun, 500);

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (gunEntity && gunEntity.parentNode) {
        gunEntity.parentNode.removeChild(gunEntity);
      }
      gunRef.current = null;
    };
  }, []);

  
  const spawnBall = useCallback(() => {
    if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);

    const pos = randomPosition();
    const radius = getBallRadius();
    const color = getBallColor();
    const points = getPoints(radius);
    const id = ++ballIdRef.current;

    setBall({ id, ...pos, radius, color, points });

    
    ballTimeoutRef.current = setTimeout(() => {
      if (gameActiveRef.current) {
        setMisses((prev) => prev + 1);
        spawnBall();
      }
    }, 3000);
  }, []);

  
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
    // CRITICAL: Update ref immediately so the pointer lock patch doesn't block us
    showSettingsRef.current = false;
    gameActiveRef.current = false; // Will set to true after countdown
    ballIdRef.current = 0;
    if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);

    // Re-enable look-controls for the new game
    const scene = sceneRef.current;
    if (scene) {
      const cam = scene.querySelector("[camera]") || scene.querySelector("a-camera");
      if (cam) {
        cam.setAttribute("look-controls", "enabled", true);
        // Immediate pointer lock on user click (20ms)
        setTimeout(() => {
          if (scene.canvas) scene.canvas.requestPointerLock();
        }, 20);
      }
    }

    
    let c = 3;
    countdownIntervalRef.current = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setCountdown(0);
        setGameActive(true);
      }
    }, 1000);
  }, [duration]);

  
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

  
  useEffect(() => {
    if (gameActive) {
      spawnBall();
    }
    return () => {
      if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
    };
  }, [gameActive, spawnBall]);

  
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

  // ─── Muzzle flash helper ───
  const showMuzzleFlash = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const cam = scene.querySelector("[camera]") || scene.querySelector("a-camera");
    if (!cam) return;

    // Create flash light (bright point light)
    const flash = document.createElement("a-entity");
    flash.setAttribute("position", "0.25 -0.15 -1.2");
    flash.setAttribute("light", "type: point; color: #ffaa33; intensity: 3; distance: 5; decay: 2");

    // Create visible flash sprite (small bright sphere)
    const sprite = document.createElement("a-sphere");
    sprite.setAttribute("position", "0.25 -0.15 -1.2");
    sprite.setAttribute("radius", "0.04");
    sprite.setAttribute("material", "color: #ffdd44; emissive: #ffaa00; emissiveIntensity: 3; transparent: true; opacity: 0.9");
    sprite.setAttribute("scale", "1 1 0.3");

    cam.appendChild(flash);
    cam.appendChild(sprite);

    // Remove after brief flash (60ms)
    setTimeout(() => {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
      if (sprite.parentNode) sprite.parentNode.removeChild(sprite);
    }, 60);
  }, []);

  // ─── Play shoot animation on the FPS rig ───
  const playShootAnimation = useCallback(() => {
    const gun = gunRef.current;
    if (!gun) return;

    // Don't interrupt reload animation
    if (reloadingRef.current) return;

    // Play fire sound
    playFire();

    // Show muzzle flash
    showMuzzleFlash();

    // Force-restart: remove then re-add animation-mixer with a new timeStamp
    gun.removeAttribute("animation-mixer");
    setTimeout(() => {
      if (!gunRef.current || reloadingRef.current) return;
      gunRef.current.setAttribute("animation-mixer", {
        clip: "Armature|Shoot",
        loop: "once",
        clampWhenFinished: true,
        crossFadeDuration: 0.05,
      });
      // Return to idle after short delay
      setTimeout(() => {
        if (!gunRef.current || reloadingRef.current) return;
        gunRef.current.removeAttribute("animation-mixer");
        setTimeout(() => {
          if (!gunRef.current || reloadingRef.current) return;
          gunRef.current.setAttribute("animation-mixer", {
            clip: "Armature|Idle",
            loop: "repeat",
            crossFadeDuration: 0.15,
          });
        }, 20);
      }, 250);
    }, 20);
  }, [showMuzzleFlash, playFire]);

  // ─── Handle ball hit ───
  const handleBallHit = useCallback(
    (ballId, points) => {
      if (!gameActiveRef.current) return;
      if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);

      // Play shoot animation
      playShootAnimation();

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
    [spawnBall, playShootAnimation],
  );

  // ─── Handle miss ───
  const handleSceneMiss = useCallback(() => {
    if (!gameActiveRef.current) return;
    playShootAnimation();
    setMisses((prev) => prev + 1);
  }, [playShootAnimation]);

  // ─── Release pointer lock & disable look-controls on game over ───
  useEffect(() => {
    if (gameOver) {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      // Disable look-controls so A-Frame doesn't re-lock the pointer
      const scene = sceneRef.current;
      if (scene) {
        const cam = scene.querySelector("[camera]") || scene.querySelector("a-camera");
        if (cam) {
          cam.setAttribute("look-controls", "enabled", false);
        }
      }
    }
  }, [gameOver]);

  // ─── R-key triggers reload animation ───
  const reloadingRef = useRef(false);
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.key === "r" || e.key === "R") && e.target.tagName !== "INPUT") {
        if (!gameActiveRef.current) return;
        if (reloadingRef.current) return;
        const gun = gunRef.current;
        if (!gun) return;

        reloadingRef.current = true;

        // Play reload sound
        playReload();

        // Same pattern as working shoot animation: remove → wait → set
        gun.removeAttribute("animation-mixer");
        setTimeout(() => {
          if (!gunRef.current) return;
          gunRef.current.setAttribute("animation-mixer", {
            clip: "Armature|Reload",
            loop: "once",
            clampWhenFinished: true,
            crossFadeDuration: 0.05,
          });
        }, 20);

        // Return to idle after reload animation finishes (3s animation duration)
        setTimeout(() => {
          if (!gunRef.current) return;
          gunRef.current.removeAttribute("animation-mixer");
          setTimeout(() => {
            if (!gunRef.current) return;
            gunRef.current.setAttribute("animation-mixer", {
              clip: "Armature|Idle",
              loop: "repeat",
              crossFadeDuration: 0.15,
            });
            reloadingRef.current = false;
          }, 20);
        }, 3000);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [playReload]);

  // ─── Pause / unpause helpers ───
  const pausedTimeRef = useRef(null); // stores timeLeft when paused

  const pauseGame = useCallback(() => {
    if (!gameActiveRef.current) return;
    // Save remaining time and stop the timer
    setTimeLeft((prev) => {
      pausedTimeRef.current = prev;
      return prev;
    });
    clearInterval(timerRef.current);
    // Stop ball timeout so balls don't expire while paused
    if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
    
    // Stop countdown if active
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    setGameActive(false);
    setShowSettings(true);
    // Exit pointer lock so user can interact with settings UI
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    // Disable look-controls so A-Frame doesn't re-lock the pointer
    const scene = sceneRef.current;
    if (scene) {
      const cam = scene.querySelector("[camera]") || scene.querySelector("a-camera");
      if (cam) {
        cam.setAttribute("look-controls", "enabled", false);
      }
    }
  }, []);

  const resumeGame = useCallback(() => {
    setShowSettings(false);
    // CRITICAL: Update ref immediately so the pointer lock patch doesn't block us
    showSettingsRef.current = false;
    // Re-enable look-controls
    const scene = sceneRef.current;
    if (scene) {
      const cam = scene.querySelector("[camera]") || scene.querySelector("a-camera");
      if (cam) {
        cam.setAttribute("look-controls", "enabled", true);
        // Immediate pointer lock on user click (20ms)
        setTimeout(() => {
          if (scene.canvas) scene.canvas.requestPointerLock();
        }, 20);
      }
    }

    // If we were in countdown, resume it
    if (countdownRef.current > 0) {
      let c = countdownRef.current;
      countdownIntervalRef.current = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          setCountdown(0);
          setGameActive(true);
        }
      }, 1000);
    } else {
      // Normal game resume
      setGameActive(true);
    }
  }, []);


  // ─── Pointer lock change listener ───
  useEffect(() => {
    const onLockChange = () => {
      const isLocked = !!document.pointerLockElement;
      setPointerLocked(isLocked);
      
      // If user exits pointer lock (e.g. by ESC) and game is active, show settings immediately
      if (!isLocked && gameActiveRef.current && !showSettingsRef.current && !gameOverRef.current) {
        pauseGame();
      }
    };
    document.addEventListener("pointerlockchange", onLockChange);
    return () => document.removeEventListener("pointerlockchange", onLockChange);
  }, [pauseGame]);

  // ─── P-key toggles settings menu (with pause/resume) ───
  useEffect(() => {
    const onKeyDown = (e) => {
      // Toggle settings on P or ESC
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        // Don't toggle if typing in an input (relevant if we add name inputs etc later)
        if (e.target.tagName === "INPUT") return;
        
        if (showSettings) {
          // Resume
          resumeGame();
        } else if (gameActiveRef.current || countdownRef.current > 0) {
          // Pause only if game or countdown is running
          pauseGame();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showSettings, pauseGame, resumeGame]);

  // ─── Exit fullscreen immediately if user enters it (F11) ───
  useEffect(() => {
    const checkFullscreen = () => {
      // If in fullscreen, exit immediately
      if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    };
    
    // Check every 100ms if fullscreen was activated
    const interval = setInterval(checkFullscreen, 100);
    
    // Also listen to fullscreen change events
    const onFullscreenChange = () => {
      setTimeout(checkFullscreen, 50);
    };
    
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("mozfullscreenchange", onFullscreenChange);
    document.addEventListener("msfullscreenchange", onFullscreenChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("mozfullscreenchange", onFullscreenChange);
      document.removeEventListener("msfullscreenchange", onFullscreenChange);
    };
  }, []);

  // ─── Apply sensitivity to look-controls — uniform for all mouse states ───
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const applyPatch = () => {
      const cam = scene.querySelector("a-camera");
      if (!cam) return;
      const lc = cam.components["look-controls"];
      if (!lc) return;

      // Only patch once
      if (lc._sensitivityPatched) return;
      lc._sensitivityPatched = true;

      // Remove A-Frame's original mousemove listener so it doesn't double-apply
      const canvasEl = scene.canvas;
      if (canvasEl && lc.onMouseMove) {
        canvasEl.removeEventListener("mousemove", lc.onMouseMove);
        document.removeEventListener("mousemove", lc.onMouseMove);
      }

      // Our custom handler — always uses the same sensitivity multiplier
      const customMouseMove = function (evt) {
        if (!lc.data.enabled) return;
        // Block camera movement while settings are open or game is over
        if (showSettingsRef.current || gameOverRef.current) return;

        const sens = sensitivityRef.current;
        const deltaX = (evt.movementX || 0) * sens;
        const deltaY = (evt.movementY || 0) * sens;

        // Apply rotation
        lc.pitchObject.rotation.x -= deltaY * 0.002;
        lc.yawObject.rotation.y -= deltaX * 0.002;

        // Clamp pitch to avoid flipping
        const PI_2 = Math.PI / 2;
        lc.pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, lc.pitchObject.rotation.x));
      };

      // Replace the method on the component (so A-Frame's tick/update calls ours)
      lc.onMouseMove = customMouseMove;

      // Add our listener to the document (pointer-locked mousemove fires on document)
      document.addEventListener("mousemove", customMouseMove);

      // Store for cleanup
      lc._customMouseMove = customMouseMove;
    };

    // A-Frame may not have initialized look-controls yet, wait a bit
    const timer = setTimeout(applyPatch, 500);
    return () => {
      clearTimeout(timer);
      const cam = scene.querySelector && scene.querySelector("a-camera");
      if (cam) {
        const lc = cam.components && cam.components["look-controls"];
        if (lc && lc._customMouseMove) {
          document.removeEventListener("mousemove", lc._customMouseMove);
        }
      }
    };
  }, []);

  // ─── Generate credits texture via canvas (Ultimate fix for täpitähed) ───
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background (semi-transparent dark)
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.roundRect ? ctx.roundRect(0, 0, 1024, 512, 40) : ctx.fillRect(0, 0, 1024, 512);
    ctx.fill();

    // Text style
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Draw "Mängu autorid"
    ctx.font = "bold 80px sans-serif";
    ctx.fillText("M\u00e4ngu autorid", 512, 160);
    
    // Draw "Markus L. ja Märt H."
    ctx.font = "60px sans-serif";
    ctx.fillText("Markus L. ja M\u00e4rt H.", 512, 280);
    
    // Draw "VSo25"
    ctx.font = "bold 50px Courier";
    ctx.fillText("VSo25", 512, 400);

    setCreditsUrl(canvas.toDataURL());
  }, []);
  // (Game waits for user to click "Click to Start")

  // ─── Click detection using Three.js raycaster on the canvas — Hold to spray ───
  useEffect(() => {
    const waitForScene = setInterval(() => {
      const scene = sceneRef.current;
      if (!scene || !scene.canvas) return;
      clearInterval(waitForScene);

      const canvas = scene.canvas;
      let isShooting = false;
      let shootLoop = null;

      const performShot = () => {
        if (!gameActiveRef.current || showSettingsRef.current) return;

        const threeScene = scene.object3D;
        const camera = scene.camera;
        if (!threeScene || !camera) return;

        const THREE = window.AFRAME.THREE || window.THREE;
        if (!THREE) return;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

        const meshes = [];
        const gunObject3D = gunRef.current ? gunRef.current.object3D : null;
        const sceneryEl = scene.querySelector('.set-design-scenery');
        const sceneryObject3D = sceneryEl ? sceneryEl.object3D : null;
        threeScene.traverse((child) => {
          if (child.isMesh) {
            let isExcluded = false;
            if (gunObject3D) {
              let parent = child;
              while (parent) {
                if (parent === gunObject3D) { isExcluded = true; break; }
                parent = parent.parent;
              }
            }
            if (!isExcluded && sceneryObject3D) {
              let parent = child;
              while (parent) {
                if (parent === sceneryObject3D) { isExcluded = true; break; }
                parent = parent.parent;
              }
            }
            if (!isExcluded) meshes.push(child);
          }
        });

        const intersects = raycaster.intersectObjects(meshes, false);

        let hitBall = false;
        for (const hit of intersects) {
          let obj = hit.object;
          while (obj) {
            if (obj.el && obj.el.classList && obj.el.classList.contains("ball-target")) {
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

      const onMouseDown = (e) => {
        if (e.button !== 0) return;
        isShooting = true;
        // Immediately shoot once
        performShot();
        // Then continue shooting every ~150ms while held (slower rate)
        shootLoop = setInterval(() => {
          if (isShooting) {
            performShot();
          }
        }, 150);
      };

      const onMouseUp = () => {
        isShooting = false;
        if (shootLoop) {
          clearInterval(shootLoop);
          shootLoop = null;
        }
      };

      canvas.addEventListener("mousedown", onMouseDown);
      document.addEventListener("mouseup", onMouseUp);
      
      canvas._aimCleanup = () => {
        canvas.removeEventListener("mousedown", onMouseDown);
        document.removeEventListener("mouseup", onMouseUp);
        if (shootLoop) clearInterval(shootLoop);
      };
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
          <div className="start-card-premium">
            {/* Top Accent Bar */}
            <div className="start-card-accent"></div>
            
            <div className="start-card-inner">
              <div className="start-hero-mini">
                <div className="hero-crosshair-wrap mini">
                  <svg className="hero-crosshair-outer" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="22" y1="12" x2="18" y2="12" />
                    <line x1="6" y1="12" x2="2" y2="12" />
                  </svg>
                  <svg className="hero-crosshair-inner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
                <h1 className="start-title-premium">
                  <span className="hero-react">REACT</span>
                  <span className="hero-aim">AIM</span>
                </h1>
                <div className="start-subtitle-premium">
                  CLASSIC MODE — {duration}s
                </div>
              </div>

              <div className="start-prompt-premium">
                <div className="start-prompt-pulse"></div>
                <div className="start-prompt-content">
                  <span className="start-prompt-icon">🎯</span>
                  <span className="start-prompt-text">CLICK ANYWHERE TO START</span>
                </div>
              </div>

              <div className="start-footer-hint">
                <div className="start-hint-line"></div>
                <p className="start-hint-main">
                  Press <kbd>P</kbd> or <kbd>ESC</kbd> for settings
                </p>
                <div className="start-hint-line"></div>
              </div>
            </div>
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
          {countdown <= 0 && !gameOver && !showSettings && (
            <div className="timer-container-new">
              <div
                className={`timer-display ${timeLeft <= 5 ? "timer-danger" : ""}`}
              >
                {timeLeft}
              </div>
              <div className="timer-bar-wrapper">
                <div 
                  className={`timer-bar-fill ${timeLeft <= 5 ? "timer-bar-pulse" : ""}`}
                  style={{ width: `${(timeLeft / duration) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          {showSettings && (
            <div className="timer-display" style={{ color: "#ffaa00" }}>
              ⏸ {timeLeft}
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

  
      {hitEffect && (
        <div
          className="hit-effect"
          style={{ left: `${hitEffect.x}%`, top: `${hitEffect.y}%` }}
        >
          +{hitEffect.points}
        </div>
      )}

      {gameActive && !showSettings && (
        <img
          src={crosshairImg}
          alt="crosshair"
          className="crosshair"
          draggable={false}
        />
      )}



      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-card">
            {/* Top Accent Bar */}
            <div className="settings-accent"></div>
            <div className="settings-inner">
              <h3 className="settings-title">⚙️ Settings</h3>

              {/* Sensitivity */}
              <div className="settings-section">
                <label className="settings-section-label">
                  <span className="settings-label-icon">🎯</span>
                  Mouse Sensitivity
                </label>
                <div className="settings-control-card">
                  <div className="settings-value-display">
                    <span>{sensitivity.toFixed(2)}</span>
                  </div>
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
              </div>

              {/* Sound */}
              <div className="settings-section">
                <label className="settings-section-label">
                  <span className="settings-label-icon">🔊</span>
                  Sound
                </label>
                <div className="settings-control-card">
                  <button
                    className={`settings-sound-btn ${soundEnabled ? "active" : ""}`}
                    onClick={() => {
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      if (next) {
                        setTimeout(() => {
                          playSound("/models/fire.mp3");
                        }, 100);
                      }
                    }}
                  >
                    {soundEnabled ? "🔊 ON" : "🔇 OFF"}
                  </button>
                </div>
              </div>

              {/* Volume */}
              {soundEnabled && (
                <div className="settings-section">
                  <label className="settings-section-label">
                    <span className="settings-label-icon">🎵</span>
                    Volume
                  </label>
                  <div className="settings-control-card">
                    <div className="settings-value-display">
                      <span>{Math.round(soundVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={soundVolume}
                      onChange={(e) => {
                        const newVol = parseFloat(e.target.value);
                        setSoundVolume(newVol);
                        // Play a short preview sound (throttled/debounced implicitly by user interaction speed)
                        // Using a manual new Audio here to ensure it uses the NEW volume immediately
                        try {
                          const a = new Audio("/models/fire.mp3");
                          a.volume = newVol;
                          a.play().catch(() => {});
                        } catch (e) {}
                      }}
                      className="settings-slider"
                    />
                    <div className="slider-labels">
                      <span>🔈</span>
                      <span>🔊</span>
                    </div>
                  </div>
                </div>
              )}

              <p className="settings-hint">Press <kbd>P</kbd> or <kbd>ESC</kbd> to resume</p>

              {/* Resume Button */}
              <button className="settings-resume-btn" onClick={resumeGame}>
                <span>▶</span> RESUME
              </button>

              {/* Bottom Actions */}
              <div className="settings-bottom-actions">
                <button 
                  className="settings-action-btn"
                  onClick={() => {
                    clearInterval(timerRef.current);
                    if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
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
                    setShowSettings(false);
                  }}
                >
                  🔄 Restart
                </button>
                <button 
                  className="settings-action-btn"
                  onClick={() => {
                    clearInterval(timerRef.current);
                    if (ballTimeoutRef.current) clearTimeout(ballTimeoutRef.current);
                    dispatch({ type: "SET_PAGE", payload: "home" });
                  }}
                >
                  🏠 Lobby
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="scene-container">
        <div className="waves-sky-bg">
        </div>

        <a-scene
          ref={sceneRef}
          embedded
          vr-mode-ui="enabled: false"
          inspector="enabled: false"
          renderer="alpha: true; antialias: true; colorManagement: true"
          style={{ width: "100%", height: "100%" }}
        >

          <a-light type="ambient" color="#ffffff" intensity="0.6" />
          <a-light
            type="directional"
            color="#fff4d6"
            intensity="1.0"
            position="-4 8 -2"
            castShadow="true"
          />
          <a-light type="hemisphere" color="#ffe0a0" groundColor="#aa8855" intensity="0.3" />

          <a-entity
            gltf-model="/models/set-design.glb"
            position="-30 -2 50"
            scale="1 1 1"
            class="set-design-scenery"
          />

          {/* ─── Environmental Scenery ─── */}
          <a-sky color="#1a1a2e" animation="property: color; to: #16213e; dur: 8000; dir: alternate; loop: true" />
          
          {/* ─── Credits behind the player ─── */}
          <a-entity position="0 2 -10" rotation="0 0 0">
            {creditsUrl && (
              <a-plane 
                src={creditsUrl}
                width="12" 
                height="6" 
                material="transparent: true; shader: flat"
                position="0 0 0"
              />
            )}
          </a-entity>


          <a-entity position="0 0 0" rotation="0 180 0">
            <a-camera
              position="0 1.8 0"
              look-controls="enabled: true; pointerLockEnabled: true; reverseMouseDrag: false"
              wasd-controls="enabled: false"
              near="0.01"
            />
          </a-entity>

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
            {/* Top Accent Bar */}
            <div className="game-over-accent"></div>
            
            <div className="game-over-inner">
              <h2 className="game-over-title">TRAINING COMPLETE</h2>
              
              <div className="stats-grid-new">
                {/* Score Section */}
                <div className="stat-card-new main-stat">
                  <div className="stat-label-new">
                    <span className="stat-icon-badge">🏆</span>
                    FINAL SCORE
                  </div>
                  <div className="stat-value-new score-count">{score}</div>
                </div>

                {/* Other Stats */}
                <div className="other-stats-row">
                  <div className="stat-card-new small">
                    <div className="stat-label-new">🎯 HITS</div>
                    <div className="stat-value-new">{hits}</div>
                  </div>
                  <div className="stat-card-new small">
                    <div className="stat-label-new">❌ MISSES</div>
                    <div className="stat-value-new">{misses}</div>
                  </div>
                  <div className="stat-card-new small">
                    <div className="stat-label-new">✨ ACCURACY</div>
                    <div className="stat-value-new">{accuracy}%</div>
                  </div>
                  <div className="stat-card-new small">
                    <div className="stat-label-new">⏱️ DURATION</div>
                    <div className="stat-value-new">{duration}s</div>
                  </div>
                </div>
              </div>

              {/* Conditional — accuracy feedback */}
              <div className="feedback-container">
                {accuracy >= 80 && (
                  <div className="feedback-badge perfect">
                    🎯 Excellent accuracy! Sharpshooter!
                  </div>
                )}
                {accuracy >= 50 && accuracy < 80 && (
                  <div className="feedback-badge good">
                    👍 Good aim, keep practicing!
                  </div>
                )}
                {accuracy < 50 && accuracy > 0 && (
                  <div className="feedback-badge keep-it-up">
                    😤 Keep training, you'll get better!
                  </div>
                )}
                {accuracy === 0 && (
                  <div className="feedback-badge keep-it-up">
                    🤔 Did you even try?
                  </div>
                )}
              </div>

              {scoreSaved && (
                <div className="score-saved-new">
                  <span>✅</span> SCORE SAVED TO LEADERBOARD
                </div>
              )}

              <div className="game-over-actions-new">
                <button 
                  className="game-over-btn-primary" 
                  onClick={() => {
                    setGameOver(false);
                    setWaitingToStart(true);
                    setCountdown(3);
                    setScore(0);
                    setHits(0);
                    setMisses(0);
                    setTimeLeft(duration);
                    setBall(null);
                    setScoreSaved(false);
                    setPopEffect(null);
                    setHitEffect(null);
                    ballIdRef.current = 0;
                  }}
                >
                  <span className="btn-icon">🔄</span>
                  PLAY AGAIN
                </button>
                
                <div className="game-over-btns-row">
                  <button
                    className="game-over-btn-secondary"
                    onClick={() => dispatch({ type: "SET_PAGE", payload: "home" })}
                  >
                    <span className="btn-icon-small">🏠</span> Home
                  </button>
                  <button
                    className="game-over-btn-secondary"
                    onClick={() => dispatch({ type: "SET_PAGE", payload: "leaderboard" })}
                  >
                    <span className="btn-icon-small">🏆</span> Leaderboard
                  </button>
                </div>
              </div>
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
