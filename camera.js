const video = document.createElement('video');
video.autoplay = true;
video.playsInline = true;
video.muted = true;
video.style.display = 'none';
document.body.appendChild(video);

let handLandmarker;
let lastX = 0;
let lastY = 0;
let lastTime = performance.now();
let hasPreviousHand = false;

function emitGesture(gesture) {
	window.dispatchEvent(new CustomEvent('cricket:camera-gesture', { detail: { gesture } }));
}

function emitPresence(available, detected) {
	window.dispatchEvent(new CustomEvent('cricket:camera-presence', { detail: { available, detected } }));
}

async function startHandCamera() {
	if (!navigator.mediaDevices?.getUserMedia) return;

	try {
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
		video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false });
		await video.play();
		emitPresence(true, false);
		requestAnimationFrame(trackHand);
	} catch (error) {
		emitPresence(false, false);
		console.warn('Hand gesture camera unavailable; button control remains active.', error);
	}
}

function trackHand(now) {
	if (handLandmarker && video.readyState >= 2) {
		const result = handLandmarker.detectForVideo(video, now);
		const landmarks = result.landmarks?.[0];
		emitPresence(true, Boolean(landmarks));
		if (landmarks) {
			const palm = landmarks[9];
			const elapsed = Math.max((now - lastTime) / 1000, 0.016);
			const velocityX = (palm.x - lastX) / elapsed;
			const velocityY = (palm.y - lastY) / elapsed;
			const speed = Math.hypot(velocityX, velocityY);
			if (hasPreviousHand) {
				const hardHigh = velocityY < -0.35 && speed > 0.45;
				const moderate = speed > 0.22;
				const normalWave = speed > 0.06;
				if (hardHigh) emitGesture(6);
				else if (moderate) emitGesture(4);
				else if (normalWave) emitGesture(1);
			}
			lastX = palm.x;
			lastY = palm.y;
			lastTime = now;
			hasPreviousHand = true;
		}
	}
	requestAnimationFrame(trackHand);
}

startHandCamera();
