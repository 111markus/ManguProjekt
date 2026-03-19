const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, "scores.json");

app.use(cors());
app.use(express.json());

// Disable fullscreen API with CSP header
app.use((req, res, next) => {
  // CSP directive to disable fullscreen requests
  res.setHeader("Permissions-Policy", "fullscreen=()");
  next();
});

// Helper — read scores from file (acts like localStorage on the server)
function readScores() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading scores:", err);
  }
  return [];
}

// Helper — write scores to file
function writeScores(scores) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(scores, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing scores:", err);
  }
}

// GET /api/scores — return all scores (sorted by score desc)
app.get("/api/scores", (req, res) => {
  const scores = readScores();
  const { sort, order, limit } = req.query;

  let sorted = [...scores];

  // Sort
  const sortField = sort || "score";
  const sortOrder = order === "asc" ? 1 : -1;
  sorted.sort((a, b) => {
    if (
      sortField === "score" ||
      sortField === "hits" ||
      sortField === "accuracy"
    ) {
      return ((b[sortField] || 0) - (a[sortField] || 0)) * sortOrder * -1;
    }
    if (sortField === "date") {
      return (new Date(b.date) - new Date(a.date)) * sortOrder * -1;
    }
    return (
      String(a[sortField] || "").localeCompare(String(b[sortField] || "")) *
      sortOrder
    );
  });

  // Limit
  if (limit) {
    sorted = sorted.slice(0, parseInt(limit, 10));
  }

  res.json(sorted);
});

// GET /api/scores/:playerName — get scores for a specific player
app.get("/api/scores/:playerName", (req, res) => {
  const scores = readScores();
  const playerScores = scores.filter(
    (s) => s.name.toLowerCase() === req.params.playerName.toLowerCase(),
  );
  res.json(playerScores);
});

// POST /api/scores — save a new score
app.post("/api/scores", (req, res) => {
  const { name, score, hits, misses, accuracy, mode, duration } = req.body;

  if (!name || score === undefined) {
    return res.status(400).json({ error: "Name and score are required" });
  }

  const newScore = {
    id: Date.now().toString(),
    name,
    score,
    hits: hits || 0,
    misses: misses || 0,
    accuracy: accuracy || 0,
    mode: mode || "classic",
    duration: duration || 30,
    date: new Date().toISOString(),
  };

  const scores = readScores();
  scores.push(newScore);
  writeScores(scores);

  res.status(201).json(newScore);
});

// DELETE /api/scores/:id — delete a score
app.delete("/api/scores/:id", (req, res) => {
  let scores = readScores();
  const before = scores.length;
  scores = scores.filter((s) => s.id !== req.params.id);
  if (scores.length === before) {
    return res.status(404).json({ error: "Score not found" });
  }
  writeScores(scores);
  res.json({ message: "Score deleted" });
});

// DELETE /api/scores — clear all scores
app.delete("/api/scores", (req, res) => {
  writeScores([]);
  res.json({ message: "All scores cleared" });
});

app.listen(PORT, () => {
  console.log(`🎯 AimTrainer server running on http://localhost:${PORT}`);
});
