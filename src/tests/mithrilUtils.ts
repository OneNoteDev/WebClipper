import * as sinon from "sinon";

/**
 * Common utilities for testing in Mithril
 */
export class MithrilUtils {
	public static mountToFixture(component): any {
		let fixture = MithrilUtils.getFixture();
		let controllerInstance = m.mount(fixture, component);
		m.redraw(true);
		return controllerInstance;
	}

	public static getFixture(): Element {
		return document.getElementById("qunit-fixture");
	}

	public static tick(clock: sinon.SinonFakeTimers, time: number) {
		clock.tick(time);
		m.redraw(true);
	}

	public static simulateAction(action: () => void) {
		action();
		m.redraw(true);
	}
}
