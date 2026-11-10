/* ====================================================================
   DISSOLVING NOTEPAD - GAME ENGINE & PROCEDURAL AUDIO SYNTHESIZER
   ==================================================================== */

// --- 1. PROCEDURAL AUDIO SYNTHESIZER (Web Audio API) ---
// Generates water bubbling, typewriter key clicks, paper tear, success splash, and submerged dissolve sounds
class WaterAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.ambientGain = null;
    this.ambientNoise = null;
    this.ambientFilter = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.startAmbientWater();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startAmbientWater() {
    try {
      // Pink noise generator through resonant bandpass filter to simulate underwater current
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      const whiteNoiseSource = this.ctx.createBufferSource();
      whiteNoiseSource.buffer = noiseBuffer;
      whiteNoiseSource.loop = true;

      this.ambientFilter = this.ctx.createBiquadFilter();
      this.ambientFilter.type = 'lowpass';
      this.ambientFilter.frequency.setValueAtTime(260, this.ctx.currentTime);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.enabled ? 0.08 : 0, this.ctx.currentTime);

      whiteNoiseSource.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      whiteNoiseSource.start(0);
    } catch (e) {
      console.warn("Ambient audio init skipped:", e);
    }
  }

  setMute(isMuted) {
    this.enabled = !isMuted;
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(this.enabled ? 0.08 : 0, this.ctx.currentTime);
    }
  }

  // Typewriter pen stroke / click
  playTypeKey() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650 + Math.random() * 150, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  // Bubble pop
  playBubble() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startFreq = 400 + Math.random() * 300;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 2.1, now + 0.08);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  // Word saved chime / water splash
  playWordSaved() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteStart = now + idx * 0.05;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.08, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.26);
      });
      // Add small water splash sound
      this.playSplash();
    } catch (e) {}
  }

  playSplash() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  // Mistake / Sinking groan
  playError() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  // Final dissolve / Game Over deep submersion wash
  playDrown() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.9);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.95);
    } catch (e) {}
  }
}

// --- 2. VOCABULARY BANKS (By difficulty & thematic flavor) ---
const WORD_VAULT = {
  normal: [
    { word: "SURFACE", hint: "Top of the water" },
    { word: "BUBBLE", hint: "Pocket of rising air" },
    { word: "DISSOLVE", hint: "Break down into water" },
    { word: "LIQUID", hint: "Flowing state of matter" },
    { word: "INKWELL", hint: "A reservoir of fluid ink" },
    { word: "ABSORB", hint: "Soak up moisture" },
    { word: "MOISTURE", hint: "Dampness in the paper" },
    { word: "PULP", hint: "Melted fibrous paper mass" },
    { word: "FADING", hint: "Disappearing before your eyes" },
    { word: "SUBMERGE", hint: "Plunge completely underwater" },
    { word: "SPLASH", hint: "A sudden droplet scatter" },
    { word: "CURRENT", hint: "Flowing stream inside water" },
    { word: "RIPPLE", hint: "Undulation across surface" },
    { word: "DAMPEN", hint: "Soaking the notepad" },
    { word: "SATURATE", hint: "Full of fluid" },
    { word: "DISPERSE", hint: "Ink pigment scattering" },
    { word: "VANISH", hint: "Gone forever" }
  ],
  panic: [
    { word: "RUSH", hint: "Move with urgency" },
    { word: "WET", hint: "Covered in liquid" },
    { word: "INK", hint: "Fluid writing medium" },
    { word: "DROP", hint: "A tiny sphere of rain" },
    { word: "FAST", hint: "Before the paper disintegrates" },
    { word: "TEAR", hint: "Split fiber" },
    { word: "FLOW", hint: "Continuous stream" },
    { word: "SINK", hint: "Descend into abyss" },
    { word: "PALE", hint: "Losing pigmentation" },
    { word: "FOAM", hint: "Froth on the surface" },
    { word: "BLUR", hint: "Loss of crisp clarity" },
    { word: "TIDE", hint: "Rising level" }
  ],
  scholar: [
    { word: "DISINTEGRATION", hint: "The complete breakdown of physical matter" },
    { word: "CAPILLARITY", hint: "Action of fluids drawing through porous fibers" },
    { word: "SUBMERSION", hint: "The act of plunging into a liquid body" },
    { word: "DELIQUESCENCE", hint: "Tendency to melt or dissolve by moisture" },
    { word: "SOLUBILITY", hint: "Capacity to be dissolved completely in water" },
    { word: "CHROMATOGRAPHY", hint: "Separation of waterborne ink pigments" },
    { word: "HYDROLOGICAL", hint: "Pertaining to water properties and flow" },
    { word: "CONDENSATION", hint: "Moisture droplets gathering on paper" },
    { word: "PERMEABILITY", hint: "The ease with which fluid penetrates fibers" },
    { word: "PRECIPITATION", hint: "Falling condensed moisture" }
  ]
};

// --- 3. GAME STATE CONTROLLER ---
class DissolvingNotepadGame {
  constructor() {
    this.audio = new WaterAudioEngine();

    // DOM Elements
    this.dom = {
      score: document.getElementById('scoreDisplay'),
      streak: document.getElementById('streakDisplay'),
      stage: document.getElementById('stageDisplay'),
      submerge: document.getElementById('submergeDisplay'),
      soundToggle: document.getElementById('soundToggle'),
      memoDate: document.getElementById('memoDate'),
      paperStatus: document.getElementById('paperStatusBadge'),
      targetWordBox: document.getElementById('targetWordBox'),
      wordHint: document.getElementById('wordHint'),
      wordInput: document.getElementById('wordInput'),
      inputFeedback: document.getElementById('inputFeedback'),
      paperSheet: document.getElementById('paperSheet'),
      paperSubmergeFill: document.getElementById('paperSubmergeFill'),
      waterRiseLayer: document.getElementById('waterRiseLayer'),
      waterSurfaceLine: document.getElementById('waterSurfaceLine'),
      timerFill: document.getElementById('timerFill'),
      timeLeftSeconds: document.getElementById('timeLeftSeconds'),
      modalBackdrop: document.getElementById('modalBackdrop'),
      startModal: document.getElementById('startModal'),
      gameOverModal: document.getElementById('gameOverModal'),
      startBtn: document.getElementById('startBtn'),
      restartBtn: document.getElementById('restartBtn'),
      finalScore: document.getElementById('finalScore'),
      finalStreak: document.getElementById('finalStreak'),
      highScoreStat: document.getElementById('highScoreStat'),
      diffButtons: document.querySelectorAll('.diff-btn'),
      dissolveCanvas: document.getElementById('dissolveCanvas'),
      bubbleCanvas: document.getElementById('bubbleCanvas'),
      splashCanvas: document.getElementById('splashCanvas')
    };

    // Canvas Contexts
    this.dissolveCtx = this.dom.dissolveCanvas.getContext('2d');
    this.bubbleCtx = this.dom.bubbleCanvas.getContext('2d');
    this.splashCtx = this.dom.splashCanvas.getContext('2d');

    // Game Variables
    this.difficulty = 'normal';
    this.wordsSaved = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.stage = 1;
    this.submergePercentage = 0; // 0 to 100%
    this.highScore = parseInt(localStorage.getItem('dissolving_notepad_high') || '0', 10);

    // Current word & round timer
    this.currentWord = "";
    this.currentHint = "";
    this.maxTime = 7.0; // Seconds allowed for current word
    this.timeLeft = 7.0;
    this.isPlaying = false;
    this.lastFrameTime = performance.now();

    // Particle engines
    this.bubbles = [];
    this.inkSplashes = [];
    this.dissolveHoles = []; // Holes appearing on the paper

    // Setup bindings
    this.setupListeners();
    this.resizeCanvases();
    window.addEventListener('resize', () => this.resizeCanvases());

    // Start background particle loop
    this.initBackgroundEffects();
    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvases() {
    // Bubble canvas covers viewport
    this.dom.bubbleCanvas.width = window.innerWidth;
    this.dom.bubbleCanvas.height = window.innerHeight;

    // Dissolve canvas matches paper rect
    const paperRect = this.dom.paperSheet.getBoundingClientRect();
    this.dom.dissolveCanvas.width = paperRect.width || 580;
    this.dom.dissolveCanvas.height = paperRect.height || 440;

    // Splash canvas
    const waterLayer = this.dom.waterRiseLayer.getBoundingClientRect();
    this.dom.splashCanvas.width = waterLayer.width || 800;
    this.dom.splashCanvas.height = waterLayer.height || 400;
  }

  setupListeners() {
    // Sound Toggle
    this.dom.soundToggle.addEventListener('click', () => {
      this.audio.init();
      const nextState = !this.audio.enabled;
      this.audio.setMute(!nextState);
      this.dom.soundToggle.textContent = nextState ? '🔊 Audio: ON' : '🔇 Audio: OFF';
    });

    // Difficulty buttons
    this.dom.diffButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.dom.diffButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.difficulty = btn.dataset.diff;
      });
    });

    // Start / Restart
    this.dom.startBtn.addEventListener('click', () => this.startGame());
    this.dom.restartBtn.addEventListener('click', () => this.startGame());

    // Player typing input handler
    this.dom.wordInput.addEventListener('input', (e) => this.handleTyping(e));

    // Focus input when clicking anywhere on paper
    this.dom.paperSheet.addEventListener('click', () => {
      if (this.isPlaying) {
        this.dom.wordInput.focus();
      }
    });
  }

  startGame() {
    this.audio.init();
    this.wordsSaved = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.stage = 1;
    this.submergePercentage = 0;
    this.dissolveHoles = [];
    this.inkSplashes = [];

    // Hide modals
    this.dom.startModal.classList.add('hidden');
    this.dom.gameOverModal.classList.add('hidden');
    this.dom.modalBackdrop.classList.add('hidden');

    this.isPlaying = true;
    this.dom.wordInput.disabled = false;
    this.dom.wordInput.value = "";
    this.dom.wordInput.focus();

    this.updateHUD();
    this.nextWord();
  }

  nextWord() {
    const list = WORD_VAULT[this.difficulty] || WORD_VAULT.normal;
    // Pick word different from current
    let choice;
    do {
      choice = list[Math.floor(Math.random() * list.length)];
    } while (choice.word === this.currentWord && list.length > 1);

    this.currentWord = choice.word.toUpperCase();
    this.currentHint = choice.hint;

    // Calculate time based on word length, stage and difficulty
    let baseTime = 4.0 + this.currentWord.length * 0.7;
    if (this.difficulty === 'panic') baseTime *= 0.65;
    if (this.difficulty === 'scholar') baseTime *= 0.95;

    // Stage scaling (speeds up as you advance)
    const stageSpeedFactor = Math.max(0.65, 1 - (this.stage - 1) * 0.04);
    this.maxTime = Math.max(2.2, baseTime * stageSpeedFactor);
    this.timeLeft = this.maxTime;

    this.dom.wordInput.value = "";
    this.dom.wordHint.textContent = `"${this.currentHint}"`;
    this.dom.memoDate.textContent = `NOTE #${this.wordsSaved + 1} • URGENT`;

    this.renderWordProgress("");
    this.dom.inputFeedback.textContent = "Type the word accurately!";
    this.dom.inputFeedback.style.color = "#6c5a45";
  }

  renderWordProgress(typed) {
    typed = typed.toUpperCase();
    let html = "";
    for (let i = 0; i < this.currentWord.length; i++) {
      const char = this.currentWord[i];
      if (i < typed.length) {
        if (typed[i] === char) {
          html += `<span class="char-correct">${char}</span>`;
        } else {
          html += `<span class="char-wrong">${char}</span>`;
        }
      } else {
        html += `<span class="char-pending">${char}</span>`;
      }
    }
    this.dom.targetWordBox.innerHTML = html;
  }

  handleTyping(e) {
    if (!this.isPlaying) return;
    const typed = this.dom.wordInput.value.toUpperCase();
    this.audio.playTypeKey();

    this.renderWordProgress(typed);

    // Check if correct prefix
    if (!this.currentWord.startsWith(typed)) {
      // Mistake made
      this.dom.inputFeedback.textContent = "Typo! Letters are melting into water!";
      this.dom.inputFeedback.style.color = "#dc2626";
      this.audio.playError();
      this.addDissolveEffect(0.5); // Punish with faster dissolve
    } else {
      this.dom.inputFeedback.textContent = "Transcribing...";
      this.dom.inputFeedback.style.color = "#059669";
    }

    // Fully matched
    if (typed === this.currentWord) {
      this.onWordSuccess();
    }
  }

  onWordSuccess() {
    this.audio.playWordSaved();
    this.wordsSaved++;
    this.streak++;
    if (this.streak > this.maxStreak) this.maxStreak = this.streak;

    // Check stage up
    this.stage = Math.floor(this.wordsSaved / 5) + 1;

    // Reward: reduce water submersion slightly on correct words
    this.submergePercentage = Math.max(0, this.submergePercentage - 7);

    // Cleanse some dissolve holes
    if (this.dissolveHoles.length > 0) {
      this.dissolveHoles.splice(0, 3);
    }

    // Trigger visual confetti splash
    this.triggerSplashParticles();

    // Success animation on paper
    this.dom.paperSheet.classList.add('success-glow');
    setTimeout(() => {
      this.dom.paperSheet.classList.remove('success-glow');
    }, 450);

    this.updateHUD();
    this.nextWord();
  }

  addDissolveEffect(intensity = 1.0) {
    // Add random dissolved water spots/holes on paper canvas
    const w = this.dom.dissolveCanvas.width;
    const h = this.dom.dissolveCanvas.height;

    for (let i = 0; i < Math.ceil(intensity * 4); i++) {
      this.dissolveHoles.push({
        x: 40 + Math.random() * (w - 80),
        y: h - Math.random() * (h * (this.submergePercentage / 100 + 0.2)),
        radius: 6 + Math.random() * 18,
        opacity: 0.15 + Math.random() * 0.45,
        growth: 0.2 + Math.random() * 0.4
      });
    }

    if (Math.random() < 0.4) {
      this.audio.playBubble();
    }
  }

  triggerSplashParticles() {
    const w = this.dom.splashCanvas.width;
    const h = this.dom.splashCanvas.height;
    for (let i = 0; i < 22; i++) {
      this.inkSplashes.push({
        x: w / 2 + (Math.random() * 200 - 100),
        y: h - 20,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 9 - 4,
        size: 3 + Math.random() * 6,
        alpha: 1
      });
    }
  }

  updateHUD() {
    this.dom.score.textContent = this.wordsSaved;
    this.dom.streak.textContent = this.streak;
    this.dom.stage.textContent = this.stage;
    this.dom.submergeDisplay.textContent = `${Math.min(100, Math.floor(this.submergePercentage))}%`;

    // Status badge on paper
    if (this.submergePercentage < 25) {
      this.dom.paperStatus.textContent = "DRY & CRISP";
      this.dom.paperStatus.style.background = "#e8ded0";
      this.dom.paperStatus.style.color = "#5d4b35";
    } else if (this.submergePercentage < 60) {
      this.dom.paperStatus.textContent = "DAMP & SOGGY";
      this.dom.paperStatus.style.background = "#bfe4ea";
      this.dom.paperStatus.style.color = "#075569";
    } else if (this.submergePercentage < 85) {
      this.dom.paperStatus.textContent = "DISINTEGRATING!";
      this.dom.paperStatus.style.background = "#fcd34d";
      this.dom.paperStatus.style.color = "#78350f";
    } else {
      this.dom.paperStatus.textContent = "WATERLOGGED MELT";
      this.dom.paperStatus.style.background = "#fca5a5";
      this.dom.paperStatus.style.color = "#991b1b";
    }

    // Physical water visual height
    const waterHeightPct = Math.min(100, this.submergePercentage);
    this.dom.waterRiseLayer.style.height = `${waterHeightPct}%`;
    this.dom.paperSubmergeFill.style.height = `${waterHeightPct}%`;
    this.dom.waterSurfaceLine.style.bottom = `${waterHeightPct}%`;

    // Blur & distortion on paper as it sinks
    const blurAmount = (this.submergePercentage / 100) * 4;
    const saturateVal = 1 - (this.submergePercentage / 100) * 0.4;
    this.dom.paperSheet.style.filter = `blur(${blurAmount}px) saturate(${saturateVal})`;
  }

  triggerGameOver(reason = "DISSOLVED") {
    this.isPlaying = false;
    this.dom.wordInput.disabled = true;
    this.audio.playDrown();

    // Check high score
    if (this.wordsSaved > this.highScore) {
      this.highScore = this.wordsSaved;
      localStorage.setItem('dissolving_notepad_high', this.highScore);
    }

    // Paper shake & sink into oblivion
    this.dom.paperSheet.classList.add('shake');
    this.dom.waterRiseLayer.style.height = `100%`;
    this.dom.paperSubmergeFill.style.height = `100%`;

    setTimeout(() => {
      this.dom.paperSheet.classList.remove('shake');
      this.dom.finalScore.textContent = this.wordsSaved;
      this.dom.finalStreak.textContent = this.maxStreak;
      this.dom.highScoreStat.textContent = this.highScore;

      this.dom.gameOverModal.classList.remove('hidden');
      this.dom.modalBackdrop.classList.remove('hidden');
    }, 700);
  }

  // --- Background ambient bubbles & tank physics ---
  initBackgroundEffects() {
    this.bubbles = [];
    const count = 35;
    for (let i = 0; i < count; i++) {
      this.bubbles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: 2 + Math.random() * 8,
        speed: 0.6 + Math.random() * 1.8,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.04
      });
    }
  }

  // --- Main Animation & Time Loop ---
  loop(currentTime) {
    const dt = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    if (this.isPlaying) {
      this.timeLeft -= dt;

      // As time ticks down on current word, water submergence naturally rises
      const waterRiseRate = (100 / this.maxTime) * 0.22; // submerge rate
      this.submergePercentage = Math.min(100, this.submergePercentage + waterRiseRate * dt);

      // Periodically spawn dissolve fiber holes
      if (Math.random() < 0.25) {
        this.addDissolveEffect(0.3);
      }

      // Check if time expired for current word
      if (this.timeLeft <= 0) {
        this.streak = 0;
        this.audio.playError();
        this.submergePercentage += 18; // Heavy penalty for missing a word
        this.dom.paperSheet.classList.add('shake');
        setTimeout(() => this.dom.paperSheet.classList.remove('shake'), 300);

        if (this.submergePercentage >= 100) {
          this.triggerGameOver("SUBMERGED");
        } else {
          this.updateHUD();
          this.nextWord();
        }
      }

      // Check total water submergence collapse
      if (this.submergePercentage >= 100) {
        this.triggerGameOver("DISSOLVED");
      }

      // Update timer bar UI
      const progressPercent = Math.max(0, (this.timeLeft / this.maxTime) * 100);
      this.dom.timerFill.style.width = `${progressPercent}%`;
      this.dom.timeLeftSeconds.textContent = `${Math.max(0, this.timeLeft).toFixed(1)}s`;

      this.updateHUD();
    }

    // Render Canvas Layers
    this.renderBubbles();
    this.renderDissolveCanvas();
    this.renderSplashCanvas();

    requestAnimationFrame((t) => this.loop(t));
  }

  renderBubbles() {
    const ctx = this.bubbleCtx;
    ctx.clearRect(0, 0, this.dom.bubbleCanvas.width, this.dom.bubbleCanvas.height);

    ctx.fillStyle = 'rgba(80, 228, 255, 0.25)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;

    for (let b of this.bubbles) {
      b.y -= b.speed;
      b.wobble += b.wobbleSpeed;
      const xOffset = Math.sin(b.wobble) * 1.5;

      if (b.y < -20) {
        b.y = this.dom.bubbleCanvas.height + 20;
        b.x = Math.random() * this.dom.bubbleCanvas.width;
      }

      ctx.beginPath();
      ctx.arc(b.x + xOffset, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bubble highlight speck
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(b.x + xOffset - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(80, 228, 255, 0.25)';
    }
  }

  renderDissolveCanvas() {
    const ctx = this.dissolveCtx;
    ctx.clearRect(0, 0, this.dom.dissolveCanvas.width, this.dom.dissolveCanvas.height);

    // Draw ink bleeds and dissolving holes eaten away by water
    for (let i = this.dissolveHoles.length - 1; i >= 0; i--) {
      const hole = this.dissolveHoles[i];
      hole.radius += hole.growth * 0.1;

      // Soft water droplet / soaked fiber spot
      const grad = ctx.createRadialGradient(hole.x, hole.y, 0, hole.x, hole.y, hole.radius);
      grad.addColorStop(0, `rgba(20, 96, 122, ${hole.opacity * 0.8})`);
      grad.addColorStop(0.7, `rgba(189, 162, 120, ${hole.opacity * 0.5})`);
      grad.addColorStop(1, 'rgba(249, 246, 234, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
      ctx.fill();

      // Cap size
      if (hole.radius > 65) {
        this.dissolveHoles.splice(i, 1);
      }
    }
  }

  renderSplashCanvas() {
    const ctx = this.splashCtx;
    ctx.clearRect(0, 0, this.dom.splashCanvas.width, this.dom.splashCanvas.height);

    for (let i = this.inkSplashes.length - 1; i >= 0; i--) {
      const p = this.inkSplashes[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.alpha -= 0.025;

      ctx.fillStyle = `rgba(80, 228, 255, ${Math.max(0, p.alpha)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      if (p.alpha <= 0) {
        this.inkSplashes.splice(i, 1);
      }
    }
  }
}

// Auto-boot game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new DissolvingNotepadGame();
});
