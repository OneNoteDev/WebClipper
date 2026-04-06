// Standalone region selection overlay — injected directly into the original tab.
// No Mithril, no clipper state, no communicator. Just DOM + mouse events + chrome.runtime.sendMessage.
// Borrows canvas darkening logic from regionSelector.tsx.

(function() {
	// Prevent double-injection
	if (document.getElementById("__regionOverlayRoot")) { return; }

	let root = document.createElement("div");
	root.id = "__regionOverlayRoot";
	// cursor:none — we draw a unified canvas crosshair for both mouse and keyboard
	root.style.cssText = "position:fixed;inset:0;z-index:2147483647;cursor:none;overflow:hidden;";

	// Accessibility — focus the overlay so keyboard works immediately
	let strings = (window as any).__regionStrings || {};
	root.setAttribute("tabindex", "0");
	root.setAttribute("role", "application");
	root.setAttribute("aria-label", strings.canvasLabel || "Selection canvas");

	// Dark overlay canvas — fills viewport, draws "hole" around selection
	let canvas = document.createElement("canvas");
	canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
	root.appendChild(canvas);

	// Selection border drawn on canvas (no separate div — avoids alignment gaps)

	// Instruction bar — Shadow DOM isolates from page CSS
	let instrHost = document.createElement("div");
	instrHost.style.cssText = "position:absolute;top:16px;left:0;right:0;z-index:1;pointer-events:none;";
	let shadow = instrHost.attachShadow({ mode: "closed" });
	shadow.innerHTML = "<style>"
		+ ":host { all: initial; }"
		+ ".wrap { display:flex;justify-content:center; }"
		+ ".bar { display:flex;align-items:center;gap:16px;padding:10px 20px;"
		+   "background:rgba(0,0,0,0.75);border:1px solid rgba(255,255,255,0.3);"
		+   "border-radius:8px;font:14px/1 -apple-system,Segoe UI,sans-serif;color:#fff;"
		+   "pointer-events:auto;user-select:none;white-space:nowrap; }"
		+ ".text { opacity:0.9; }"
		+ ".back-btn { padding:6px 14px;background:rgba(255,255,255,0.15);color:#fff;"
		+   "border:1px solid rgba(255,255,255,0.4);border-radius:4px;"
		+   "font:13px/1 -apple-system,Segoe UI,sans-serif;cursor:pointer;outline:none;"
		+   "transition:background 0.15s; }"
		+ ".back-btn:hover { background:rgba(255,255,255,0.3); }"
		+ "</style>"
		+ "<div class=\"wrap\"><div class=\"bar\">"
		+ "<span class=\"text\"></span>"
		+ "<button class=\"back-btn\"></button>"
		+ "</div></div>";

	let instrText = shadow.querySelector(".text") as HTMLElement;
	let mouseInstr = strings.instruction || "Drag a selection with the mouse, and then release to capture.";
	let kbInstr = strings.keyboardInstruction || "To select with the keyboard, press the arrow keys, and then press Enter.";
	instrText.textContent = mouseInstr + " " + kbInstr;
	let cancelBtn = shadow.querySelector(".back-btn") as HTMLButtonElement;
	cancelBtn.textContent = (strings.back || "Back") + " (Esc)";
	cancelBtn.addEventListener("click", function(e) {
		e.stopPropagation();
		cleanup();
		chrome.runtime.sendMessage(JSON.stringify({ action: "regionCancelled" }));
	});
	root.appendChild(instrHost);

	// ARIA live regions for screen reader announcements
	let srOnlyStyle = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
	let ariaLive = document.createElement("div");
	ariaLive.setAttribute("aria-live", "polite");
	ariaLive.setAttribute("aria-atomic", "true");
	ariaLive.style.cssText = srOnlyStyle;
	root.appendChild(ariaLive);

	let ariaAlert = document.createElement("div");
	ariaAlert.setAttribute("role", "alert");
	ariaAlert.setAttribute("aria-atomic", "true");
	ariaAlert.style.cssText = srOnlyStyle;
	root.appendChild(ariaAlert);

	document.body.appendChild(root);
	root.focus();

	let ctx = canvas.getContext("2d")!;
	let dpr = window.devicePixelRatio || 1;
	let startX = 0, startY = 0, endX = 0, endY = 0;
	let dragging = false;

	// Unified cursor position — driven by mouse OR keyboard
	let cursorX = window.innerWidth / 2;
	let cursorY = window.innerHeight / 2;

	// Keyboard-specific state
	let cursorSpeed = 1;
	let keyDownDict: { [key: string]: boolean } = {};
	let keyboardSelectionInProgress = false;
	let animFrameId = 0;
	let accelCounter = 0;

	function resize() {
		canvas.width = window.innerWidth * dpr;
		canvas.height = window.innerHeight * dpr;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}
	resize();
	window.addEventListener("resize", resize);

	function draw() {
		let w = window.innerWidth;
		let h = window.innerHeight;
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = "rgba(0,0,0,0.35)";

		if (!dragging) {
			ctx.fillRect(0, 0, w, h);
			drawCrosshair();
			return;
		}

		let xMin = Math.min(startX, endX);
		let yMin = Math.min(startY, endY);
		let xMax = Math.max(startX, endX);
		let yMax = Math.max(startY, endY);

		// Four rectangles around selection (hole effect)
		ctx.fillRect(0, 0, xMin, h);              // left
		ctx.fillRect(xMin, 0, xMax - xMin, yMin); // top
		ctx.fillRect(xMax, 0, w - xMax, h);       // right
		ctx.fillRect(xMin, yMax, xMax - xMin, h - yMax); // bottom

		// Draw selection border directly on canvas (no div — avoids subpixel gaps)
		ctx.strokeStyle = "#fff";
		ctx.lineWidth = 2;
		ctx.strokeRect(xMin + 1, yMin + 1, (xMax - xMin) - 2, (yMax - yMin) - 2);

		drawCrosshair();
	}

	function drawCrosshair() {
		ctx.save();
		ctx.strokeStyle = "#fff";
		ctx.lineWidth = 1.5;
		ctx.shadowColor = "rgba(0,0,0,0.6)";
		ctx.shadowBlur = 2;
		let size = 12;
		ctx.beginPath();
		ctx.moveTo(cursorX - size, cursorY);
		ctx.lineTo(cursorX + size, cursorY);
		ctx.moveTo(cursorX, cursorY - size);
		ctx.lineTo(cursorX, cursorY + size);
		ctx.stroke();
		// Small center dot
		ctx.beginPath();
		ctx.arc(cursorX, cursorY, 2, 0, Math.PI * 2);
		ctx.fillStyle = "#fff";
		ctx.fill();
		ctx.restore();
	}

	draw();

	// --- Screen reader announcement helpers ---

	function announce(msg: string) {
		ariaLive.textContent = "";
		// Force re-announcement by toggling content asynchronously
		setTimeout(function() { ariaLive.textContent = msg; }, 50);
	}

	function alertAnnounce(msg: string) {
		ariaAlert.textContent = "";
		setTimeout(function() { ariaAlert.textContent = msg; }, 50);
	}

	function getDirectionMessage(): string {
		let directions: string[] = [];
		if (keyDownDict["ArrowUp"]) { directions.push(strings.up || "Up"); }
		if (keyDownDict["ArrowDown"]) { directions.push(strings.down || "Down"); }
		if (keyDownDict["ArrowLeft"]) { directions.push(strings.left || "Left"); }
		if (keyDownDict["ArrowRight"]) { directions.push(strings.right || "Right"); }
		return directions.join(" ");
	}

	// --- Keyboard animation loop ---

	function animateKeyboard() {
		let deltaX = 0, deltaY = 0;
		if (keyDownDict["ArrowUp"])    { deltaY -= cursorSpeed; }
		if (keyDownDict["ArrowDown"])  { deltaY += cursorSpeed; }
		if (keyDownDict["ArrowLeft"])  { deltaX -= cursorSpeed; }
		if (keyDownDict["ArrowRight"]) { deltaX += cursorSpeed; }

		if (deltaX !== 0 || deltaY !== 0) {
			cursorX = Math.max(0, Math.min(cursorX + deltaX, window.innerWidth));
			cursorY = Math.max(0, Math.min(cursorY + deltaY, window.innerHeight));
			if (keyboardSelectionInProgress) {
				endX = cursorX;
				endY = cursorY;
			}
			draw();

			// Throttle acceleration: increment every 4 frames (~66ms at 60fps)
			accelCounter++;
			if (accelCounter >= 4 && cursorSpeed < 5) {
				cursorSpeed++;
				accelCounter = 0;
			}
		}

		animFrameId = requestAnimationFrame(animateKeyboard);
	}

	function startAnimLoop() {
		if (!animFrameId) {
			accelCounter = 0;
			animFrameId = requestAnimationFrame(animateKeyboard);
		}
	}

	function stopAnimLoop() {
		if (animFrameId) {
			cancelAnimationFrame(animFrameId);
			animFrameId = 0;
		}
	}

	function noArrowKeysHeld(): boolean {
		return !keyDownDict["ArrowUp"] && !keyDownDict["ArrowDown"]
			&& !keyDownDict["ArrowLeft"] && !keyDownDict["ArrowRight"];
	}

	// --- Mouse handlers ---

	function onMouseDown(e: MouseEvent) {
		if (e.composedPath().indexOf(instrHost) !== -1) { return; }
		e.preventDefault();

		if (keyboardSelectionInProgress) {
			// Keyboard already set startX/startY — hand off to mouse without resetting.
			// Mouse will now control the end point; mouseup completes the selection.
			keyboardSelectionInProgress = false;
			stopAnimLoop();
			cursorX = e.clientX;
			cursorY = e.clientY;
			endX = e.clientX;
			endY = e.clientY;
			draw();
			return;
		}

		// Fresh mouse selection
		dragging = true;
		instrHost.style.display = "none";
		cursorX = e.clientX;
		cursorY = e.clientY;
		startX = e.clientX;
		startY = e.clientY;
		endX = startX;
		endY = startY;
		draw();
	}

	function onMouseMove(e: MouseEvent) {
		cursorX = e.clientX;
		cursorY = e.clientY;

		if (!dragging) {
			draw(); // update crosshair position
			return;
		}
		e.preventDefault();
		endX = e.clientX;
		endY = e.clientY;
		draw();
	}

	function onMouseUp(e: MouseEvent) {
		if (!dragging) { return; }
		e.preventDefault();
		dragging = false;
		endX = e.clientX;
		endY = e.clientY;

		let xMin = Math.min(startX, endX);
		let yMin = Math.min(startY, endY);
		let w = Math.abs(endX - startX);
		let h = Math.abs(endY - startY);

		if (w < 5 || h < 5) {
			// Too small — reset and let user try again
			instrHost.style.display = "";
			draw();
			return;
		}

		// Remove overlay before capture so it's not in the screenshot
		cleanup();

		// Send selection coords to worker — must be JSON string (offscreen.ts parses all messages)
		chrome.runtime.sendMessage(JSON.stringify({
			action: "regionSelected",
			x: xMin, y: yMin, width: w, height: h, dpr: dpr
		}));
	}

	// --- Keyboard handlers ---

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			cleanup();
			chrome.runtime.sendMessage(JSON.stringify({ action: "regionCancelled" }));
			return;
		}

		if (e.key === "Enter") {
			e.preventDefault();
			if (!keyboardSelectionInProgress) {
				// Phase 1: start selection at cursor position
				keyboardSelectionInProgress = true;
				dragging = true;
				startX = cursorX;
				startY = cursorY;
				endX = cursorX;
				endY = cursorY;
				instrHost.style.display = "none";
				announce(strings.selectionStarted || "Selection started");
				draw();
			} else {
				// Phase 2: complete selection
				let xMin = Math.min(startX, endX);
				let yMin = Math.min(startY, endY);
				let w = Math.abs(endX - startX);
				let h = Math.abs(endY - startY);

				if (w < 5 || h < 5) {
					// Too small — reset and let user try again
					keyboardSelectionInProgress = false;
					dragging = false;
					instrHost.style.display = "";
					draw();
					return;
				}

				alertAnnounce(strings.selectionComplete || "Selection complete");
				stopAnimLoop();

				// Small delay so screen reader can announce before cleanup
				setTimeout(function() {
					cleanup();
					chrome.runtime.sendMessage(JSON.stringify({
						action: "regionSelected",
						x: xMin, y: yMin, width: w, height: h, dpr: dpr
					}));
				}, 100);
			}
			return;
		}

		if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
			e.preventDefault();
			keyDownDict[e.key] = true;

			// Announce direction on first press (not repeat)
			if (!e.repeat) {
				let dirMsg = getDirectionMessage();
				if (dirMsg) { announce(dirMsg); }
			}

			startAnimLoop();
		}
	}

	function onKeyUp(e: KeyboardEvent) {
		if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
			delete keyDownDict[e.key];
			cursorSpeed = 1;
			accelCounter = 0;

			if (noArrowKeysHeld()) {
				stopAnimLoop();
			}
		}
	}

	// --- Cleanup ---

	function cleanup() {
		stopAnimLoop();
		root.removeEventListener("mousedown", onMouseDown);
		root.removeEventListener("mousemove", onMouseMove);
		root.removeEventListener("mouseup", onMouseUp);
		document.removeEventListener("keydown", onKeyDown, true);
		document.removeEventListener("keyup", onKeyUp, true);
		window.removeEventListener("resize", resize);
		if (root.parentNode) { root.parentNode.removeChild(root); }
	}

	// Expose cleanup for external removal
	(window as any).__regionOverlayCleanup = cleanup;

	root.addEventListener("mousedown", onMouseDown);
	root.addEventListener("mousemove", onMouseMove);
	root.addEventListener("mouseup", onMouseUp);
	document.addEventListener("keydown", onKeyDown, true);
	document.addEventListener("keyup", onKeyUp, true);
})();
