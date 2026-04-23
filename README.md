# Interactive Bible Quiz Game - Ultimate Edition

An immersive, fast-paced, "Duolingo-style" Bible Quiz game designed specifically for youth groups and Sunday service events. Built with pure web technologies and packaged to run flawlessly natively on any Desktop computer using a zero-configuration Python engine.

## Features
- **Local 2-Player Versus Mode**: Instantly swap from Single Player to a fully automated Turn-Based Duel! Displays a dynamic Mini-Scoreboard highlighting whose turn it is, tracking correct answers versus mistakes.
- **Lifeline Mechanics**: Adds strategic depth using three custom lifelines:
  - `50/50`: Instantly fades out half of the incorrect answers.
  - `Skip`: Bypasses incredibly tough questions without destroying your point streak.
  - `Hint`: A dynamic visual hint-box providing clues for every question.
- **Text-to-Speech (TTS)**: Built-in synthesis capability to audibly read every question and announce the winner.
- **Gamification System**: Features interactive streak tracking, dynamic point multipliers, and percentage-based UI rewards!
- **"Duolingo-style" Visuals**: Fast transitions, brightly colored floating cards, robust box shadows, smooth page scrolling, and sticky "Scroll-to-Top" capabilities.
- **Animated Avatars**: Character avatars dynamically bounce and jump on screen while talking to the player depending on correct or incorrect answers.
- **Zero-dependency Sound**: Utilizes the native JavaScript Web Audio API to dynamically synthesize victory chimes and error buzzes completely offline (No .mp3 or .wav files required!).
- **Huge Data Pool**: Comes pre-configured heavily with **124 custom questions** covering advanced categories like Deep Doctrine, Kings & Prophets, and Miracles!

## Technology Stack
This game was explicitly architected to bypass heavy frameworks and bulky Desktop Electron/Node.js dependencies. It executes completely natively and universally:
- **Frontend UI Engine:** Vanilla HTML5, CSS3, JavaScript (DOM Manipulation & Game State)
- **Backend Launch Engine:** Native Python 3 Server (`http.server` & `webbrowser`)

## How to Play

### 🚀 Easiest Method (Windows Only)
You do **not** need to install Python or understand code to play this! Simply download the pre-packaged App!
1. Click on the file named `BibleQuiz_Windows_App.exe` directly inside this GitHub repository folder.
2. Click the **"Download raw file"** button (or the Download icon) to save it to your computer.
3. Double-click the downloaded `.exe` file on your Desktop, and the game will instantly pop open in a full, gorgeous Desktop Window! You can load this on a USB stick and play offline indefinitely. 

### ⚙️ Developer Method (Mac / Linux / Windows)
If you want to modify code or you are on Mac/Linux, you can run the uncompiled backend via Python directly:
1. Clone this repository or download the ZIP to your computer:
   ```bash
   git clone https://github.com/elorm-ye/Bible-Quiz-Game.git
   cd Bible-Quiz-Game
   ```
2. Double-click the `launch.py` script, or run it directly from your terminal:
   ```bash
   python launch.py
   ```
3. Your default web browser will automatically open in full-screen mode to `http://localhost:8080`, hosting the game seamlessly! Keep the black terminal window open while playing.

## Modifying Questions
Categories and questions are instantly generated based on the flat local database! To add hundreds of new custom questions without touching any code logic, simply open `questions.json` and append your JSON block.

The app's rendering engine will instantly pick up any new `category`, gracefully shuffle the options, and inject it seamlessly into the Home Screen cards!

## Badges & Rewards (Single Player Mode)
At the end of a round, players are ranked and visibly rewarded based on their final percentage and gameplay:
- `90% or higher`: **Bible Scholar Badge**
- `50% or higher`: **Faith Starter Badge**
- `5+ Question Streak`: **Hot Streak Badge**

---
*Created for ICGC Evangel Temple Youth Services.*
