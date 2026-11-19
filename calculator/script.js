/**
 * Modern Minimalist Calculator Engine & UI Controller
 */

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(frequency, type = 'sine', duration = 0.04, gainVal = 0.06) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio fallback / silent fail
    }
  }

  playClick() {
    this.playTone(540, 'sine', 0.035, 0.04);
  }

  playOperator() {
    this.playTone(740, 'triangle', 0.05, 0.05);
  }

  playEquals() {
    this.playTone(880, 'sine', 0.08, 0.06);
    setTimeout(() => this.playTone(1100, 'sine', 0.1, 0.05), 45);
  }

  playClear() {
    this.playTone(320, 'triangle', 0.06, 0.06);
  }

  playError() {
    this.playTone(180, 'sawtooth', 0.15, 0.08);
  }
}

class Calculator {
  constructor(prevDisplayEl, currentDisplayEl, activeOpEl) {
    this.prevDisplayEl = prevDisplayEl;
    this.currentDisplayEl = currentDisplayEl;
    this.activeOpEl = activeOpEl;
    this.sound = new SoundEffects();
    this.history = JSON.parse(localStorage.getItem('calc_history') || '[]');
    this.clear();
  }

  clear() {
    this.currentOperand = '0';
    this.previousOperand = '';
    this.operation = undefined;
    this.shouldResetScreen = false;
    this.hasCalculated = false;
    this.updateDisplay();
  }

  delete() {
    if (this.shouldResetScreen) {
      this.clear();
      return;
    }
    if (this.currentOperand === 'Error' || this.currentOperand === 'Cannot divide by 0') {
      this.clear();
      return;
    }
    if (this.currentOperand.length === 1 || (this.currentOperand.length === 2 && this.currentOperand.startsWith('-'))) {
      this.currentOperand = '0';
    } else {
      this.currentOperand = this.currentOperand.slice(0, -1);
    }
    this.updateDisplay();
  }

  appendNumber(number) {
    if (this.shouldResetScreen) {
      if (number === '.') {
        this.currentOperand = '0.';
        this.shouldResetScreen = false;
        this.updateDisplay();
        return;
      }
      this.currentOperand = '';
      this.shouldResetScreen = false;
    }

    if (number === '.' && (this.currentOperand === '' || this.currentOperand === '0')) {
      this.currentOperand = '0.';
      this.updateDisplay();
      return;
    }

    if (this.currentOperand === '0' && number !== '.') {
      this.currentOperand = number.toString();
    } else {
      if (number === '.' && this.currentOperand.includes('.')) return;
      if (this.currentOperand.replace(/[^0-9]/g, '').length >= 15) return;
      this.currentOperand += number.toString();
    }
    this.updateDisplay();
  }

  chooseOperation(operation) {
    if (this.currentOperand === 'Cannot divide by 0' || this.currentOperand === 'Error') {
      this.clear();
      return;
    }

    // If an operator was already chosen and waiting for next operand, switch the operator
    if (this.shouldResetScreen && this.previousOperand !== '') {
      this.operation = operation;
      this.updateDisplay();
      return;
    }

    if (this.previousOperand !== '') {
      this.compute();
    }

    this.operation = operation;
    this.previousOperand = this.currentOperand;
    this.shouldResetScreen = true;
    this.updateDisplay();
  }

  compute() {
    let computation;
    const prev = parseFloat(this.previousOperand);
    const current = parseFloat(this.currentOperand);

    if (isNaN(prev) || isNaN(current)) return;

    switch (this.operation) {
      case '+':
        computation = prev + current;
        break;
      case '−':
      case '-':
        computation = prev - current;
        break;
      case '×':
      case '*':
        computation = prev * current;
        break;
      case '÷':
      case '/':
        if (current === 0) {
          this.triggerError('Cannot divide by 0');
          return;
        }
        computation = prev / current;
        break;
      default:
        return;
    }

    // Fix floating point imprecision e.g. 0.1 + 0.2 = 0.3
    computation = this.cleanPrecision(computation);

    const fullEquation = `${this.formatDisplayNumber(prev)} ${this.operation} ${this.formatDisplayNumber(current)}`;
    this.saveHistory(fullEquation, computation);

    this.currentOperand = computation.toString();
    this.previousOperand = '';
    this.operation = undefined;
    this.shouldResetScreen = true;
    this.hasCalculated = true;
    
    // Add pop pulse to the display
    this.currentDisplayEl.classList.remove('pulse-update');
    void this.currentDisplayEl.offsetWidth; // Reflow
    this.currentDisplayEl.classList.add('pulse-update');

    this.updateDisplay();
  }

  percent() {
    const current = parseFloat(this.currentOperand);
    if (isNaN(current)) return;

    let result;
    if (this.previousOperand && (this.operation === '+' || this.operation === '−' || this.operation === '-')) {
      const prev = parseFloat(this.previousOperand);
      result = prev * (current / 100);
    } else {
      result = current / 100;
    }

    this.currentOperand = this.cleanPrecision(result).toString();
    this.updateDisplay();
  }

  toggleSign() {
    if (this.currentOperand === '0' || this.currentOperand === '') return;
    if (this.currentOperand.startsWith('-')) {
      this.currentOperand = this.currentOperand.slice(1);
    } else {
      this.currentOperand = '-' + this.currentOperand;
    }
    this.updateDisplay();
  }

  cleanPrecision(num) {
    if (!isFinite(num)) return num;
    return parseFloat(num.toPrecision(12));
  }

  formatDisplayNumber(number) {
    if (number === '' || number === undefined || number === null) return '';
    if (typeof number === 'string' && (number === 'Cannot divide by 0' || number === 'Error')) {
      return number;
    }
    const stringNumber = number.toString();
    const integerDigits = parseFloat(stringNumber.split('.')[0]);
    const decimalDigits = stringNumber.split('.')[1];
    let integerDisplay;

    if (isNaN(integerDigits)) {
      integerDisplay = '';
    } else {
      integerDisplay = integerDigits.toLocaleString('en', {
        maximumFractionDigits: 0
      });
      if (stringNumber.startsWith('-') && integerDigits === 0) {
        integerDisplay = '-' + integerDisplay;
      }
    }

    if (decimalDigits != null) {
      return `${integerDisplay}.${decimalDigits}`;
    } else {
      return integerDisplay;
    }
  }

  triggerError(msg) {
    this.currentOperand = msg;
    this.previousOperand = '';
    this.operation = undefined;
    this.shouldResetScreen = true;
    this.updateDisplay();

    const container = document.querySelector('.calculator-container');
    container.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-9px)' },
      { transform: 'translateX(9px)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(0)' }
    ], {
      duration: 380,
      easing: 'ease-in-out'
    });

    this.sound.playError();
  }

  saveHistory(equation, result) {
    const item = {
      equation,
      result: this.formatDisplayNumber(result),
      rawResult: result,
      id: Date.now()
    };
    this.history.unshift(item);
    if (this.history.length > 30) this.history.pop();
    localStorage.setItem('calc_history', JSON.stringify(this.history));
    renderHistory();
  }

  updateDisplay() {
    const formatted = this.formatDisplayNumber(this.currentOperand);
    this.currentDisplayEl.innerText = formatted || '0';

    if (this.operation != null && this.previousOperand !== '') {
      this.prevDisplayEl.innerText = `${this.formatDisplayNumber(this.previousOperand)} ${this.operation}`;
      this.activeOpEl.innerText = this.operation;
      this.activeOpEl.classList.add('visible');
    } else {
      this.prevDisplayEl.innerText = '';
      this.activeOpEl.innerText = '';
      this.activeOpEl.classList.remove('visible');
    }

    this.adjustFontSize();

    // Highlight active operator button
    document.querySelectorAll('.op-key').forEach(button => {
      const op = button.getAttribute('data-operator');
      if (this.operation === op && this.shouldResetScreen) {
        button.classList.add('is-active');
      } else {
        button.classList.remove('is-active');
      }
    });
  }

  adjustFontSize() {
    const length = this.currentDisplayEl.innerText.length;
    if (length > 13) {
      this.currentDisplayEl.style.fontSize = '1.75rem';
    } else if (length > 10) {
      this.currentDisplayEl.style.fontSize = '2.2rem';
    } else if (length > 7) {
      this.currentDisplayEl.style.fontSize = '2.65rem';
    } else {
      this.currentDisplayEl.style.fontSize = '3.2rem';
    }
  }
}

/* ==========================================================================
   DOM Elements & Initialization
   ========================================================================== */
const prevDisplayEl = document.getElementById('prevExpression');
const currentDisplayEl = document.getElementById('currentOperand');
const activeOpEl = document.getElementById('activeOperator');
const displayArea = document.getElementById('displayArea');
const copyToast = document.getElementById('copyToast');

const themeToggle = document.getElementById('themeToggle');
const soundToggle = document.getElementById('soundToggle');
const historyToggle = document.getElementById('historyToggle');
const historyDrawer = document.getElementById('historyDrawer');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const historyList = document.getElementById('historyList');

const calculator = new Calculator(prevDisplayEl, currentDisplayEl, activeOpEl);

/* ==========================================================================
   Dynamic Click Ripple Effect
   ========================================================================== */
function createRipple(pos, button) {
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  const rect = button.getBoundingClientRect();
  const clientX = pos.clientX !== undefined ? pos.clientX : (rect.left + radius);
  const clientY = pos.clientY !== undefined ? pos.clientY : (rect.top + radius);

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${clientX - rect.left - radius}px`;
  circle.style.top = `${clientY - rect.top - radius}px`;
  circle.classList.add('ripple');

  const existingRipple = button.querySelector('.ripple');
  if (existingRipple) {
    existingRipple.remove();
  }

  button.appendChild(circle);
  setTimeout(() => circle.remove(), 550);
}

/* ==========================================================================
   Keypad Interaction Handling
   ========================================================================== */
document.querySelector('.keypad-grid').addEventListener('click', (e) => {
  const button = e.target.closest('.key');
  if (!button) return;

  createRipple({ clientX: e.clientX, clientY: e.clientY }, button);
  handleButtonAction(button);
});

function handleButtonAction(button) {
  const action = button.dataset.action;

  switch (action) {
    case 'number':
      calculator.sound.playClick();
      calculator.appendNumber(button.dataset.value);
      break;
    case 'decimal':
      calculator.sound.playClick();
      calculator.appendNumber('.');
      break;
    case 'operator':
      calculator.sound.playOperator();
      calculator.chooseOperation(button.dataset.operator);
      break;
    case 'calculate':
      calculator.sound.playEquals();
      calculator.compute();
      break;
    case 'clear':
      calculator.sound.playClear();
      calculator.clear();
      break;
    case 'toggle-sign':
      calculator.sound.playClick();
      calculator.toggleSign();
      break;
    case 'percent':
      calculator.sound.playClick();
      calculator.percent();
      break;
    case 'backspace':
      calculator.sound.playClick();
      calculator.delete();
      break;
  }
}

/* ==========================================================================
   Keyboard Support with Visual Press & Ripple Feedback
   ========================================================================== */
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  let key = e.key;
  let targetBtn = null;

  if (!isNaN(key) && key !== ' ') {
    targetBtn = document.querySelector(`[data-action="number"][data-value="${key}"]`);
  } else if (key === '.') {
    targetBtn = document.querySelector('[data-action="decimal"]');
  } else if (key === '+' || key === '-') {
    const op = key === '+' ? '+' : '−';
    targetBtn = document.querySelector(`[data-action="operator"][data-operator="${op}"]`);
  } else if (key === '*') {
    targetBtn = document.querySelector('[data-action="operator"][data-operator="×"]');
  } else if (key === '/') {
    e.preventDefault();
    targetBtn = document.querySelector('[data-action="operator"][data-operator="÷"]');
  } else if (key === 'Enter' || key === '=') {
    e.preventDefault();
    targetBtn = document.querySelector('[data-action="calculate"]');
  } else if (key === 'Backspace') {
    targetBtn = document.querySelector('[data-action="backspace"]');
  } else if (key === 'Escape') {
    targetBtn = document.querySelector('[data-action="clear"]');
  } else if (key === '%') {
    targetBtn = document.querySelector('[data-action="percent"]');
  }

  if (targetBtn) {
    targetBtn.classList.add('key-pressed');
    const rect = targetBtn.getBoundingClientRect();
    createRipple({
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    }, targetBtn);
    handleButtonAction(targetBtn);
    setTimeout(() => targetBtn.classList.remove('key-pressed'), 120);
  }
});

/* ==========================================================================
   Display Copy to Clipboard
   ========================================================================== */
displayArea.addEventListener('click', () => {
  const textToCopy = calculator.currentOperand;
  if (!textToCopy || textToCopy === 'Error' || textToCopy === 'Cannot divide by 0') return;

  navigator.clipboard.writeText(textToCopy).then(() => {
    copyToast.classList.add('show');
    calculator.sound.playClick();
    setTimeout(() => {
      copyToast.classList.remove('show');
    }, 1800);
  }).catch(() => {
    // Clipboard failed or blocked
  });
});

/* ==========================================================================
   History Drawer Management
   ========================================================================== */
function renderHistory() {
  if (calculator.history.length === 0) {
    historyList.innerHTML = '<div class="history-empty">No calculations yet</div>';
    return;
  }

  historyList.innerHTML = calculator.history.map(item => `
    <div class="history-item" data-value="${item.rawResult}">
      <span class="history-equation">${item.equation} =</span>
      <span class="history-result">${item.result}</span>
    </div>
  `).join('');

  historyList.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const val = item.getAttribute('data-value');
      calculator.currentOperand = val;
      calculator.shouldResetScreen = true;
      calculator.updateDisplay();
      calculator.sound.playClick();
      closeHistoryDrawer();
    });
  });
}

function openHistoryDrawer() {
  historyDrawer.classList.add('open');
  historyDrawer.setAttribute('aria-hidden', 'false');
  renderHistory();
}

function closeHistoryDrawer() {
  historyDrawer.classList.remove('open');
  historyDrawer.setAttribute('aria-hidden', 'true');
}

historyToggle.addEventListener('click', () => {
  calculator.sound.playClick();
  if (historyDrawer.classList.contains('open')) {
    closeHistoryDrawer();
  } else {
    openHistoryDrawer();
  }
});

closeHistoryBtn.addEventListener('click', () => {
  calculator.sound.playClick();
  closeHistoryDrawer();
});

clearHistoryBtn.addEventListener('click', () => {
  calculator.sound.playClear();
  calculator.history = [];
  localStorage.removeItem('calc_history');
  renderHistory();
});

/* ==========================================================================
   Audio Feedback Toggle
   ========================================================================== */
const soundOnIcon = soundToggle.querySelector('.sound-on-icon');
const soundOffIcon = soundToggle.querySelector('.sound-off-icon');

const savedSound = localStorage.getItem('calc_sound');
if (savedSound !== null) {
  calculator.sound.enabled = savedSound === 'true';
  updateSoundIcon();
}

function updateSoundIcon() {
  if (calculator.sound.enabled) {
    soundOnIcon.classList.remove('hidden');
    soundOffIcon.classList.add('hidden');
  } else {
    soundOnIcon.classList.add('hidden');
    soundOffIcon.classList.remove('hidden');
  }
}

soundToggle.addEventListener('click', () => {
  calculator.sound.enabled = !calculator.sound.enabled;
  localStorage.setItem('calc_sound', calculator.sound.enabled);
  updateSoundIcon();
  if (calculator.sound.enabled) {
    calculator.sound.playClick();
  }
});

/* ==========================================================================
   Theme Management (Light / Dark)
   ========================================================================== */
const sunIcon = themeToggle.querySelector('.sun-icon');
const moonIcon = themeToggle.querySelector('.moon-icon');

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('calc_theme', theme);

  if (theme === 'light') {
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  } else {
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  }
}

const savedTheme = localStorage.getItem('calc_theme') || 
  (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  calculator.sound.playClick();
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(nextTheme);
});

// Render initial history state
renderHistory();
