// Running in Browser
let allQuestions = [];
let availableCategories = [];
let selectedCategory = '';
let currentQuestions = [];
let questionIndex = 0;
let answerSelected = false;

// Single Player State
let score = 0, streak = 0, maxStreak = 0;

// Shared State
let timeLeft = 15;
let timerInterval = null;
let selectedDifficulty = 'Any';
let ttsEnabled = false;
let currentQuestionType = 'multiple_choice';
let gameMode = 'single'; // 'single' or 'multi'

// Multiplayer State
let players = [
  { name: 'Player 1', score: 0, wrong: 0, lifelines: { fifty: 1, skip: 1, hint:1 } },
  { name: 'Player 2', score: 0, wrong: 0, lifelines: { fifty: 1, skip: 1, hint:1 } }
];
let currentTurn = 0;
const maxTurnsPerRound = 10; // 5 each

let singleLifelines = { fifty: 1, skip: 1, hint: 1 };
let leaderboards = JSON.parse(localStorage.getItem('bibleQuizLeaderboard')) || [];

const avatars = ['🧔🏽‍♂️', '🧙‍♂️', '👦🏽', '🧕', '👼', '📜', '🕊️'];

// Audio Synthesis
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  if (type === 'correct') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); 
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.5);
  } else if (type === 'wrong') {
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.4);
  } else if (type === 'complete') {
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.4);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.8);
  }
}

function speak(text) {
  if (!ttsEnabled) return;
  window.speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = 0.9;
  window.speechSynthesis.speak(msg);
}

// DOM
const screens = {
  welcome: document.getElementById('welcome-screen'),
  category: document.getElementById('category-screen'),
  question: document.getElementById('question-screen'),
  result: document.getElementById('result-screen'),
  leaderboard: document.getElementById('leaderboard-screen')
};
const topBar = document.getElementById('top-bar');
const miniScoreboard = document.getElementById('mini-scoreboard');

function switchScreen(screenKey) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screens[screenKey].classList.remove('hidden');
  if (screenKey === 'question') topBar.classList.remove('hidden');
  else topBar.classList.add('hidden');
}

// Initialization
async function init() {
  try {
    const response = await fetch('questions.json');
    allQuestions = await response.json();
    availableCategories = [...new Set(allQuestions.map(q => q.category))];
    
    // Bind buttons
    document.getElementById('mode-select').addEventListener('change', (e) => {
      document.getElementById('multiplayer-inputs').style.display = e.target.value === 'multi' ? 'flex' : 'none';
      gameMode = e.target.value;
    });

    document.getElementById('btn-start').addEventListener('click', () => {
      selectedDifficulty = document.getElementById('difficulty-select').value;
      if(gameMode === 'multi') {
        players[0].name = document.getElementById('p1-name').value || 'Player 1';
        players[1].name = document.getElementById('p2-name').value || 'Player 2';
        players[0].score = 0; players[0].wrong = 0;
        players[1].score = 0; players[1].wrong = 0;
      }
      buildCategoryGrid();
      switchScreen('category');
    });

    document.getElementById('btn-next').addEventListener('click', onNext);
    document.getElementById('btn-restart').addEventListener('click', () => switchScreen('welcome'));
    document.getElementById('btn-home').addEventListener('click', () => switchScreen('welcome'));
    
    document.getElementById('btn-leaderboard').addEventListener('click', showLeaderboards);
    document.getElementById('btn-leaderboard-back').addEventListener('click', () => switchScreen('welcome'));

    // TTS
    const ttsBtn = document.getElementById('btn-tts');
    ttsBtn.addEventListener('click', () => {
      ttsEnabled = !ttsEnabled;
      if(ttsEnabled) { ttsBtn.classList.remove('disabled-icon'); speak("Audio enabled."); }
      else ttsBtn.classList.add('disabled-icon');
    });
    ttsBtn.classList.add('disabled-icon');



    // Lifelines
    document.getElementById('life-5050').addEventListener('click', use5050);
    document.getElementById('life-skip').addEventListener('click', useSkip);
    document.getElementById('life-hint').addEventListener('click', useHint);

  } catch (error) {
    console.error(error);
  }
}

function buildCategoryGrid() {
  const grid = document.getElementById('category-grid');
  grid.innerHTML = '';
  availableCategories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'category-card'; card.innerText = cat;
    card.addEventListener('click', () => { selectedCategory = cat; startQuiz(); });
    grid.appendChild(card);
  });
  
  const allCard = document.createElement('div');
  allCard.className = 'category-card'; allCard.innerText = 'Mix All';
  allCard.style.borderColor = 'var(--primary)';
  allCard.addEventListener('click', () => { selectedCategory = 'All'; startQuiz(); });
  grid.appendChild(allCard);
}

function startQuiz() {
  let pool = selectedCategory === 'All' ? [...allQuestions] : allQuestions.filter(q => q.category === selectedCategory);
  if (selectedDifficulty !== 'Any') {
    pool = pool.filter(q => (q.difficulty || 'medium').toLowerCase() === selectedDifficulty.toLowerCase());
  }
  
  let targetQuestions = gameMode === 'multi' ? maxTurnsPerRound : 15;
  if (pool.length < targetQuestions) { pool = pool.concat(allQuestions).sort(() => 0.5 - Math.random()); }
  currentQuestions = pool.sort(() => 0.5 - Math.random()).slice(0, targetQuestions);
  
  questionIndex = 0;
  answerSelected = false;

  if (gameMode === 'multi') {
    currentTurn = 0;
    players.forEach(p => { p.score = 0; p.wrong = 0; p.lifelines = {fifty:1, skip:1, hint:1}; });
    document.querySelector('.stats-container').classList.add('hidden');
    miniScoreboard.classList.remove('hidden');
    updateMiniScoreboard();
  } else {
    score = 0; streak = 0; maxStreak = 0;
    singleLifelines = { fifty: 1, skip: 1, hint: 1 };
    document.querySelector('.stats-container').classList.remove('hidden');
    miniScoreboard.classList.add('hidden');
  }
  
  switchScreen('question');
  loadQuestion();
}

function getCurrentPlayer() {
  return (currentTurn % 2 === 0) ? players[0] : players[1];
}

function updateStats() {
  if (gameMode === 'multi') {
    updateMiniScoreboard();
    let cp = getCurrentPlayer();
    document.getElementById('life-5050').disabled = cp.lifelines.fifty <= 0;
    document.getElementById('life-skip').disabled = cp.lifelines.skip <= 0;
    document.getElementById('life-hint').disabled = cp.lifelines.hint <= 0;
  } else {
    document.getElementById('score-counter').innerText = score;
    document.getElementById('streak-counter').innerText = streak;
    const prog = ((questionIndex) / currentQuestions.length) * 100;
    document.getElementById('progress-bar-fill').style.width = prog + '%';
    
    document.getElementById('life-5050').disabled = singleLifelines.fifty <= 0;
    document.getElementById('life-skip').disabled = singleLifelines.skip <= 0;
    document.getElementById('life-hint').disabled = singleLifelines.hint <= 0;
  }
}

function updateMiniScoreboard() {
  document.getElementById('p1-mininame').innerText = players[0].name;
  document.getElementById('p1-miniscore').innerText = players[0].score;
  document.getElementById('p1-miniwrong').innerText = players[0].wrong;
  document.getElementById('p2-mininame').innerText = players[1].name;
  document.getElementById('p2-miniscore').innerText = players[1].score;
  document.getElementById('p2-miniwrong').innerText = players[1].wrong;

  document.getElementById('p1-row').style.background = (currentTurn % 2 === 0) ? '#d7ffb8' : 'transparent';
  document.getElementById('p2-row').style.background = (currentTurn % 2 === 1) ? '#d7ffb8' : 'transparent';
}

function loadQuestion() {
  const q = currentQuestions[questionIndex];
  answerSelected = false;
  currentQuestionType = q.type || 'multiple_choice';
  
  if (gameMode === 'multi') {
    let cp = getCurrentPlayer();
    document.getElementById('turn-announcer').innerText = cp.name + "'s Turn!";
    document.getElementById('turn-announcer').classList.remove('hidden');
  } else {
    document.getElementById('turn-announcer').classList.add('hidden');
  }

  timeLeft = 15;
  document.getElementById('timer-display').innerText = timeLeft;
  document.getElementById('timer-display').style.color = '#ff4b4b';
  if(gameMode === 'multi') document.getElementById('multi-timer').innerText = timeLeft;
  
  clearInterval(timerInterval);
  timerInterval = setInterval(timerTick, 1000);
  
  document.getElementById('feedback-footer').classList.add('hidden');
  document.getElementById('feedback-footer').className = '';
  document.getElementById('feedback-footer').classList.add('hidden');
  document.getElementById('hint-display').classList.add('hidden');
  
  const randAvatar = avatars[Math.floor(Math.random() * avatars.length)];
  document.getElementById('question-avatar').innerText = randAvatar;
  document.getElementById('question-speech').innerText = q.question;
  
  speak(q.question);
  
  renderOptions(q);
  updateStats();
}

function renderOptions(q) {
  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
  
  grid.classList.remove('hidden');
  let shuffledOpts = [...q.options].sort(() => 0.5 - Math.random());
  shuffledOpts.forEach(opt => {
    const card = document.createElement('div');
    card.className = 'option-card'; card.innerText = opt;
    card.onclick = () => onOptionSelected(opt, card, q.answer, shuffledOpts);
    grid.appendChild(card);
  });
}

function timerTick() {
  timeLeft--;
  document.getElementById('timer-display').innerText = timeLeft;
  if(gameMode === 'multi') document.getElementById('multi-timer').innerText = timeLeft;
  if(timeLeft <= 5) {
    document.getElementById('timer-display').style.color = 'darkred';
    if(gameMode==='multi') document.getElementById('multi-timer').style.color = 'darkred';
  }
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    const cards = document.querySelectorAll('.option-card');
    cards.forEach(c => c.classList.add('disabled'));
    onAnswerEvaluated(false, currentQuestions[questionIndex].answer, cards);
  }
}

function use5050() {
  if (answerSelected) return;
  if (gameMode === 'multi') { if(getCurrentPlayer().lifelines.fifty <= 0) return; getCurrentPlayer().lifelines.fifty = 0; }
  else { if(singleLifelines.fifty <= 0) return; singleLifelines.fifty = 0; }
  
  updateStats();
  const q = currentQuestions[questionIndex];
  const cards = Array.from(document.querySelectorAll('.option-card'));
  let wrongCards = cards.filter(c => c.innerText !== q.answer);
  wrongCards = wrongCards.sort(() => 0.5 - Math.random()).slice(0, wrongCards.length - 1);
  wrongCards.forEach(c => c.classList.add('faded-out'));
}

function useSkip() {
  if (answerSelected) return;
  if (gameMode === 'multi') { if(getCurrentPlayer().lifelines.skip <= 0) return; getCurrentPlayer().lifelines.skip = 0; }
  else { if(singleLifelines.skip <= 0) return; singleLifelines.skip = 0; }
  clearInterval(timerInterval);
  onNext();
}

function useHint() {
  if (answerSelected) return;
  if (gameMode === 'multi') { if(getCurrentPlayer().lifelines.hint <= 0) return; getCurrentPlayer().lifelines.hint = 0; }
  else { if(singleLifelines.hint <= 0) return; singleLifelines.hint = 0; }
  updateStats();
  const hintBox = document.getElementById('hint-display');
  hintBox.innerText = "💡 Hint: " + (currentQuestions[questionIndex].hint || "Trust your memory!");
  hintBox.classList.remove('hidden');
}

function onOptionSelected(selectedTxt, cardEl, correctTxt, opts) {
  if (answerSelected) return;
  answerSelected = true;
  clearInterval(timerInterval);
  
  const isCorrect = (selectedTxt === correctTxt);
  const cards = document.querySelectorAll('.option-card');
  cards.forEach(c => c.classList.add('disabled'));
  
  if(cardEl) {
    if (isCorrect) cardEl.classList.add('selected-correct');
    else cardEl.classList.add('selected-wrong');
  }
  if (!isCorrect && cards.length > 0) {
    cards.forEach(c => { if (c.innerText === correctTxt) c.classList.add('correct-answer'); });
  }
  
  onAnswerEvaluated(isCorrect, correctTxt, cards);
}

function onAnswerEvaluated(isCorrect, correctTxt, cards) {
  const footer = document.getElementById('feedback-footer');
  const msg = document.getElementById('feedback-message');
  const subtext = document.getElementById('feedback-subtext');
  
  footer.classList.remove('hidden');
  const q = currentQuestions[questionIndex];
  const refText = q.reference ? `Reference: ${q.reference}` : '';
  
  if (gameMode === 'multi') {
    let cp = getCurrentPlayer();
    if (isCorrect) cp.score++; else cp.wrong++;
  } else {
    if (isCorrect) { score += 10 + (streak * 2); streak++; if (streak > maxStreak) maxStreak = streak; }
    else { streak = 0; }
  }

  if (isCorrect) {
    playSound('correct'); footer.classList.add('correct');
    msg.innerHTML = "<h2>Excellent! 🎉</h2>"; subtext.innerText = refText;
    document.getElementById('question-avatar').className = 'avatar jump';
    speak("Correct!");
  } else {
    playSound('wrong'); footer.classList.add('wrong');
    if(!answerSelected) msg.innerHTML = `<h2>Time's up! ⏰</h2>`;
    else msg.innerHTML = `<h2>Incorrect 😔</h2>`;
    subtext.innerText = `The correct answer was: ${correctTxt}. ${refText}`;
    speak("Incorrect.");
  }
  updateStats();
}

function onNext() {
  if (gameMode === 'multi') {
    currentTurn++;
    if (currentTurn >= maxTurnsPerRound) endQuiz();
    else { questionIndex++; loadQuestion(); }
  } else {
    questionIndex++;
    if (questionIndex >= currentQuestions.length) endQuiz();
    else loadQuestion();
  }
}

function endQuiz() {
  topBar.classList.add('hidden');
  playSound('complete');
  
  const bContainer = document.getElementById('badges-container');
  bContainer.innerHTML = '';
  document.getElementById('encouragement-message').innerText = "";
  
  if (gameMode === 'multi') {
    document.getElementById('result-title').innerText = "Round Complete!";
    document.querySelector('.score-summary').innerHTML = `
      <p style="font-size:2rem;color:var(--primary);margin-bottom:10px;">${players[0].name} : ${players[0].score} pts</p>
      <p style="font-size:2rem;color:var(--secondary);">${players[1].name} : ${players[1].score} pts</p>
    `;
    let winner = null;
    if (players[0].score > players[1].score) winner = players[0].name;
    else if (players[1].score > players[0].score) winner = players[1].name;
    
    if (winner) {
      document.getElementById('encouragement-message').innerText = `🏆 ${winner} wins!`;
      speak(winner + " wins the game!");
    } else {
      document.getElementById('encouragement-message').innerText = "It's a Tie!";
      speak("It's a tie game!");
    }
  } else {
    document.getElementById('result-title').innerText = "Quiz Complete!";
    document.querySelector('.score-summary').innerHTML = `
      <p>Final Score: <span class="highlight">${score}</span></p>
      <p>Longest Streak: <span class="highlight">${maxStreak}</span></p>
    `;
    
    const date = new Date().toLocaleDateString();
    leaderboards.push({ score, date, streak: maxStreak });
    leaderboards.sort((a,b) => b.score - a.score);
    leaderboards = leaderboards.slice(0, 10);
    localStorage.setItem('bibleQuizLeaderboard', JSON.stringify(leaderboards));
    
    let percentage = score / (currentQuestions.length * 10);
    if (percentage >= 0.9) bContainer.innerHTML += '<div class="badge">Bible Scholar</div>';
    else if (percentage >= 0.5) bContainer.innerHTML += '<div class="badge">Faith Starter</div>';
    if (maxStreak >= 5) bContainer.innerHTML += '<div class="badge">Hot Streak 🔥</div>';
  }
  
  switchScreen('result');
}

function showLeaderboards() {
  const list = document.getElementById('leaderboard-list');
  list.innerHTML = '';
  leaderboards.forEach((entry, idx) => {
    const row = document.createElement('div');
    row.className = 'leaderboard-row';
    row.innerHTML = `<span>#${idx+1}</span> <span>${entry.score} pts</span> <span>${entry.date}</span>`;
    list.appendChild(row);
  });
  if(leaderboards.length === 0) list.innerHTML = `<div class="leaderboard-row">No scores yet!</div>`;
  switchScreen('leaderboard');
}

// Scroll Wheel/To-Top Button Logic
function setupScrollButton() {
  const scrollBtn = document.getElementById('scroll-top-btn');
  if(!scrollBtn) return;
  
  window.addEventListener('scroll', () => {
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
      scrollBtn.classList.remove('hidden');
    } else {
      scrollBtn.classList.add('hidden');
    }
  });

  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  setupScrollButton();
});
