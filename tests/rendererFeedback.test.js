const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const { buildSync } = require("esbuild");

// Execute the real renderer and its imports, without extension APIs, network,
// capture frames or background timers. Only the footer/auth DOM is exercised.
const root = path.join(__dirname, "..");
const html = readFileSync(path.join(root, "src/renderer.html"), "utf8");
const renderer = new vm.Script(buildSync({
	entryPoints: [path.join(root, "src/scripts/renderer.ts")],
	bundle: true,
	write: false,
	platform: "browser",
	format: "iife"
}).outputFiles[0].text);

function openRenderer(userInformation) {
	const elements = new Map();
	const document = new EventTarget();
	function element() {
		const node = new EventTarget();
		const attributes = new Map();
		const classes = new Set();
		Object.assign(node, {
			style: { display: "" },
			textContent: "",
			value: "",
			inert: false,
			classList: {
				add: (...names) => names.forEach(name => classes.add(name)),
				remove: (...names) => names.forEach(name => classes.delete(name)),
				contains: name => classes.has(name)
			},
			setAttribute: (name, value) => attributes.set(name, value),
			removeAttribute: name => attributes.delete(name),
			getAttribute: name => attributes.get(name) ?? null,
			appendChild: () => {},
			focus: () => { document.activeElement = node; }
		});
		return node;
	}
	// Use the actual markup's IDs and initial inline display, not a second
	// implementation of the renderer's account-dependent behavior.
	for (const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
		const node = element();
		node.style.display = /style="[^"]*display:\s*([^;"]+)/.exec(match[0])?.[1] || "";
		elements.set(match[1], node);
	}
	const get = id => {
		assert.ok(elements.has(id), `Renderer element exists: ${id}`);
		return elements.get(id);
	};
	Object.assign(document, {
		body: element(),
		documentElement: element(),
		getElementById: get,
		createElement: element,
		querySelector: () => null,
		querySelectorAll: selector => selector === "#preview-area, #sidebar, #aria-status"
			? ["preview-area", "sidebar", "aria-status"].map(get) : []
	});
	const stored = new Map();
	if (userInformation !== undefined) {
		stored.set("userInformation", JSON.stringify(userInformation));
	}
	const messages = [];
	const listeners = [];
	const disconnectListeners = [];
	const port = {
		postMessage: message => messages.push(JSON.parse(JSON.stringify(message))),
		onMessage: { addListener: listener => listeners.push(listener) },
		onDisconnect: { addListener: listener => disconnectListeners.push(listener) }
	};
	const window = new EventTarget();
	Object.assign(window, { outerWidth: 1200, innerWidth: 1200, outerHeight: 900, innerHeight: 900 });
	renderer.runInNewContext({
		document,
		window,
		chrome: { runtime: { connect: () => port } },
		localStorage: {
			getItem: key => stored.get(key) ?? null,
			setItem: (key, value) => stored.set(key, value),
			removeItem: key => stored.delete(key)
		},
		setTimeout: () => 1,
		clearTimeout: () => {},
		setInterval: () => 1
	}, { timeout: 5000 });
	return {
		get,
		messages,
		receive: message => listeners.forEach(listener => listener(message)),
		disconnect: () => disconnectListeners.forEach(listener => listener()),
		click: id => {
			const event = new Event("click", { cancelable: true });
			get(id).dispatchEvent(event);
			assert.equal(event.defaultPrevented, true);
		}
	};
}

function signedInUser(authType) {
	return { data: { authType, emailAddress: "test@example.com", accessToken: "synthetic-token" } };
}

function assertFeedbackAvailable(ui) {
	assert.notEqual(ui.get("user-info").style.display, "none");
	assert.equal(ui.get("sidebar").inert, false);
	// Leave display to the existing inline-flex stylesheet rule.
	assert.equal(ui.get("feedback-link").style.display, "");
	assert.equal(ui.get("feedback-link").getAttribute("aria-disabled"), null);
	assert.equal(ui.get("feedback-label").textContent, "Feedback");
}

function assertFeedbackAction(ui, pageUrl) {
	ui.get("source-url-text").textContent = pageUrl;
	ui.click("feedback-link");
	assert.deepEqual(ui.messages.at(-1), { action: "openFeedback", pageUrl });
}

for (const authType of ["Msa", "OrgId"]) {
	test(`cached ${authType} session exposes the existing Feedback action`, () => {
		const ui = openRenderer(signedInUser(authType));
		assertFeedbackAvailable(ui);
		assert.equal(ui.get("user-email").textContent, "test@example.com");
		assertFeedbackAction(ui, "https://example.com/");
		ui.click("signout-link");
		assert.deepEqual(ui.messages.at(-1), { action: "signOut", authType });
	});

	test(`successful ${authType} sign-in exposes Feedback without reopening`, () => {
		const ui = openRenderer();
		assert.equal(ui.get("signin-overlay").style.display, "flex");
		assert.equal(ui.get("sidebar").inert, true);
		ui.receive({ action: "signInResult", success: true,
			user: { authType, email: "test@example.com" } });
		assert.equal(ui.get("signin-overlay").style.display, "none");
		assertFeedbackAvailable(ui);
		assert.equal(ui.get("user-email").textContent, "test@example.com");
		assertFeedbackAction(ui, "");
	});
}

test("sign-out keeps the footer inaccessible until the next account signs in", () => {
	const ui = openRenderer(signedInUser("OrgId"));
	ui.receive({ action: "signOutComplete" });
	assert.equal(ui.get("user-info").style.display, "none");
	assert.equal(ui.get("sidebar").inert, true);
	assert.equal(ui.get("signin-overlay").style.display, "flex");
	ui.receive({ action: "signInResult", success: true, user: { authType: "Msa", name: "Test" } });
	assertFeedbackAvailable(ui);
	assert.equal(ui.get("user-email").textContent, "Test");
	assertFeedbackAction(ui, "https://example.com/");
});

test("failed sign-in leaves the footer behind the sign-in overlay", () => {
	const ui = openRenderer();
	ui.receive({ action: "signInResult", success: false, error: "Synthetic sign-in failure" });
	assert.equal(ui.get("signin-overlay").style.display, "flex");
	assert.equal(ui.get("sidebar").inert, true);
	assert.equal(ui.messages.some(message => message.action === "openFeedback"), false);
});

test("feedback activation tolerates a disconnected worker", () => {
	const ui = openRenderer(signedInUser("Msa"));
	ui.disconnect();
	const count = ui.messages.length;
	ui.click("feedback-link");
	assert.equal(ui.messages.length, count);
});
