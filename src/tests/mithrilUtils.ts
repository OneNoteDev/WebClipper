import * as sinon from "sinon";

/**
 * Common utilities for testing in Mithril
 */
export module MithrilUtils {
	export function mountToFixture(component): any {
		let fixture = MithrilUtils.getFixture();
		let controllerInstance = m.mount(fixture, component);
		m.redraw(true);
		return controllerInstance;
	}

	export function getFixture(): Element {
		return document.getElementById("qunit-fixture");
	}

	export function tick(clock: sinon.SinonFakeTimers, time: number) {
		clock.tick(time);
		m.redraw(true);
	}

	export function simulateAction(action: () => void) {
		action();
		m.redraw(true);
	}
}
