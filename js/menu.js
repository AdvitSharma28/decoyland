function playBeep(freq = 440, type = 'square', duration = 0.08) {
  if (!soundEnabled) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

if (menuStart) {
  menuStart.addEventListener('mouseenter', () => playBeep(350, 'square', 0.04));
  menuStart.addEventListener('click', () => {
    playBeep(600, 'square', 0.15);
    if (arcadeMenu) arcadeMenu.style.display = 'none';
    if (gameScreenImg) gameScreenImg.src = 'assets/game.webp';
    if (typeof startGame === 'function') startGame();
  });
}

if (menuOptions) {
  menuOptions.addEventListener('mouseenter', () => playBeep(350, 'square', 0.04));
  menuOptions.addEventListener('click', () => {
    playBeep(450, 'square', 0.08);
    if (arcadeMenu) arcadeMenu.style.display = 'none';
    if (arcadeOptions) arcadeOptions.style.display = 'flex';
  });
}

if (optBack) {
  optBack.addEventListener('mouseenter', () => playBeep(350, 'square', 0.04));
  optBack.addEventListener('click', () => {
    playBeep(300, 'square', 0.08);
    if (arcadeOptions) arcadeOptions.style.display = 'none';
    if (arcadeMenu) arcadeMenu.style.display = 'flex';
  });
}

if (optSound) {
  optSound.addEventListener('mouseenter', () => playBeep(350, 'square', 0.04));
  optSound.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (optSoundVal) optSoundVal.textContent = soundEnabled ? 'ON' : 'OFF';
    if (soundEnabled) playBeep(520, 'square', 0.08);
  });
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (arcadeOptions && arcadeOptions.style.display === 'flex') {
      arcadeOptions.style.display = 'none';
      if (arcadeMenu) arcadeMenu.style.display = 'flex';
    } else if (arcadeMenu && arcadeMenu.style.display === 'none') {
      if (gameScreenImg) gameScreenImg.src = 'assets/start.webp';
      if (typeof stopGame === 'function') stopGame();
      arcadeMenu.style.display = 'flex';
    }
  }
});

