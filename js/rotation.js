var ROTATION_START = 36;
var ROTATION_END = 246;
var ROTATION_FPS = 45;
var FRAME_INTERVAL = 1000 / ROTATION_FPS;

var offImg = new Image();
offImg.decoding = 'async';
offImg.src = 'assets/arcade_screen_off.webp';

var onImg = new Image();
onImg.decoding = 'async';
onImg.src = 'assets/arcade_screen_on.webp';

var lightImg = new Image();
lightImg.decoding = 'async';
lightImg.src = 'assets/screen_on_light_on.webp';

var rotationImgs = [];
for (let i = ROTATION_START; i <= ROTATION_END; i++) {
  const img = new Image();
  img.decoding = 'async';
  img.src = `assets/rotation/${pad(i)}.webp`;
  rotationImgs.push(img);
}

function setScreenState(state) {
  animCtx.clearRect(0, 0, 1920, 1080);
  if (state === 'off') {
    animCtx.drawImage(offImg, 0, 0);
    screenViewport.classList.add('glow-off');
    screenViewport.style.visibility = 'hidden';
  } else {
    animCtx.drawImage(onImg, 0, 0);
    screenViewport.classList.remove('glow-off');
    screenViewport.style.visibility = 'visible';
  }
}

function renderFrameNum(frameNum) {
  const idx = frameNum - ROTATION_START;
  const img = rotationImgs[idx];
  if (img && img.complete && img.naturalWidth !== 0) {
    animCtx.clearRect(0, 0, 1920, 1080);
    animCtx.drawImage(img, 0, 0);
  }
}

function playFrameRange(startFrame, endFrame) {
  return new Promise(resolve => {
    const isReverse = startFrame > endFrame;
    let currentFrame = startFrame;
    let lastTime = performance.now();

    renderFrameNum(currentFrame);

    function step(timestamp) {
      const elapsed = timestamp - lastTime;
      if (elapsed >= FRAME_INTERVAL) {
        lastTime = timestamp - (elapsed % FRAME_INTERVAL);
        if (isReverse) {
          currentFrame--;
          if (currentFrame >= endFrame) {
            renderFrameNum(currentFrame);
          } else {
            renderFrameNum(endFrame);
            resolve();
            return;
          }
        } else {
          currentFrame++;
          if (currentFrame <= endFrame) {
            renderFrameNum(currentFrame);
          } else {
            renderFrameNum(endFrame);
            resolve();
            return;
          }
        }
      }
      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  });
}

function triggerShake() {
  arcadeStage.classList.remove('shake');
  void arcadeStage.offsetWidth;
  arcadeStage.classList.add('shake');
  setTimeout(() => {
    arcadeStage.classList.remove('shake');
  }, 400);
}

async function triggerScrollAnimation() {
  if (isScrollAnimationActive || hasAnimationFinished) return;
  isScrollAnimationActive = true;

  stopMorse();
  if (typeof stopGame === 'function') stopGame();
  if (cabinetLight) {
    cabinetLight.classList.remove('active');
    cabinetLight.style.display = 'none';
  }

  stopAnim();
  keysHeld.clear();

  await ensureImageLoaded(offImg);

  setScreenState('off');
  animCanvas.style.display = 'block';
  await sleep(100);

  await ensureImageLoaded(onImg);

  setScreenState('on');
  await sleep(90);
  setScreenState('off');
  await sleep(90);

  setScreenState('on');
  await sleep(90);
  setScreenState('off');
  await sleep(120);

  screenViewport.style.display = 'none';
  if (cabinetBase) cabinetBase.style.display = 'none';
  if (cabinetMinus) cabinetMinus.style.display = 'none';
  if (cabinetLight) cabinetLight.style.display = 'none';
  if (joyCanvas) joyCanvas.style.display = 'none';

  await ensureImageLoaded(rotationImgs[0]);

  await playFrameRange(36, 145);

  socketsOverlay.style.display = 'block';
}

window.addEventListener('wheel', (e) => {
  e.preventDefault();
  triggerScrollAnimation();
}, { passive: false });

var touchStartY = null;
window.addEventListener('touchstart', (e) => {
  if (e.touches && e.touches.length > 0) {
    touchStartY = e.touches[0].clientY;
  }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (!isScrollAnimationActive && touchStartY !== null && e.touches && e.touches.length > 0) {
    const deltaY = e.touches[0].clientY - touchStartY;
    if (Math.abs(deltaY) > 15) {
      if (e.cancelable) e.preventDefault();
      triggerScrollAnimation();
    }
  }
}, { passive: false });

window.addEventListener('keydown', (e) => {
  if (!isScrollAnimationActive && ['PageDown', ' '].includes(e.key)) {
    e.preventDefault();
    triggerScrollAnimation();
  }
});

