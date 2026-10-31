var SOCKET_CENTERS = {
  'left-top': { x: 475, y: 300 },
  'left-middle': { x: 475, y: 575 },
  'left-bottom': { x: 475, y: 800 },
  'right-top': { x: 1475, y: 325 },
  'right-middle': { x: 1475, y: 575 },
  'right-bottom': { x: 1475, y: 800 }
};

var WIRE_STAGES = [
  { left: 'top', right: 'middle', start: 145, end: 181 },
  { left: 'bottom', right: 'top', start: 182, end: 215 },
  { left: 'middle', right: 'bottom', start: 216, end: 246 }
];

var currentWireStage = 0;
var isWireAnimating = false;
var selectedLeft = null;
var isDragging = false;
var dragStartPos = null;

function getStageCoordinates(clientX, clientY) {
  const rect = arcadeStage.getBoundingClientRect();
  const scaleX = 1920 / rect.width;
  const scaleY = 1080 / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function updatePreviewWire(startX, startY, endX, endY) {
  const midX = (startX + endX) / 2;
  const midY = Math.max(startY, endY) + 70;
  const d = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
  previewWire.setAttribute('d', d);
  previewWireInner.setAttribute('d', d);
  previewWire.style.display = 'block';
  previewWireInner.style.display = 'block';
}

function hidePreviewWire() {
  previewWire.style.display = 'none';
  previewWireInner.style.display = 'none';
}

function clearSelection() {
  selectedLeft = null;
  document.querySelectorAll('.socket-target.selected').forEach(el => el.classList.remove('selected'));
  hidePreviewWire();
}

async function handleConnection(leftKey, rightKey) {
  if (isWireAnimating || currentWireStage >= WIRE_STAGES.length) return;

  const expected = WIRE_STAGES[currentWireStage];

  if (leftKey === expected.left && rightKey === expected.right) {
    isWireAnimating = true;
    clearSelection();

    const leftEl = document.querySelector(`[data-socket="left-${leftKey}"]`);
    const rightEl = document.querySelector(`[data-socket="right-${rightKey}"]`);
    if (leftEl) leftEl.classList.add('connected');
    if (rightEl) rightEl.classList.add('connected');

    await playFrameRange(expected.start, expected.end);

    currentWireStage++;
    isWireAnimating = false;

    if (currentWireStage >= WIRE_STAGES.length) {
      socketsOverlay.style.display = 'none';

      await sleep(1000);
      await playFrameRange(145, 36);

      hasAnimationFinished = true;
      isScrollAnimationActive = false;
      wiresFixed = true;

      animCanvas.style.display = 'none';
      screenViewport.style.display = 'block';
      screenViewport.style.visibility = 'visible';
      screenViewport.classList.remove('glow-off');
      if (cabinetMinus) cabinetMinus.style.display = 'none';
      if (cabinetBase) cabinetBase.style.display = 'block';
      if (joyCanvas) joyCanvas.style.display = 'block';
      showFrame(0);
      if (cabinetLight) {
        cabinetLight.style.display = 'block';
        cabinetLight.classList.remove('active');
        cabinetLight.style.opacity = '';
      }
    }
  } else {
    clearSelection();
    triggerShake();
  }
}

document.querySelectorAll('.socket-target').forEach(el => {
  const socketId = el.getAttribute('data-socket');
  const [side, key] = socketId.split('-');

  el.addEventListener('pointerdown', (e) => {
    if (isWireAnimating || currentWireStage >= WIRE_STAGES.length) return;
    if (el.classList.contains('connected')) return;

    e.stopPropagation();

    if (side === 'left') {
      isDragging = true;
      dragStartPos = { x: e.clientX, y: e.clientY };

      if (selectedLeft === key) {
        clearSelection();
      } else {
        clearSelection();
        selectedLeft = key;
        el.classList.add('selected');
        const center = SOCKET_CENTERS[`left-${key}`];
        const coords = getStageCoordinates(e.clientX, e.clientY);
        updatePreviewWire(center.x, center.y, coords.x, coords.y);
      }
    } else if (side === 'right') {
      if (!selectedLeft) {
        triggerShake();
        return;
      }
      handleConnection(selectedLeft, key);
    }
  });

  el.addEventListener('pointerup', (e) => {
    if (isWireAnimating || currentWireStage >= WIRE_STAGES.length) return;
    if (side === 'right' && selectedLeft && isDragging) {
      e.stopPropagation();
      isDragging = false;
      handleConnection(selectedLeft, key);
    }
  });
});

document.addEventListener('pointermove', (e) => {
  if (isWireAnimating || !selectedLeft || currentWireStage >= WIRE_STAGES.length) return;
  const coords = getStageCoordinates(e.clientX, e.clientY);
  const startCoord = SOCKET_CENTERS[`left-${selectedLeft}`];
  if (startCoord) {
    updatePreviewWire(startCoord.x, startCoord.y, coords.x, coords.y);
  }
});

document.addEventListener('pointerup', (e) => {
  if (isDragging) {
    isDragging = false;
    if (dragStartPos) {
      const dist = Math.hypot(e.clientX - dragStartPos.x, e.clientY - dragStartPos.y);
      if (dist > 40) {
        clearSelection();
      }
    }
  }
});

