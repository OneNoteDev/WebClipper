const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const { buildSync } = require("esbuild");

const root = path.resolve(__dirname, "..");
// Execute the complete production entry point and its imports, not a copied
// visibility rule or a source-text assertion. No generated files are written.
const bundle = buildSync({
	entryPoints: [path.join(root, "src/scripts/renderer.ts")],
	bundle: true,
	write: false,
	platform: "browser",
	format: "iife",
	target: "es2022"
}).outputFiles[0].text;
const markup = readFileSync(path.join(root, "src/renderer.html"), "utf8");

class Element extends EventTarget {
	constructor() {
		super();
		this.style = { display: "" };
		this.textContent = "";
		this.disabled = false;
		this.attributes = new Map();
		this.classList = { add() {}, remove() {} };
	}
	setAttribute(name, value) { this.attributes.set(name, value); }
	focus() {}
	appendChild() {}
	querySelector() { return null; }
	querySelectorAll() { return []; }
}

function renderer(userInformation) {
	const elements = new Map(Array.from(markup.matchAll(/\bid="([^"]+)"/g),
		match => [match[1], new Element()]));
	const document = Object.assign(new EventTarget(), {
		body: new Element(),
		documentElement: new Element(),
		getElementById: id => elements.get(id) || null,
		createElement: () => new Element(),
		querySelector: () => null,
		querySelectorAll: () => []
	});
	const listeners = [];
	const disconnectListeners = [];
	const messages = [];
	const port = {
		postMessage: message => messages.push(structuredClone(message)),
		onMessage: { addListener: listener => listeners.push(listener) },
		onDisconnect: { addListener: listener => disconnectListeners.push(listener) }
	};
	const storage = new Map([
		["userInformation", userInformation],
		["locStrings", JSON.stringify({ data: { "WebClipper.Action.Feedback": "Send feedback" } })]
	]);
	const window = Object.assign(new EventTarget(), {
		outerWidth: 1200, innerWidth: 1200, outerHeight: 800, innerHeight: 800
	});
	vm.runInNewContext(bundle, {
		document, window, console, URL,
		chrome: { runtime: { connect: () => port } },
		localStorage: { getItem: key => storage.get(key) ?? null },
		// Inactivity, keepalive and deferred notebook fetches are outside this unit.
		setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1
	}, { timeout: 5000 });
	return {
		elements, messages,
		receive(message) { listeners.forEach(listener => listener(message)); },
		disconnect() { disconnectListeners.forEach(listener => listener()); }
	};
}

for (const authType of ["Msa", "OrgId"]) {
	test(`cached ${authType} session keeps Feedback available and localized`, () => {
		const app = renderer(JSON.stringify({ data: {
			authType, accessToken: "synthetic-token", emailAddress: "test@example.invalid"
		} }));
		assert.equal(app.elements.get("feedback-link").style.display, "");
		assert.equal(app.elements.get("feedback-label").textContent, "Send feedback");
		assert.equal(app.elements.get("user-email").textContent, "test@example.invalid");
		assert.notEqual(app.elements.get("user-info").style.display, "none");
	});

	test(`successful ${authType} sign-in restores Feedback even if previously hidden`, () => {
		const app = renderer(null);
		assert.equal(app.elements.get("signin-overlay").style.display, "flex");
		app.elements.get("feedback-link").style.display = "none";
		app.receive({ action: "signInResult", success: true, user: {
			authType, email: "test@example.invalid"
		} });
		assert.equal(app.elements.get("feedback-link").style.display, "");
		assert.equal(app.elements.get("user-info").style.display, "");
		assert.equal(app.elements.get("signin-overlay").style.display, "none");
		assert.equal(app.elements.get("user-email").textContent, "test@example.invalid");
	});
}

test("Feedback activation prevents navigation and sends the existing worker action", () => {
	const app = renderer(JSON.stringify({ data: { authType: "Msa", accessToken: "synthetic-token" } }));
	const source = "https://example.invalid/synthetic-source";
	app.elements.get("source-url-text").textContent = source;
	const click = new Event("click", { cancelable: true });
	app.elements.get("feedback-link").dispatchEvent(click);
	assert.equal(click.defaultPrevented, true);
	assert.deepEqual(app.messages.filter(message => message.action === "openFeedback"), [
		{ action: "openFeedback", pageUrl: source }
	]);
});

test("Feedback activation tolerates a disconnected worker without sending", () => {
	const app = renderer(null);
	app.disconnect();
	app.elements.get("feedback-link").dispatchEvent(new Event("click", { cancelable: true }));
	assert.equal(app.messages.filter(message => message.action === "openFeedback").length, 0);
});

test("cancelled sign-in does not expose the signed-in pane", () => {
	const app = renderer(null);
	app.receive({ action: "signInResult", success: false, cancelled: true });
	assert.equal(app.elements.get("signin-overlay").style.display, "flex");
	assert.equal(app.elements.get("signin-msa-btn").disabled, false);
});

test("malformed cached user information still hides the user footer", () => {
	const app = renderer("{invalid");
	assert.equal(app.elements.get("user-info").style.display, "none");
	assert.equal(app.elements.get("signin-overlay").style.display, "flex");
});
