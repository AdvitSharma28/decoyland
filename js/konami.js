var konamiStep = 0;
var konamiTriggered = false;
var konamiArmed = false;
var KONAMI_SEQUENCE = ['w', 'a', 's', 'd', 'w', 'w', 'a', 'd'];

function triggerKonami() {
  if (konamiTriggered) return;
  konamiTriggered = true;
  konamiStep = 0;
  konamiArmed = false;

  const url = 'https://nuxeland26.onrender.com/';
  try {
    const newTab = window.open(url, '_blank');
    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
      window.location.href = url;
    }
  } catch (err) {
    window.location.href = url;
  }

  setTimeout(() => {
    konamiTriggered = false;
  }, 3000);
}

function handleKonamiInput(e) {
  if (isScrollAnimationActive) return;

  const key = e.key.toLowerCase();
  if (key === 'enter') {
    konamiStep = 0;
    konamiArmed = true;
    playBeep(520, 'square', 0.12);
    e.preventDefault();
    return;
  }

  if (!konamiArmed || !/^[wasd]$/.test(key)) return;

  if (key === KONAMI_SEQUENCE[konamiStep]) {
    konamiStep++;
    if (konamiStep === KONAMI_SEQUENCE.length) {
      triggerKonami();
    }
  } else {
    konamiStep = key === KONAMI_SEQUENCE[0] ? 1 : 0;
  }
}
