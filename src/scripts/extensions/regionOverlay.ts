// Standalone region selection overlay — injected directly into the original tab.
// No Mithril, no clipper state, no communicator. Just DOM + mouse events + chrome.runtime.sendMessage.
// Borrows canvas darkening logic from regionSelector.tsx.

(function() {
	// Prevent double-injection
	if (document.getElementById("__regionOverlayRoot")) { return; }

	let root = document.createElement("div");
	root.id = "__regionOverlayRoot";
	root.style.cssText = "position:fixed;inset:0;z-index:2147483647;cursor:crosshair;";

	// Dark overlay canvas — fills viewport, draws "hole" around selection
	let canvas = document.createElement("canvas");
	canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
	root.appendChild(canvas);

	// Selection border
	let selBox = document.createElement("div");
	selBox.style.cssText = "position:absolute;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,0.3);display:none;pointer-events:none;";
	root.appendChild(selBox);

	document.body.appendChild(root);

	let ctx = canvas.getContext("2d")!;
	let dpr = window.devicePixelRatio || 1;
	let startX = 0, startY = 0, endX = 0, endY = 0;
	let dragging = false;

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

		selBox.style.display = "block";
		selBox.style.left = xMin + "px";
		selBox.style.top = yMin + "px";
		selBox.style.width = (xMax - xMin) + "px";
		selBox.style.height = (yMax - yMin) + "px";
	}
	draw();

	function onMouseDown(e: MouseEvent) {
		e.preventDefault();
		dragging = true;
		startX = e.clientX;
		startY = e.clientY;
		endX = startX;
		endY = startY;
		draw();
	}

	function onMouseMove(e: MouseEvent) {
		if (!dragging) { return; }
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

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			cleanup();
			chrome.runtime.sendMessage(JSON.stringify({ action: "regionCancelled" }));
		}
	}

	function cleanup() {
		root.removeEventListener("mousedown", onMouseDown);
		root.removeEventListener("mousemove", onMouseMove);
		root.removeEventListener("mouseup", onMouseUp);
		document.removeEventListener("keydown", onKeyDown, true);
		window.removeEventListener("resize", resize);
		if (root.parentNode) { root.parentNode.removeChild(root); }
	}

	// Expose cleanup for external removal
	(window as any).__regionOverlayCleanup = cleanup;

	root.addEventListener("mousedown", onMouseDown);
	root.addEventListener("mousemove", onMouseMove);
	root.addEventListener("mouseup", onMouseUp);
	document.addEventListener("keydown", onKeyDown, true);
})();
