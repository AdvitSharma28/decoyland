var FRAMES = {
  a: { start: 1, end: 8 },
  d: { start: 9, end: 17 },
  s: { start: 18, end: 26 },
  w: { start: 27, end: 35 },
};

var joystickImgs = [];
for (let i = 0; i <= 35; i++) {
  const img = new Image();
  img.src = `assets/joystick_frames/${pad(i)}.webp`;
  joystickImgs.push(img);
}
if (joystickImgs[0]) {
  joystickImgs[0].onload = () => showFrame(0);
}

function updateJoystickCabinetBackground(isMoving) {
  if (!cabinetBase || !cabinetMinus) return;
  if (isMoving) {
    cabinetBase.style.display = 'none';
    cabinetMinus.style.display = 'block';
  } else {
    cabinetMinus.style.display = 'none';
    cabinetBase.style.display = 'block';
  }
}

var animState = 'idle';
var activeKey = null;
var pendingKey = null;
var currentFrame = 0;
var animRafId = null;
var lastFrameTime = 0;
var FRAME_MS = 22;
var keysHeld = new Set();

function showFrame(n) {
  currentFrame = n;
  if (joyCtx) {
    joyCtx.clearRect(0, 0, 1920, 1080);
    const img = joystickImgs[n];
    if (img && img.complete && img.naturalWidth !== 0) {
      joyCtx.drawImage(img, 0, 0);
    }
  }
}

function stopAnim() {
  if (animRafId !== null) {
    cancelAnimationFrame(animRafId);
    animRafId = null;
  }
}

function pickActiveKey() {
  let last = null;
  keysHeld.forEach(k => { last = k; });
  return last;
}

function startForward(key) {
  stopAnim();
  animState = 'forward';
  updateJoystickCabinetBackground(true);
  activeKey = key;
  const { start, end } = FRAMES[key];
  showFrame(start);
  lastFrameTime = performance.now();

  function stepForward(now) {
    if (animState !== 'forward') return;
    if (now - lastFrameTime >= FRAME_MS) {
      lastFrameTime = now;
      if (currentFrame >= end) {
        animState = 'holding';
        animRafId = null;
        return;
      }
      showFrame(currentFrame + 1);
    }
    animRafId = requestAnimationFrame(stepForward);
  }
  animRafId = requestAnimationFrame(stepForward);
}

function startReverse(onDone) {
  stopAnim();
  animState = 'reverse';
  updateJoystickCabinetBackground(true);

  const floor = activeKey ? FRAMES[activeKey].start : 0;

  if (currentFrame <= floor) {
    showFrame(0);
    updateJoystickCabinetBackground(false);
    onDone();
    return;
  }
  lastFrameTime = performance.now();

  function stepReverse(now) {
    if (animState !== 'reverse') return;
    if (now - lastFrameTime >= FRAME_MS) {
      lastFrameTime = now;
      if (currentFrame <= floor) {
        showFrame(0);
        updateJoystickCabinetBackground(false);
        animRafId = null;
        onDone();
        return;
      }
      showFrame(currentFrame - 1);
    }
    animRafId = requestAnimationFrame(stepReverse);
  }
  animRafId = requestAnimationFrame(stepReverse);
}

function onReverseDone() {
  animState = 'idle';
  activeKey = null;
  if (pendingKey) {
    const key = pendingKey;
    pendingKey = null;
    startForward(key);
  } else {
    updateJoystickCabinetBackground(false);
  }
}

function handleInputChange() {
  const targetKey = pickActiveKey();

  if (animState === 'idle') {
    if (targetKey) startForward(targetKey);
    return;
  }

  if (animState === 'forward' || animState === 'holding') {
    if (targetKey === activeKey) return;
    pendingKey = targetKey;
    startReverse(onReverseDone);
    return;
  }

  if (animState === 'reverse') {
    pendingKey = targetKey;
    return;
  }
}

