import {Highlighter} from "../../scripts/highlighting/highlighter";

import {MithrilUtils} from "../mithrilUtils";
import {TestModule} from "../testModule";

export class HighlighterTests extends TestModule {
	protected module() {
		return "highlighter";
	}

	protected tests() {
		test("The previous highlighter should be disabled when a new one is reconstructed", () => {
		let textHighlighter = Highlighter.reconstructInstance(MithrilUtils.getFixture(), {
			enabled: true
		});
		ok(textHighlighter.isEnabled(), "The first textHighlighter instance should be enabled");

		Highlighter.reconstructInstance(MithrilUtils.getFixture(), {});
		ok(!textHighlighter.isEnabled(), "The second textHighlighter instance should be enabled");
	});
	}
}

(new HighlighterTests()).runTests();
