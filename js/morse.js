var MORSE_DICTIONARY = {
  'A': '.-',   'B': '-...', 'C': '-.-.', 'D': '-..',
  'E': '.',    'F': '..-.', 'G': '--.',  'H': '....',
  'I': '..',   'J': '.---', 'K': '-.-',  'L': '.-..',
  'M': '--',   'N': '-.',   'O': '---',  'P': '.--.',
  'Q': '--.-', 'R': '.-.',  'S': '...',  'T': '-',
  'U': '..-',  'V': '...-', 'W': '.--',  'X': '-..-',
  'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----',
  '2': '..---', '3': '...--', '4': '....-', '5': '.....',
  '6': '-....', '7': '--...', '8': '---..', '9': '----.'
};

function createMorseSequence(text, unitMs = 150, loopPauseMs = 2500) {
  const words = text.toUpperCase().trim().split(/\s+/);
  const sequence = [];

  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    for (let l = 0; l < word.length; l++) {
      const char = word[l];
      const pattern = MORSE_DICTIONARY[char];
      if (!pattern) continue;

      for (let s = 0; s < pattern.length; s++) {
        const sym = pattern[s];
        const duration = sym === '-' ? unitMs * 3 : unitMs;
        sequence.push({ on: true, ms: duration });
        if (s < pattern.length - 1) {
          sequence.push({ on: false, ms: unitMs });
        }
      }

      if (l < word.length - 1) {
        sequence.push({ on: false, ms: unitMs * 3 });
      }
    }

    if (w < words.length - 1) {
      sequence.push({ on: false, ms: unitMs * 7 });
    }
  }

  sequence.push({ on: false, ms: unitMs * 4 });
  return sequence;
}

var morseTimeout = null;
var morseIndex = 0;
var currentMorseSequence = [];
var currentMorseMessage = 'FIX WIRES';

function setMorseLightState(isOn) {
  if (!cabinetLight) return;
  if (isOn) {
    cabinetLight.classList.add('active');
  } else {
    cabinetLight.classList.remove('active');
  }
}

function runMorseStep() {
  if (!morseRunning || !currentMorseSequence.length) return;
  const current = currentMorseSequence[morseIndex];
  setMorseLightState(current.on);

  morseTimeout = setTimeout(() => {
    if (!morseRunning) return;
    morseIndex++;
    if (morseIndex >= currentMorseSequence.length) {
      stopMorse();
      return;
    }
    runMorseStep();
  }, current.ms);
}

function startMorse(text = 'FIX WIRES') {
  stopMorse();
  stopAnim();
  keysHeld.clear();
  showFrame(0);
  currentMorseMessage = text;
  currentMorseSequence = createMorseSequence(text);
  morseRunning = true;
  morseIndex = 0;
  runMorseStep();
}

function stopMorse() {
  morseRunning = false;
  if (morseTimeout) {
    clearTimeout(morseTimeout);
    morseTimeout = null;
  }
  setMorseLightState(false);
}

function handleMorseCommand() {
  if (isScrollAnimationActive) return;
  if (socketsOverlay && socketsOverlay.style.display === 'block') return;

  if (morseRunning) {
    stopMorse();
  } else {
    if (!wiresFixed) {
      startMorse('FIX WIRES');
    } else {
      startMorse('KONAMI');
    }
  }
}

