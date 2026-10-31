var gameCanvas = document.getElementById('game-canvas');
var gameCtx = gameCanvas ? gameCanvas.getContext('2d') : null;

var girlImg = new Image();
girlImg.src = 'assets/girl.webp';

var collisionImg = new Image();
collisionImg.src = 'assets/collision.png';

var isGameRunning = false;
var gameRafId = null;

var COLLISION_RECTS = [
  [0, 0, 1920, 36],
  [141, 36, 138, 457],
  [0, 36, 45, 1044],
  [1876, 36, 44, 1044],
  [45, 870, 1831, 210],
  [1618, 721, 165, 149],
  [417, 273, 468, 135],
  [828, 488, 744, 133]
];

var collisionPixelData = null;
var collOffCanvas = document.createElement('canvas');
collOffCanvas.width = 1920;
collOffCanvas.height = 1080;
var collOffCtx = collOffCanvas.getContext('2d');

collisionImg.onload = function () {
  collOffCtx.drawImage(collisionImg, 0, 0);
  try {
    var idata = collOffCtx.getImageData(0, 0, 1920, 1080);
    collisionPixelData = idata.data;
  } catch (err) {}
};

function isSolidAt(x, y) {
  var ix = Math.floor(x);
  var iy = Math.floor(y);
  if (ix < 0 || ix >= 1920 || iy < 0 || iy >= 1080) return true;
  if (collisionPixelData) {
    var idx = (iy * 1920 + ix) * 4;
    return collisionPixelData[idx] > 128;
  }
  for (var i = 0; i < COLLISION_RECTS.length; i++) {
    var r = COLLISION_RECTS[i];
    if (ix >= r[0] && ix < r[0] + r[2] && iy >= r[1] && iy < r[1] + r[3]) {
      return true;
    }
  }
  return false;
}

var player = {
  x: 300,
  y: 869,
  vx: 0,
  vy: 0,
  halfW: 16,
  h: 70,
  facing: 1,
  grounded: false,
  state: 'idle',
  animTimer: 0,
  animFrame: 0
};

function checkPlayerCollision(x, y) {
  var left = x - player.halfW;
  var right = x + player.halfW;
  var top = y - player.h;
  var bottom = y;

  if (isSolidAt(left, top) || isSolidAt(x, top) || isSolidAt(right, top)) return true;
  if (isSolidAt(left, bottom) || isSolidAt(x, bottom) || isSolidAt(right, bottom)) return true;

  var midY1 = top + player.h * 0.33;
  var midY2 = top + player.h * 0.66;
  if (isSolidAt(left, midY1) || isSolidAt(right, midY1)) return true;
  if (isSolidAt(left, midY2) || isSolidAt(right, midY2)) return true;

  return false;
}

var gameKeys = {};
var jumpBuffer = 0;

window.addEventListener('keydown', function (e) {
  if (!isGameRunning) return;
  var k = e.key.toLowerCase();
  if (['arrowleft', 'a', 'arrowright', 'd', 'arrowup', 'w', ' '].includes(k)) {
    gameKeys[k] = true;
    if (['arrowup', 'w', ' '].includes(k)) {
      jumpBuffer = 8;
    }
    if (['arrowup', 'arrowdown', ' '].includes(k)) {
      e.preventDefault();
    }
  }
});

window.addEventListener('keyup', function (e) {
  var k = e.key.toLowerCase();
  gameKeys[k] = false;
});

function updatePlayer() {
  var moveLeft = gameKeys['arrowleft'] || gameKeys['a'] || (keysHeld && keysHeld.has('a'));
  var moveRight = gameKeys['arrowright'] || gameKeys['d'] || (keysHeld && keysHeld.has('d'));
  var jump = gameKeys['arrowup'] || gameKeys['w'] || gameKeys[' '] || (keysHeld && keysHeld.has('w')) || (jumpBuffer > 0);
  if (jumpBuffer > 0) jumpBuffer--;

  if (moveLeft && !moveRight) {
    player.vx = -6.0;
    player.facing = -1;
  } else if (moveRight && !moveLeft) {
    player.vx = 6.0;
    player.facing = 1;
  } else {
    player.vx = 0;
  }

  if (jump && player.grounded) {
    jumpBuffer = 0;
    player.vy = -17.5;
    player.grounded = false;
    if (typeof playBeep === 'function') {
      playBeep(480, 'square', 0.08);
    }
  }

  player.vy += 0.52;
  if (player.vy > 18.0) player.vy = 18.0;

  var stepX = player.vx > 0 ? 1 : -1;
  var numStepsX = Math.floor(Math.abs(player.vx));
  var remX = Math.abs(player.vx) - numStepsX;
  for (var sx = 0; sx < numStepsX; sx++) {
    if (!checkPlayerCollision(player.x + stepX, player.y)) {
      player.x += stepX;
    } else {
      player.vx = 0;
      break;
    }
  }
  if (player.vx !== 0 && remX > 0) {
    if (!checkPlayerCollision(player.x + stepX * remX, player.y)) {
      player.x += stepX * remX;
    } else {
      player.vx = 0;
    }
  }

  player.grounded = false;
  var stepY = player.vy > 0 ? 1 : -1;
  var numStepsY = Math.floor(Math.abs(player.vy));
  var remY = Math.abs(player.vy) - numStepsY;
  for (var sy = 0; sy < numStepsY; sy++) {
    if (!checkPlayerCollision(player.x, player.y + stepY)) {
      player.y += stepY;
    } else {
      if (player.vy > 0) {
        player.grounded = true;
      }
      player.vy = 0;
      break;
    }
  }
  if (player.vy !== 0 && remY > 0) {
    if (!checkPlayerCollision(player.x, player.y + stepY * remY)) {
      player.y += stepY * remY;
    } else {
      if (player.vy > 0) {
        player.grounded = true;
      }
      player.vy = 0;
    }
  }

  if (!player.grounded) {
    if (player.vy < 0) {
      player.state = 'jump';
    } else {
      player.state = 'fall';
    }
  } else {
    if (Math.abs(player.vx) > 0.1) {
      player.state = 'run';
    } else {
      player.state = 'idle';
    }
  }

  player.animTimer++;
  if (player.state === 'idle') {
    if (player.animTimer >= 9) {
      player.animTimer = 0;
      player.animFrame = (player.animFrame + 1) % 4;
    }
  } else if (player.state === 'run') {
    if (player.animTimer >= 5) {
      player.animTimer = 0;
      player.animFrame = (player.animFrame + 1) % 9;
    }
  } else if (player.state === 'jump') {
    if (player.vy < -10) player.animFrame = 0;
    else if (player.vy < -4) player.animFrame = 1;
    else player.animFrame = 2;
  } else if (player.state === 'fall') {
    if (player.vy < 4) player.animFrame = 3;
    else if (player.vy < 10) player.animFrame = 4;
    else player.animFrame = 5;
  }
}

function renderPlayer() {
  if (!gameCtx) return;
  gameCtx.clearRect(0, 0, 1920, 1080);

  if (!girlImg.complete || girlImg.naturalWidth === 0) return;

  var col = 0;
  var row = 0;

  if (player.state === 'idle') {
    row = 0;
    col = player.animFrame % 4;
  } else if (player.state === 'run') {
    row = 1;
    col = player.animFrame % 9;
  } else {
    row = 2;
    col = player.animFrame % 6;
  }

  var SCALE = 2.0;
  var destX = player.x - 32 * SCALE;
  var destY = player.y - 63 * SCALE;

  gameCtx.imageSmoothingEnabled = false;

  if (player.facing === 1) {
    gameCtx.drawImage(
      girlImg,
      col * 64, row * 64, 64, 64,
      destX, destY, 64 * SCALE, 64 * SCALE
    );
  } else {
    gameCtx.save();
    gameCtx.translate(player.x, 0);
    gameCtx.scale(-1, 1);
    gameCtx.drawImage(
      girlImg,
      col * 64, row * 64, 64, 64,
      -32 * SCALE, destY, 64 * SCALE, 64 * SCALE
    );
    gameCtx.restore();
  }
}

var lastGameTime = 0;
var gameAccumulator = 0;
var FIXED_STEP = 1000 / 60;

function gameLoop(now) {
  if (!isGameRunning) return;
  if (!lastGameTime) lastGameTime = now;
  var elapsed = now - lastGameTime;
  lastGameTime = now;
  if (elapsed > 100) elapsed = 100;
  gameAccumulator += elapsed;

  while (gameAccumulator >= FIXED_STEP) {
    updatePlayer();
    gameAccumulator -= FIXED_STEP;
  }
  renderPlayer();
  gameRafId = requestAnimationFrame(gameLoop);
}

function startGame() {
  isGameRunning = true;
  lastGameTime = 0;
  gameAccumulator = 0;
  if (gameCanvas) gameCanvas.style.display = 'block';
  if (gameRafId) cancelAnimationFrame(gameRafId);
  gameRafId = requestAnimationFrame(gameLoop);
}

function stopGame() {
  isGameRunning = false;
  if (gameRafId) {
    cancelAnimationFrame(gameRafId);
    gameRafId = null;
  }
  if (gameCanvas) {
    gameCanvas.style.display = 'none';
    if (gameCtx) gameCtx.clearRect(0, 0, 1920, 1080);
  }
  for (var k in gameKeys) {
    gameKeys[k] = false;
  }
}
