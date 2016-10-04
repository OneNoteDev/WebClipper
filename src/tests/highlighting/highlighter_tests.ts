import {Highlighter} from "../../scripts/highlighting/highlighter";
import {HelperFunctions} from "../helperFunctions";

QUnit.module("highlighter", {});

test("The previous highlighter should be disabled when a new one is reconstructed", () => {
	let textHighlighter = Highlighter.reconstructInstance(HelperFunctions.getFixture(), {
		enabled: true
	});
	ok(textHighlighter.isEnabled(), "The first textHighlighter instance should be enabled");

	Highlighter.reconstructInstance(HelperFunctions.getFixture(), {});
	ok(!textHighlighter.isEnabled(), "The second textHighlighter instance should be enabled");
});
