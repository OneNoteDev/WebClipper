import {ModeButton} from "../../../scripts/clipperUI/components/modeButton";
import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

module TestConstants {
	export module Classes {
		export var icon = "icon";
		export var label = "label";
		export var selected = "selected";
	}
}

export class ModeButtonTests extends TestModule {
	private mockModeButtonProps = MockProps.getMockModeButtonProps();
	private defaultComponent;

	protected module() {
		return "modeButton";
	}

	protected beforeEach() {
		this.defaultComponent = <ModeButton
			imgSrc={this.mockModeButtonProps.imgSrc}
			label={this.mockModeButtonProps.label}
			myMode={this.mockModeButtonProps.myMode}
			tabIndex={this.mockModeButtonProps.tabIndex}
			selected={this.mockModeButtonProps.selected}
			aria-setsize={this.mockModeButtonProps["aria-setsize"]}
			aria-posinset={this.mockModeButtonProps["aria-posinset"]}
			onModeSelected={this.mockModeButtonProps.onModeSelected}
			tooltipText={this.mockModeButtonProps.tooltipText}/>;
	}

	protected tests() {
		test("A non-selected button should not have extra styling applied to it", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			let modeButton = MithrilUtils.getFixture().firstElementChild;
			ok(!modeButton.classList.contains(TestConstants.Classes.selected),
				"The mode button should not have extra styling applied to it");
		});

		test("A selected button should have extra styling applied to it", () => {
			let startingState = MockProps.getMockModeButtonProps();
			startingState.selected = true;
			MithrilUtils.mountToFixture(<ModeButton
					imgSrc={startingState.imgSrc}
					label={startingState.label}
					myMode={startingState.myMode}
					tabIndex={startingState.tabIndex}
					aria-setsize={startingState["aria-setsize"]}
					aria-posinset={startingState["aria-posinset"]}
					selected={startingState.selected}
					onModeSelected={startingState.onModeSelected}
					tooltipText={startingState.tooltipText}/>);

			let modeButton = MithrilUtils.getFixture().firstElementChild;
			ok(modeButton.classList.contains(TestConstants.Classes.selected),
				"The mode button should have extra styling applied to it");
		});

		test("A button should be labeled with its label prop", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			let modeButton = MithrilUtils.getFixture().firstElementChild;
			let label = modeButton.getElementsByClassName(TestConstants.Classes.label)[0] as Node;
			strictEqual(label.textContent, this.mockModeButtonProps.label,
				"The mode button should be labeled with: " + this.mockModeButtonProps.label);
		});

		test("A button's aria-pos attribute should match its position in the set", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			let modeButton = MithrilUtils.getFixture().firstElementChild as HTMLElement;
			strictEqual(modeButton.getAttribute("aria-posinset"), this.mockModeButtonProps["aria-posinset"],
				"The mode button's aria-pos attribute should be: " + this.mockModeButtonProps["aria-posinset"]);
		});

		test("A button's aria-setsize attribute should be equal to the amount of buttons on the page", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			let modeButton = MithrilUtils.getFixture().firstElementChild as HTMLElement;
			strictEqual(modeButton.getAttribute("aria-setsize"), this.mockModeButtonProps["aria-setsize"],
				"The mode button's aria-setsize attribute should be: " + this.mockModeButtonProps["aria-setsize"]);
		});

		test("A button's image src should match its imgSrc prop", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			let modeButton = MithrilUtils.getFixture().firstElementChild;
			let label = modeButton.getElementsByClassName(TestConstants.Classes.icon)[0] as HTMLImageElement;

			// endsWith is polyfilled
			ok((label.src as any).endsWith(this.mockModeButtonProps.imgSrc),
				"The mode button's icon src should be: " + this.mockModeButtonProps.imgSrc);
		});

		test("A button's title attribute should match its tooltipText prop", () => {
			MithrilUtils.mountToFixture(this.defaultComponent);

			let modeButton = MithrilUtils.getFixture().firstElementChild as HTMLElement;
			strictEqual(modeButton.title, this.mockModeButtonProps.tooltipText);
		});

		test("A button with undefined tooltipText should have an undefined title attribute", () => {
			let startingState = MockProps.getMockModeButtonProps();
			startingState.tooltipText = undefined;
			MithrilUtils.mountToFixture(<ModeButton
					imgSrc={startingState.imgSrc}
					label={startingState.label}
					myMode={startingState.myMode}
					tabIndex={startingState.tabIndex}
					selected={startingState.selected}
					onModeSelected={startingState.onModeSelected}
					tooltipText={startingState.tooltipText}/>);

			let modeButton = MithrilUtils.getFixture().firstElementChild as HTMLElement;
			strictEqual(modeButton.title, "");
		});
	}
}

(new ModeButtonTests()).runTests();
