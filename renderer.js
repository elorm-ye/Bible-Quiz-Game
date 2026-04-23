// Running in Browser
let allQuestions = [];
let availableCategories = [];
let selectedCategory = '';
let currentQuestions = [];
let questionIndex = 0;
let score = 0;
let streak = 0;
let maxStreak = 0;
let timeLeft = 15;
let timerInterval = null;
let answerSelected = false;

// New Features State
let selectedDifficulty = 'Any';
let ttsEnabled = false;
let lifelines = { fifty: 1, skip: 1, hint: 1 };
let leaderboards = JSON.parse(localStorage.getItem('bibleQuizLeaderboard')) || [];
let currentQuestionType = 'multiple_choice';

const avatars = ['🧔🏽‍♂️', '🧙‍♂️', '👦🏽', '🧕', '👼', '📜', '🕊️'];

// Audio Synthesis for offline sound effects
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

// Text to Speech
function speak(text) {
  if (!ttsEnabled) return;
  window.speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = 0.9;
  window.speechSynthesis.speak(msg);
}

// DOM Elements
const screens = {
  welcome: document.getElementById('welcome-screen'),
  category: document.getElementById('category-screen'),
  question: document.getElementById('question-screen'),
  result: document.getElementById('result-screen'),
  leaderboard: document.getElementById('leaderboard-screen')
};
const topBar = document.getElementById('top-bar');

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
    if (!response.ok) throw new Error("Network request failed");
    allQuestions = await response.json();
    
    availableCategories = [...new Set(allQuestions.map(q => q.category))];
    
    // Bind buttons
    document.getElementById('btn-start').addEventListener('click', () => {
      selectedDifficulty = document.getElementById('difficulty-select').value;
      buildCategoryGrid();
      switchScreen('category');
    });

    document.getElementById('btn-next').addEventListener('click', onNext);
    document.getElementById('btn-restart').addEventListener('click', () => switchScreen('welcome'));
    document.getElementById('btn-home').addEventListener('click', () => switchScreen('welcome'));
    
    document.getElementById('btn-leaderboard').addEventListener('click', showLeaderboards);
    document.getElementById('btn-leaderboard-back').addEventListener('click', () => switchScreen('welcome'));

    // TTS Toggle
    const ttsBtn = document.getElementById('btn-tts');
    ttsBtn.addEventListener('click', () => {
      ttsEnabled = !ttsEnabled;
      if(ttsEnabled) { ttsBtn.classList.remove('disabled-icon'); speak("Audio enabled."); }
      else ttsBtn.classList.add('disabled-icon');
    });
    ttsBtn.classList.add('disabled-icon');

    // Submit Blank
    document.getElementById('btn-submit-blank').addEventListener('click', () => {
      const val = document.getElementById('fill-blank-input').value.trim();
      if(!val) return;
      onOptionSelected(val.toLowerCase(), null, currentQuestions[questionIndex].answer.toLowerCase(), []);
    });

    // Lifeline Binds
    document.getElementById('life-5050').addEventListener('click', use5050);
    document.getElementById('life-skip').addEventListener('click', useSkip);
    document.getElementById('life-hint').addEventListener('click', useHint);

  } catch (error) {
    console.error("Failed to load questions", error);
    alert("Could not load questions data.");
  }
}

function buildCategoryGrid() {
  const grid = document.getElementById('category-grid');
  grid.innerHTML = '';
  availableCategories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.innerText = cat;
    card.addEventListener('click', () => {
      selectedCategory = cat;
      startQuiz();
    });
    grid.appendChild(card);
  });
  
  const allCard = document.createElement('div');
  allCard.className = 'category-card';
  allCard.innerText = 'Mix All';
  allCard.style.borderColor = 'var(--primary)';
  allCard.addEventListener('click', () => {
    selectedCategory = 'All';
    startQuiz();
  });
  grid.appendChild(allCard);
}

function startQuiz() {
  let pool = selectedCategory === 'All' ? [...allQuestions] : allQuestions.filter(q => q.category === selectedCategory);
  
  if (selectedDifficulty !== 'Any') {
    pool = pool.filter(q => (q.difficulty || 'medium').toLowerCase() === selectedDifficulty.toLowerCase());
  }
  if (pool.length === 0) {
    alert("No questions found for this difficulty/category combo!");
    return;
  }

  currentQuestions = pool.sort(() => 0.5 - Math.random()).slice(0, 15); // max 15 questions per round for pacing
  
  questionIndex = 0;
  score = 0;
  streak = 0;
  maxStreak = 0;
  lifelines = { fifty: 1, skip: 1, hint: 1 };
  
  updateStats();
  switchScreen('question');
  loadQuestion();
}

function updateStats() {
  document.getElementById('score-counter').innerText = score;
  document.getElementById('streak-counter').innerText = streak;
  
  const prog = ((questionIndex) / currentQuestions.length) * 100;
  document.getElementById('progress-bar-fill').style.width = prog + '%';
  
  // Update lifelines buttons
  document.getElementById('life-5050').disabled = lifelines.fifty <= 0 || currentQuestionType === 'fill_blank';
  document.getElementById('life-skip').disabled = lifelines.skip <= 0;
  document.getElementById('life-hint').disabled = lifelines.hint <= 0;
}

function loadQuestion() {
  const q = currentQuestions[questionIndex];
  answerSelected = false;
  currentQuestionType = q.type || 'multiple_choice';
  
  // Timers
  timeLeft = 15;
  document.getElementById('timer-display').innerText = timeLeft;
  document.getElementById('timer-display').style.color = '#ff4b4b';
  clearInterval(timerInterval);
  timerInterval = setInterval(timerTick, 1000);
  
  // UI Reset
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
  const fillArea = document.getElementById('fill-blank-area');
  grid.innerHTML = '';
  
  if (currentQuestionType === 'fill_blank') {
    grid.classList.add('hidden');
    fillArea.classList.remove('hidden');
    const input = document.getElementById('fill-blank-input');
    input.value = '';
    input.focus();
  } else {
    grid.classList.remove('hidden');
    fillArea.classList.add('hidden');
    
    let shuffledOpts = [...q.options].sort(() => 0.5 - Math.random());
    shuffledOpts.forEach(opt => {
      const card = document.createElement('div');
      card.className = 'option-card';
      card.innerText = opt;
      card.onclick = () => onOptionSelected(opt, card, q.answer, shuffledOpts);
      grid.appendChild(card);
    });
  }
}

function timerTick() {
  timeLeft--;
  document.getElementById('timer-display').innerText = timeLeft;
  if(timeLeft <= 5) document.getElementById('timer-display').style.color = 'darkred';
  
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    const cards = document.querySelectorAll('.option-card');
    cards.forEach(c => c.classList.add('disabled'));
    const q = currentQuestions[questionIndex];
    onAnswerEvaluated(false, q.answer, cards);
  }
}

function use5050() {
  if (lifelines.fifty <= 0 || answerSelected || currentQuestionType === 'fill_blank') return;
  lifelines.fifty = 0;
  updateStats();
  
  const q = currentQuestions[questionIndex];
  const cards = Array.from(document.querySelectorAll('.option-card'));
  let wrongCards = cards.filter(c => c.innerText !== q.answer);
  
  // remove half the wrong cards
  wrongCards = wrongCards.sort(() => 0.5 - Math.random()).slice(0, wrongCards.length - 1);
  wrongCards.forEach(c => c.classList.add('faded-out'));
}

function useSkip() {
  if (lifelines.skip <= 0 || answerSelected) return;
  lifelines.skip = 0;
  clearInterval(timerInterval);
  onNext();
}

function useHint() {
  if (lifelines.hint <= 0 || answerSelected) return;
  lifelines.hint = 0;
  updateStats();
  const q = currentQuestions[questionIndex];
  const hintBox = document.getElementById('hint-display');
  hintBox.innerText = "💡 Hint: " + (q.hint || "Trust your memory, no specific hint for this one!");
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
  
  if (isCorrect) {
    score += 10 + (streak * 2);
    streak++;
    if (streak > maxStreak) maxStreak = streak;
    
    playSound('correct');
    footer.classList.add('correct');
    msg.innerHTML = "<h2>Excellent! 🎉</h2>";
    subtext.innerText = refText;
    document.getElementById('question-avatar').classList.remove('bounce-in');
    void document.getElementById('question-avatar').offsetWidth;
    document.getElementById('question-avatar').classList.add('jump');
    speak("Correct!");
  } else {
    streak = 0;
    playSound('wrong');
    footer.classList.add('wrong');
    if(!answerSelected) msg.innerHTML = `<h2>Time's up! ⏰</h2>`;
    else msg.innerHTML = `<h2>Incorrect 😔</h2>`;
    
    subtext.innerText = `The correct answer was: ${correctTxt}. ${refText}`;
    speak("Incorrect.");
  }
  
  updateStats();
}

function onNext() {
  questionIndex++;
  if (questionIndex >= currentQuestions.length) {
    endQuiz();
  } else {
    loadQuestion();
  }
  updateStats();
}

function endQuiz() {
  topBar.classList.add('hidden');
  playSound('complete');
  
  document.getElementById('final-score').innerText = score;
  document.getElementById('final-streak').innerText = maxStreak;
  
  // Save Leaderboard
  const date = new Date().toLocaleDateString();
  leaderboards.push({ score, date, streak: maxStreak });
  leaderboards.sort((a,b) => b.score - a.score);
  leaderboards = leaderboards.slice(0, 10); // Keep top 10
  localStorage.setItem('bibleQuizLeaderboard', JSON.stringify(leaderboards));
  
  const bContainer = document.getElementById('badges-container');
  bContainer.innerHTML = '';
  
  let msg = "Great job! Keep studying the Word.";
  let percentage = score / (currentQuestions.length * 10);
  
  if (percentage >= 0.9) {
    msg = "Incredible! You are a Bible Scholar! 🏆";
    bContainer.innerHTML += '<div class="badge">Bible Scholar</div>';
  } else if (percentage >= 0.5) {
    msg = "Good work! You're on your way! 🌟";
    bContainer.innerHTML += '<div class="badge">Faith Starter</div>';
  } else {
    msg = "Keep reading and learning! 📖";
  }
  if (maxStreak >= 5) {
    bContainer.innerHTML += '<div class="badge">Hot Streak 🔥</div>';
  }
  
  document.getElementById('encouragement-message').innerText = msg;
  speak("Quiz complete. " + msg.replace(/[\u{1F600}-\u{1F6FF}]/gu, ''));
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

document.addEventListener('DOMContentLoaded', init);
