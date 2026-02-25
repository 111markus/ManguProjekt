import React from "react";
import { useGame } from "./context/GameContext";
import HomePage from "./components/HomePage";
import AimTrainer from "./components/AimTrainer";
import Leaderboard from "./components/Leaderboard";
import "./App.css";

function App() {
  const { state } = useGame();

  return (
    <div className="app">
      {/* Conditional rendering — show page based on state */}
      {state.currentPage === "home" && <HomePage />}
      {state.currentPage === "game" && <AimTrainer />}
      {state.currentPage === "leaderboard" && <Leaderboard />}
    </div>
  );
}

export default App;
