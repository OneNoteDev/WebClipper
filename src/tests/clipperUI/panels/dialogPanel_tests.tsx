import {Constants} from "../../../scripts/constants";

import {Clipper} from "../../../scripts/clipperUI/frontEndGlobals";
import {DialogButton, DialogPanel} from "../../../scripts/clipperUI/panels/dialogPanel";

import {StubSessionLogger} from "../../../scripts/logging/stubSessionLogger";

import {MithrilUtils} from "../../mithrilUtils";
import {TestModule} from "../../testModule";

export class DialogPanelTests extends TestModule {
	protected module() {
		return "dialogPanel";
	}

	protected beforeEach() {
		Clipper.logger = new StubSessionLogger();
	}

	protected tests() {
		test("Given a message and a button, the dialog panel should render them both correctly", () => {
			let expectedMessage = "hello world";
			let count = 0;
			let buttons = [{
				id: "a",
				label: "My button",
				handler: () => {
					count++;
				}
			}] as DialogButton[];

			MithrilUtils.mountToFixture(<DialogPanel message={expectedMessage} buttons={buttons}/>);
			strictEqual(document.getElementById(Constants.Ids.dialogMessage).innerText, expectedMessage,
				"The message should be rendered on the dialog panel");

			let dialogButtonContainer = document.getElementById(Constants.Ids.dialogButtonContainer);
			let renderedButtons = dialogButtonContainer.getElementsByTagName("a");
			strictEqual(renderedButtons.length, 1, "Only one button should render");
			strictEqual(renderedButtons[0].getElementsByTagName("span")[0].innerText, buttons[0].label,
				"The button label should be the same as the one passed in");

			strictEqual(count, 0, "The button callback should have not been called yet");
			MithrilUtils.simulateAction(() => {
				renderedButtons[0].click();
			});
			strictEqual(count, 1, "The button callback should be called once");
		});

		test("Given two buttons, they should render correctly and respond to clicks using their own callbacks", () => {
			let expectedMessage = "hello world";
			let countA = 0;
			let countB = 0;
			let buttons = [{
				id: "a",
				label: "A Button",
				handler: () => {
					countA++;
				}
			}, {
				id: "b",
				label: "B Button",
				handler: () => {
					countB++;
				}
			}] as DialogButton[];

			MithrilUtils.mountToFixture(<DialogPanel message={expectedMessage} buttons={buttons}/>);
			strictEqual(document.getElementById(Constants.Ids.dialogMessage).innerText, expectedMessage,
				"The message should be rendered on the dialog panel");

			let dialogButtonContainer = document.getElementById(Constants.Ids.dialogButtonContainer);
			let renderedButtons = dialogButtonContainer.getElementsByTagName("a");
			strictEqual(renderedButtons.length, 2, "Two buttons should render");
			for (let i = 0; i < buttons.length; i++) {
				strictEqual(renderedButtons[i].getElementsByTagName("span")[0].innerText, buttons[i].label,
					"The button label should be the same as the one passed in");
			}

			strictEqual(countA, 0, "The A button callback should have not been called yet");
			MithrilUtils.simulateAction(() => {
				renderedButtons[0].click();
			});
			strictEqual(countA, 1, "The A button callback should be called once");

			strictEqual(countB, 0, "The B button callback should have not been called yet");
			MithrilUtils.simulateAction(() => {
				renderedButtons[1].click();
			});
			strictEqual(countB, 1, "The B button callback should be called once");
		});

		test("Given no buttons, no buttons should be rendered", () => {
			let expectedMessage = "hello world";
			let buttons = [] as DialogButton[];

			MithrilUtils.mountToFixture(<DialogPanel message={expectedMessage} buttons={buttons}/>);
			strictEqual(document.getElementById(Constants.Ids.dialogMessage).innerText, expectedMessage,
				"The message should be rendered on the dialog panel");

			let dialogButtonContainer = document.getElementById(Constants.Ids.dialogButtonContainer);
			let renderedButtons = dialogButtonContainer.getElementsByTagName("a");
			strictEqual(renderedButtons.length, 0, "No buttons should render");
		});

		// TODO refactor
		test("Given some buttons, they should have equal tab indexes", () => {
			let expectedMessage = "hello world";
			let buttons = [
				{ id: "a", label: "a", handler: undefined },
				{ id: "b", label: "b", handler: undefined },
				{ id: "c", label: "c", handler: undefined }
			] as DialogButton[];
			MithrilUtils.mountToFixture(<DialogPanel message={expectedMessage} buttons={buttons}/>);

			let dialogButtonContainer = document.getElementById(Constants.Ids.dialogButtonContainer);
			let renderedButtons = dialogButtonContainer.getElementsByTagName("a");
			let expectedTabIndex: number = undefined;
			for (let i = 0; i < renderedButtons.length; i++) {
				let element = renderedButtons[i] as HTMLElement;
				if (!expectedTabIndex) {
					expectedTabIndex = element.tabIndex;
				} else {
					strictEqual(element.tabIndex, expectedTabIndex, "Dialog button tabs should have the same tab indexes");
				}
				ok(element.tabIndex >= 0);
			}
		});
	}
}

(new DialogPanelTests()).runTests();
