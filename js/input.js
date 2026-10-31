var ARROW_MAP = {
  arrowup: 'w',
  arrowdown: 's',
  arrowleft: 'a',
  arrowright: 'd',
};

var typedSeq = '';
var typedSeqTimer = null;

function handleKeySequence(char) {
  typedSeq += char;
  if (typedSeq.length > 20) typedSeq = typedSeq.slice(-20);

  clearTimeout(typedSeqTimer);
  typedSeqTimer = setTimeout(() => {
    typedSeq = '';
  }, 2500);

  if (typedSeq.endsWith('mor')) {
    typedSeq = '';
    handleMorseCommand();
  } else if (typedSeq.endsWith('cmr')) {
    typedSeq = '';
    handleCmrCommand();
  } else if (typedSeq.endsWith('scroll')) {
    typedSeq = '';
    triggerScrollAnimation();
  }
}

window.triggerTypeCommand = function (cmd) {
  if (cmd === 'mor') handleMorseCommand();
  else if (cmd === 'cmr') handleCmrCommand();
  else if (cmd === 'scroll') triggerScrollAnimation();
};

function onKeyDown(e) {
  if (e.key && e.key.length === 1) {
    handleKeySequence(e.key.toLowerCase());
  }

  if (!wiresFixed || morseRunning) return;

  if (!e.repeat) {
    handleKonamiInput(e);
  }

  if (isScrollAnimationActive) return;
  const rawKey = e.key.toLowerCase();
  const key = ARROW_MAP[rawKey] || rawKey;

  if (!FRAMES[key] || keysHeld.has(key)) return;
  e.preventDefault();
  keysHeld.add(key);
  handleInputChange();
}

function onKeyUp(e) {
  if (!wiresFixed || morseRunning) return;
  if (isScrollAnimationActive) return;
  const rawKey = e.key.toLowerCase();
  const key = ARROW_MAP[rawKey] || rawKey;

  if (!FRAMES[key]) return;
  e.preventDefault();
  keysHeld.delete(key);
  handleInputChange();
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);

