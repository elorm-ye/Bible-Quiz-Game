// Running in Browser or Node

// State
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

const avatars = ['🧔🏽‍♂️', '🧙‍♂️', '👦🏽', '🧕', '👼', '📜', '🕊️'];

// Audio Synthesis for offline sounds
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
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  } else if (type === 'wrong') {
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
  } else if (type === 'complete') {
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.4);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.8);
  }
}

// DOM Elements
const screens = {
  welcome: document.getElementById('welcome-screen'),
  category: document.getElementById('category-screen'),
  question: document.getElementById('question-screen'),
  result: document.getElementById('result-screen')
};
const topBar = document.getElementById('top-bar');

function switchScreen(screenKey) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screens[screenKey].classList.remove('hidden');
  
  if (screenKey === 'question') {
    topBar.classList.remove('hidden');
  } else {
    topBar.classList.add('hidden');
  }
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
      buildCategoryGrid();
      switchScreen('category');
    });

    document.getElementById('btn-next').addEventListener('click', onNext);
    document.getElementById('btn-restart').addEventListener('click', startQuiz);
    document.getElementById('btn-home').addEventListener('click', () => {
      buildCategoryGrid();
      switchScreen('category');
    });

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
  
  // Add "All" category option
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
  if (selectedCategory === 'All') {
    currentQuestions = [...allQuestions].sort(() => 0.5 - Math.random());
  } else {
    currentQuestions = allQuestions.filter(q => q.category === selectedCategory).sort(() => 0.5 - Math.random());
  }
  
  questionIndex = 0;
  score = 0;
  streak = 0;
  maxStreak = 0;
  answerSelected = false;
  
  updateStats();
  switchScreen('question');
  loadQuestion();
}

function updateStats() {
  document.getElementById('score-counter').innerText = score;
  document.getElementById('streak-counter').innerText = streak;
  
  const prog = ((questionIndex) / currentQuestions.length) * 100;
  document.getElementById('progress-bar-fill').style.width = prog + '%';
}

function loadQuestion() {
  const q = currentQuestions[questionIndex];
  answerSelected = false;
  
  // Reset Timer
  timeLeft = 15;
  document.getElementById('timer-display').innerText = timeLeft;
  document.getElementById('timer-display').style.color = '#ff4b4b';
  clearInterval(timerInterval);
  timerInterval = setInterval(timerTick, 1000);
  
  // Hide feedback footer
  document.getElementById('feedback-footer').classList.add('hidden');
  document.getElementById('feedback-footer').className = '';
  document.getElementById('feedback-footer').classList.add('hidden');
  
  // Set avatar & question
  const randAvatar = avatars[Math.floor(Math.random() * avatars.length)];
  document.getElementById('question-avatar').innerText = randAvatar;
  document.getElementById('question-speech').innerText = q.question;
  
  // Options
  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
  
  // Shuffle options
  const shuffledOpts = [...q.options].sort(() => 0.5 - Math.random());
  shuffledOpts.forEach(opt => {
    const card = document.createElement('div');
    card.className = 'option-card';
    card.innerText = opt;
    card.onclick = () => onOptionSelected(opt, card, q.answer, shuffledOpts);
    grid.appendChild(card);
  });
}

function timerTick() {
  timeLeft--;
  document.getElementById('timer-display').innerText = timeLeft;
  if(timeLeft <= 5) document.getElementById('timer-display').style.color = 'darkred';
  
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    // Auto mark wrong if time runs out
    const cards = document.querySelectorAll('.option-card');
    cards.forEach(c => c.classList.add('disabled'));
    const q = currentQuestions[questionIndex];
    onAnswerEvaluated(false, q.answer, cards);
  }
}

function onOptionSelected(selectedTxt, cardEl, correctTxt, opts) {
  if (answerSelected) return;
  answerSelected = true;
  clearInterval(timerInterval);
  
  const isCorrect = (selectedTxt === correctTxt);
  const cards = document.querySelectorAll('.option-card');
  cards.forEach(c => c.classList.add('disabled'));
  
  if (isCorrect) {
    cardEl.classList.add('selected-correct');
  } else {
    cardEl.classList.add('selected-wrong');
    // Highlight correct
    cards.forEach(c => {
      if (c.innerText === correctTxt) {
        c.classList.add('correct-answer');
      }
    });
  }
  
  onAnswerEvaluated(isCorrect, correctTxt, cards);
}

function onAnswerEvaluated(isCorrect, correctTxt, cards) {
  const footer = document.getElementById('feedback-footer');
  const msg = document.getElementById('feedback-message');
  footer.classList.remove('hidden');
  
  if (isCorrect) {
    score += 10 + (streak * 2); // bonus for streak
    streak++;
    if (streak > maxStreak) maxStreak = streak;
    
    playSound('correct');
    footer.classList.add('correct');
    msg.innerHTML = "<h2>Excellent! 🎉</h2>";
    document.getElementById('question-avatar').classList.remove('bounce-in');
    void document.getElementById('question-avatar').offsetWidth;
    document.getElementById('question-avatar').classList.add('jump');
  } else {
    streak = 0;
    playSound('wrong');
    footer.classList.add('wrong');
    msg.innerHTML = `<h2>Incorrect 😔</h2><p style="color:var(--danger-shadow); font-weight:700;">The correct answer was: ${correctTxt}</p>`;
    
    if(!answerSelected) msg.innerHTML = `<h2>Time's up! ⏰</h2><p style="color:var(--danger-shadow); font-weight:700;">The correct answer was: ${correctTxt}</p>`;
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
  switchScreen('result');
}

// Run
document.addEventListener('DOMContentLoaded', init);
