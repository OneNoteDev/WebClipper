const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const { buildSync } = require("esbuild");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const html = readFileSync(path.join(root, "src/renderer.html"), "utf8");
// Execute the real renderer and its imports, without writing generated files.
const renderer = buildSync({
	entryPoints: [path.join(root, "src/scripts/renderer.ts")],
	bundle: true,
	write: false,
	platform: "browser",
	format: "iife"
}).outputFiles[0].text;

function openRenderer(t, cachedUser) {
	const dom = new JSDOM(html, { url: "https://extension.test/", runScripts: "outside-only" });
	t.after(() => dom.window.close());
	const { window } = dom;
	const messages = [];
	const listeners = [];
	let disconnect;
	window.chrome = {
		runtime: {
			connect: () => ({
				postMessage: (message) => messages.push(message),
				onMessage: { addListener: (listener) => listeners.push(listener) },
				onDisconnect: { addListener: (listener) => { disconnect = listener; } }
			})
		}
	};
	// No capture, network, keepalive or inactivity work is needed by these units.
	window.setTimeout = () => 0;
	window.setInterval = () => 0;
	window.fetch = () => { throw new Error("Unexpected network request"); };
	if (cachedUser !== undefined) {
		window.localStorage.setItem("userInformation", typeof cachedUser === "string"
			? cachedUser : JSON.stringify({ data: cachedUser }));
	}
	window.localStorage.setItem("locStrings", JSON.stringify({
		data: { "WebClipper.Action.Feedback": "Localized Feedback?" }
	}));
	window.eval(renderer);
	const element = (id) => window.document.getElementById(id);
	element("source-url-text").textContent = "https://example.com/";
	return {
		element, messages,
		receive: (message) => listeners.forEach((listener) => listener(message)),
		disconnect: () => disconnect(),
		clickFeedback: () => {
			const event = new window.MouseEvent("click", { bubbles: true, cancelable: true });
			element("feedback-link").dispatchEvent(event);
			assert.equal(event.defaultPrevented, true);
		}
	};
}

function assertFeedbackAvailable(ui, pageUrl = "https://example.com/") {
	assert.notEqual(ui.element("user-info").style.display, "none");
	assert.notEqual(ui.element("feedback-link").style.display, "none");
	assert.notEqual(ui.element("sidebar").inert, true);
	assert.equal(ui.element("signin-overlay").style.display, "none");
	assert.equal(ui.element("feedback-label").textContent, "Localized Feedback?");
	ui.clickFeedback();
	const feedbackMessages = ui.messages.filter((message) => message.action === "openFeedback");
	assert.equal(feedbackMessages.length, 1);
	assert.equal(feedbackMessages[0].pageUrl, pageUrl);
}

for (const authType of ["Msa", "OrgId"]) {
	test(`restored ${authType} session offers localized Feedback and dispatches its action`, (t) => {
		const ui = openRenderer(t, { authType, accessToken: "synthetic-token" });
		assertFeedbackAvailable(ui);
	});

	test(`successful ${authType} sign-in restores Feedback in the existing footer`, (t) => {
		const ui = openRenderer(t);
		assert.equal(ui.element("signin-overlay").style.display, "flex");
		assert.equal(ui.element("sidebar").inert, true);
		// Exercise clearing an inline hide left by an earlier state.
		ui.element("feedback-link").style.display = "none";
		ui.receive({ action: "signInResult", success: true, user: { authType, name: "Test User" } });
		assert.equal(ui.element("sidebar").inert, false);
		assertFeedbackAvailable(ui);
	});

	test(`${authType} sign-out protects the footer and a subsequent MSA sign-in restores it`, (t) => {
		const ui = openRenderer(t, { authType, accessToken: "synthetic-token" });
		ui.receive({ action: "signOutComplete" });
		assert.equal(ui.element("user-info").style.display, "none");
		assert.equal(ui.element("signin-overlay").style.display, "flex");
		assert.equal(ui.element("sidebar").inert, true);
		ui.receive({ action: "signInResult", success: true, user: { authType: "Msa", name: "Test User" } });
		// Sign-out clears the source URL until the next capture arrives.
		assertFeedbackAvailable(ui, "");
	});
}

for (const cachedUser of [undefined, "{invalid", { authType: "Msa" }]) {
	test(`missing, malformed or tokenless user stays behind the sign-in overlay: ${JSON.stringify(cachedUser)}`, (t) => {
		const ui = openRenderer(t, cachedUser);
		assert.equal(ui.element("signin-overlay").style.display, "flex");
		assert.equal(ui.element("sidebar").inert, true);
		ui.receive({ action: "signInResult", success: false, cancelled: true });
		assert.equal(ui.element("signin-overlay").style.display, "flex");
		assert.equal(ui.element("sidebar").inert, true);
		assert.equal(ui.messages.some((message) => message.action === "openFeedback"), false);
	});
}

test("Feedback after port disconnect is safely ignored", (t) => {
	const ui = openRenderer(t, { authType: "Msa", accessToken: "synthetic-token" });
	ui.disconnect();
	ui.clickFeedback();
	assert.equal(ui.messages.some((message) => message.action === "openFeedback"), false);
});
