# 🎯 AimTrainer 3D

A high-performance 3D aim training game built with **React**, **Three.js**, and **A-Frame**. Perfect for improving your shooting accuracy and reflexes!

## 🚀 Features

- **3D Interactive Game Environment** - Immersive 3D scenes with A-Frame
- **Real-time HUD Display** - Score, hits, misses, and timer tracking
- **Sound Effects** - Immersive audio feedback for hits and reloads
- **Leaderboard System** - Global score tracking with database integration
- **Customizable Game Modes** - Select different durations and difficulty levels
- **Settings Menu** - Adjust sound, sensitivity, and game parameters
- **Responsive Design** - Works on desktop and mobile devices
- **Score Persistence** - Save and view your game statistics

## 📁 Project Structure

```
ManguProjekt/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── AimTrainer.js      # Main game component
│   │   │   ├── HomePage.js        # Home page
│   │   │   └── Leaderboard.js     # Leaderboard view
│   │   ├── context/       # React context
│   │   │   └── GameContext.js     # Game state management
│   │   ├── images/        # Asset images
│   │   ├── App.js         # Main app component
│   │   ├── App.css        # Global styles
│   │   └── index.js       # Entry point
│   └── public/            # Static assets
│       └── models/        # 3D models and audio files
├── server/                # Node.js backend
│   ├── index.js          # Express server
│   └── scores.json       # Leaderboard data
└── package.json          # Root dependencies
```

## 🛠️ Tech Stack

- **Frontend**: React, Three.js, A-Frame, CSS3
- **Backend**: Node.js, Express
- **Database**: JSON (scores.json)
- **Styling**: Custom CSS with glassmorphism effects
- **3D Graphics**: Three.js, A-Frame entities

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/111markus/ManguProjekt.git
   cd ManguProjekt
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Install server dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

## ▶️ Running the Project

### Development Mode

1. **Start the backend server**
   ```bash
   npm run server
   ```
   Server runs on `http://localhost:5000`

2. **In another terminal, start the React app**
   ```bash
   cd client
   npm start
   ```
   App runs on `http://localhost:3000`

### Production Build

```bash
cd client
npm run build
cd ..
```

## 🎮 How to Play

1. **Enter your name** on the home page
2. **Select game duration** (30s, 60s, 90s, 120s)
3. **Click START** to begin
4. **Aim and click** on targets in the 3D environment
5. **Track your score** in real-time on the HUD
6. **View results** on the game over screen
7. **Check leaderboard** to see top scores

## 🎛️ Controls

- **Mouse Movement** - Aim (pointer locked during game)
- **Click** - Shoot
- **ESC** - Open settings menu
- **SPACE** - Resume game
- **R** - Restart level

## 📊 Leaderboard Features

- View top scores globally
- Filter by player name
- See score dates and times
- Delete personal scores
- Real-time score updates

## ⚙️ Settings

Customize your experience:
- **Sound Toggle** - Enable/disable sound effects
- **Sensitivity** - Adjust aim sensitivity
- **Crosshair Size** - Customize crosshair appearance

## 🎨 UI Design

- Modern glassmorphism effects
- Dark theme with red accents
- Smooth animations and transitions
- Responsive layout for all screen sizes
- Custom fonts (Orbitron for UI, Inter for text)

## 🔗 API Endpoints

### Server Routes
- `GET /api/scores` - Get all leaderboard scores
- `POST /api/scores` - Save new score
- `DELETE /api/scores/:id` - Delete a score

## 📝 Asset Credits

- **3D Models**: Set design and FPS rig models
- **Audio**: Fire and reload sound effects
- **Crosshair**: Custom designed SVG

## 🐛 Known Issues

- Large files in `node_modules` cache should be added to `.gitignore`
- Mobile pointer lock support varies by browser

## 🚀 Future Enhancements

- [ ] Multiplayer modes
- [ ] Different target types and difficulties
- [ ] Advanced statistics and analytics
- [ ] User authentication and accounts
- [ ] Achievement system
- [ ] Tournament mode
- [ ] Custom game settings

## 📜 License

MIT License - Feel free to use this project for learning and personal use.

## 👨‍💻 Developer

Created by **111markus** | GitHub: [111markus/ManguProjekt](https://github.com/111markus/ManguProjekt)

## 📧 Feedback & Support

For issues, suggestions, or feedback, please open an issue on GitHub.

---

**Happy Aiming! 🎯**
