var HandLandmarkerClass = null;
var FilesetResolverClass = null;
var DrawingUtilsClass = null;
var landmarker = null;
var isCameraRunning = false;
var webcamStream = null;
var lastVideoTime = -1;
var isPinching = false;

var PINCH_START_DISTANCE = 0.055;
var PINCH_RELEASE_DISTANCE = 0.075;

async function initMediaPipe() {
  if (landmarker) return;
  try {
    const visionModule = await import('https://unpkg.com/@mediapipe/tasks-vision@0.10.34/vision_bundle.mjs');
    HandLandmarkerClass = visionModule.HandLandmarker;
    FilesetResolverClass = visionModule.FilesetResolver;
    DrawingUtilsClass = visionModule.DrawingUtils;

    const vision = await FilesetResolverClass.forVisionTasks('https://unpkg.com/@mediapipe/tasks-vision@0.10.34/wasm');
    const options = {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numHands: 1
    };

    try {
      landmarker = await HandLandmarkerClass.createFromOptions(vision, options);
    } catch (gpuErr) {
      options.baseOptions.delegate = 'CPU';
      landmarker = await HandLandmarkerClass.createFromOptions(vision, options);
    }
  } catch (err) {
    console.error('Failed to initialize MediaPipe hand tracking:', err);
  }
}

async function initCamera() {
  if (isCameraRunning) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240 }
    });
    webcamStream = stream;
    if (webcamVideo) {
      webcamVideo.srcObject = stream;
      await webcamVideo.play();
      isCameraRunning = true;
      if (camContainer) camContainer.style.display = 'block';
      requestAnimationFrame(predictWebcam);
    }
  } catch (err) {
    console.error('Failed to start webcam for hand tracking:', err);
    isCameraRunning = false;
    if (camContainer) camContainer.style.display = 'none';
  }
}

function handleCmrCommand() {
  if (isScrollAnimationActive) return;
  if (isCameraRunning) {
    if (webcamStream) {
      webcamStream.getTracks().forEach(t => t.stop());
      webcamStream = null;
    }
    isCameraRunning = false;
    isPinching = false;
    if (camContainer) camContainer.style.display = 'none';
  } else {
    initCamera();
  }
}

function triggerPinchAction() {
  if (isScrollAnimationActive || hasAnimationFinished) return;

  if (camContainer) {
    camContainer.classList.add('pinch-flash');
    setTimeout(() => {
      if (camContainer) camContainer.classList.remove('pinch-flash');
    }, 400);
  }
  triggerScrollAnimation();
}

window.triggerMediaPipePinch = triggerPinchAction;
window.triggerMediaPipeGesture = triggerPinchAction;
window.triggerMediaPipeClap = triggerPinchAction;

function predictWebcam() {
  if (!isCameraRunning) return;
  if (!webcamVideo || !gestureCanvas) return;

  const ctx = gestureCanvas.getContext('2d');
  if (gestureCanvas.width !== webcamVideo.videoWidth || gestureCanvas.height !== webcamVideo.videoHeight) {
    gestureCanvas.width = webcamVideo.videoWidth || 320;
    gestureCanvas.height = webcamVideo.videoHeight || 240;
  }

  if (landmarker && webcamVideo.readyState >= 2 && webcamVideo.currentTime !== lastVideoTime) {
    lastVideoTime = webcamVideo.currentTime;
    const results = landmarker.detectForVideo(webcamVideo, performance.now());

    ctx.clearRect(0, 0, gestureCanvas.width, gestureCanvas.height);

    const hand = results && results.landmarks && results.landmarks[0];
    if (hand) {
      if (DrawingUtilsClass) {
        const drawingUtils = new DrawingUtilsClass(ctx);
        drawingUtils.drawConnectors(hand, HandLandmarkerClass.HAND_CONNECTIONS, {
          color: '#ff2233',
          lineWidth: 2
        });
        drawingUtils.drawLandmarks(hand, {
          color: '#ff5566',
          lineWidth: 1,
          radius: 2
        });
      }

      const thumbTip = hand[4];
      const indexTip = hand[8];
      const pinchDistance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
      const pinchDetected = isPinching
        ? pinchDistance < PINCH_RELEASE_DISTANCE
        : pinchDistance < PINCH_START_DISTANCE;

      if (pinchDetected && !isPinching) {
        triggerPinchAction();
      }
      isPinching = pinchDetected;
    } else {
      isPinching = false;
    }
  }
  requestAnimationFrame(predictWebcam);
}
