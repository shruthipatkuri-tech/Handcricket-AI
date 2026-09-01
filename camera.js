const video = document.createElement('video');
video.autoplay = true;
video.playsInline = true;
video.muted = true;
video.style.display = 'none';
document.body.appendChild(video);

let handLandmarker;
let lastX = null;
let lastY = null;
let lastTime = 0;
let hasPreviousHand = false;
let lastGestureAt = 0;
let cameraRequested = false;

// Debug logging
function logDebug(msg) {
	console.log(msg);
	const panel = document.getElementById('debugPanel');
	const log = document.getElementById('debugLog');
	if (log) {
		const timestamp = new Date().toLocaleTimeString();
		log.innerHTML += `<div>[${timestamp}] ${msg}</div>`;
		log.parentElement.style.display = 'block';
		log.scrollTop = log.scrollHeight;
		// Keep only last 10 messages
		const lines = log.querySelectorAll('div');
		if (lines.length > 10) {
			lines[0].remove();
		}
	}
}

function emitGesture(gesture) {
	const now = performance.now();
	if (now - lastGestureAt < 300) {
		// Debounce active
		return;
	}
	lastGestureAt = now;
	logDebug(`🎯 GESTURE ${gesture} EMITTED`);
	console.log(`🎯 GESTURE ${gesture} EMITTED`);
	window.dispatchEvent(new CustomEvent('cricket:camera-gesture', { detail: { gesture } }));
}

function emitPresence(available, detected) {
	window.dispatchEvent(new CustomEvent('cricket:camera-presence', { detail: { available, detected } }));
}

async function startHandCamera() {
	if (cameraRequested && handLandmarker) {
		logDebug('✋ Camera already initialized');
		return true;
	}

	logDebug('📷 STEP 1: Starting camera access request...');
	cameraRequested = true;

	if (!navigator.mediaDevices?.getUserMedia) {
		logDebug('❌ FATAL: Camera API not available on this browser');
		console.error('Camera API not available');
		emitPresence(false, false);
		return false;
	}

	try {
		logDebug('🔓 STEP 2: Requesting camera permission from browser...');
		const stream = await navigator.mediaDevices.getUserMedia({
			video: {
				width: { ideal: 640 },
				height: { ideal: 480 },
				facingMode: 'user'
			},
			audio: false
		});
		logDebug('✅ STEP 2: Camera permission GRANTED');
		
		logDebug('▶️  STEP 3: Starting video stream...');
		video.srcObject = stream;
		await video.play();
		logDebug('✅ STEP 3: Video stream playing');

		logDebug('🤖 STEP 4: Loading MediaPipe hand detection model...');
		const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm');
		const fileset = await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
		handLandmarker = await vision.HandLandmarker.createFromOptions(fileset, {
			baseOptions: {
				modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
				delegate: 'GPU'
			},
			runningMode: 'VIDEO',
			numHands: 1
		});

		logDebug('✅ STEP 4: MediaPipe initialized - READY FOR HAND TRACKING!');
		console.log('✅ Hand camera fully initialized - ready to detect gestures');
		emitPresence(true, false);
		requestAnimationFrame(trackHand);
		return true;
	} catch (error) {
		emitPresence(false, false);
		const errorMsg = error?.name || error?.message || String(error);
		console.error('Hand camera error:', errorMsg);
		
		logDebug(`❌ CAMERA ERROR: ${errorMsg}`);
		logDebug('Troubleshooting tips:');
		
		if (errorMsg.includes('Permission') || errorMsg.includes('NotAllowed')) {
			logDebug('- Camera permission was DENIED by the browser');
			logDebug('- Click Allow when browser asks for permission');
			logDebug('- Check browser settings > Privacy > Camera > Allow for this site');
		} else if (errorMsg.includes('NotFound')) {
			logDebug('- NO CAMERA DETECTED on this device');
			logDebug('- Check if camera is connected and enabled');
			logDebug('- Try restarting the app');
		} else if (errorMsg.includes('NotReadable') || errorMsg.includes('SecurityError')) {
			logDebug('- Camera is in use by another app');
			logDebug('- Close other apps using camera (Zoom, Teams, etc.)');
			logDebug('- Try refreshing the page');
		} else {
			logDebug('- Unknown camera error');
			logDebug(`- Full error: ${errorMsg}`);
		}

		const errorDiv = document.getElementById('error');
		if (errorDiv) {
			if (errorMsg.includes('Permission') || errorMsg.includes('NotAllowed')) {
				errorDiv.textContent = '⚠️ Camera permission denied. Please allow camera access and try again.';
			} else if (errorMsg.includes('NotFound')) {
				errorDiv.textContent = '⚠️ No camera detected on this laptop. Use the button control instead.';
			} else {
				errorDiv.textContent = `⚠️ Camera unavailable: ${errorMsg}`;
			}
		}
		return false;
	}
}

window.requestCameraAccess = startHandCamera;

function trackHand(now) {
	if (!handLandmarker || video.readyState < 2) {
		requestAnimationFrame(trackHand);
		return;
	}

	const result = handLandmarker.detectForVideo(video, now);
	const landmarks = result.landmarks?.[0];
	const detected = Boolean(landmarks);
	emitPresence(true, detected);

	if (!detected) {
		hasPreviousHand = false;
		lastX = null;
		lastY = null;
		requestAnimationFrame(trackHand);
		return;
	}

	// Hand detected - log it once
	if (!hasPreviousHand) {
		logDebug('✅ HAND DETECTED! Your hand is visible to the camera');
		logDebug('👐 Make hand movements to trigger gestures:');
		logDebug('  • Move UP quickly = 6 runs (SIX)');
		logDebug('  • Move LEFT/RIGHT = 4 runs (FOUR)');
		logDebug('  • Any small movement = 1 run (ONE)');
	}

	const palm = landmarks[9];
	
	// Skip first frame - just establish baseline
	if (lastX === null || lastY === null) {
		lastX = palm.x;
		lastY = palm.y;
		lastTime = now;
		hasPreviousHand = true;
		requestAnimationFrame(trackHand);
		return;
	}

	const elapsed = Math.max((now - lastTime) / 1000, 0.016);
	const dx = palm.x - lastX;
	const dy = palm.y - lastY;
	const velocityX = dx / elapsed;
	const velocityY = dy / elapsed;
	const speed = Math.hypot(velocityX, velocityY);
	const verticalMove = Math.abs(dy);
	const horizontalMove = Math.abs(dx);

	if (hasPreviousHand && speed > 0.001) {
		// Ultra-sensitive - detect ANY hand movement
		// Log ALL movements for debugging
		logDebug(`📍 Movement detected: speed=${speed.toFixed(4)}, v=${verticalMove.toFixed(4)}, h=${horizontalMove.toFixed(4)}`);
		
		// Vertical movement = 6 (SIX)
		if (verticalMove > horizontalMove * 0.5) {
			logDebug(`✊ → Gesture 6 (vertical)`);
			emitGesture(6);
		}
		// Horizontal OR any movement = 4 (FOUR)
		else if (horizontalMove > 0.001 || speed > 0.002) {
			logDebug(`👋 → Gesture 4 (horizontal)`);
			emitGesture(4);
		}
		// Tiny movement = 1 (ONE)
		else {
			logDebug(`👐 → Gesture 1 (tiny)`);
			emitGesture(1);
		}
	}

	lastX = palm.x;
	lastY = palm.y;
	lastTime = now;
	hasPreviousHand = true;
	requestAnimationFrame(trackHand);
}

