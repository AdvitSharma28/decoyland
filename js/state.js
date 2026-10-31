var cabinetBase = document.getElementById('cabinet-base');
var cabinetMinus = document.getElementById('cabinet-minus');
var cabinetLight = document.getElementById('cabinet-light');
var joyCanvas = document.getElementById('joystick-canvas');
var joyCtx = joyCanvas ? joyCanvas.getContext('2d') : null;
var screenViewport = document.getElementById('screen-viewport');
var animCanvas = document.getElementById('anim-canvas');
var animCtx = animCanvas ? animCanvas.getContext('2d') : null;
var arcadeStage = document.querySelector('.arcade-stage');
var socketsOverlay = document.getElementById('sockets-overlay');
var previewWire = document.getElementById('preview-wire');
var previewWireInner = document.getElementById('preview-wire-inner');
var gameScreenImg = document.getElementById('game-screen');
var arcadeMenu = document.getElementById('arcade-menu');
var arcadeOptions = document.getElementById('arcade-options');
var menuStart = document.getElementById('menu-start');
var menuOptions = document.getElementById('menu-options');
var optBack = document.getElementById('opt-back');
var optSound = document.getElementById('opt-sound');
var optSoundVal = document.getElementById('opt-sound-val');
var screenCrt = document.getElementById('screen-crt');
var gameCanvas = document.getElementById('game-canvas');
var camContainer = document.getElementById('cam-container');
var webcamVideo = document.getElementById('webcam');
var gestureCanvas = document.getElementById('gesture-canvas');

var wiresFixed = false;
var isScrollAnimationActive = false;
var hasAnimationFinished = false;
var morseRunning = false;
var soundEnabled = true;

function pad(n) {
  return String(n).padStart(4, '0');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function ensureImageLoaded(img) {
  if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
  return new Promise(resolve => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}

