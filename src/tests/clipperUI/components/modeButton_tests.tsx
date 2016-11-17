import {ModeButton} from "../../../scripts/clipperUI/components/modeButton";

import {HelperFunctions} from "../../helperFunctions";

import {TestModule} from "../../testModule";

module TestConstants {
	export module Classes {
		export var icon = "icon";
		export var label = "label";
		export var selected = "selected";
	}
}

export class ModeButtonTests extends TestModule {
	private mockModeButtonProps = HelperFunctions.getMockModeButtonProps();
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
			onModeSelected={this.mockModeButtonProps.onModeSelected}
			tooltipText={this.mockModeButtonProps.tooltipText}/>;
	}

	protected tests() {
		test("A non-selected button should not have extra styling applied to it", () => {
			HelperFunctions.mountToFixture(this.defaultComponent);

			let modeButton = HelperFunctions.getFixture().firstElementChild;
			ok(!modeButton.classList.contains(TestConstants.Classes.selected),
				"The mode button should not have extra styling applied to it");
		});

		test("A selected button should have extra styling applied to it", () => {
			let startingState = HelperFunctions.getMockModeButtonProps();
			startingState.selected = true;
			HelperFunctions.mountToFixture(<ModeButton
					imgSrc={startingState.imgSrc}
					label={startingState.label}
					myMode={startingState.myMode}
					tabIndex={startingState.tabIndex}
					selected={startingState.selected}
					onModeSelected={startingState.onModeSelected}
					tooltipText={startingState.tooltipText}/>);

			let modeButton = HelperFunctions.getFixture().firstElementChild;
			ok(modeButton.classList.contains(TestConstants.Classes.selected),
				"The mode button should have extra styling applied to it");
		});

		test("A button should be labeled with its label prop", () => {
			HelperFunctions.mountToFixture(this.defaultComponent);

			let modeButton = HelperFunctions.getFixture().firstElementChild;
			let label = modeButton.getElementsByClassName(TestConstants.Classes.label)[0] as Node;
			strictEqual(label.textContent, this.mockModeButtonProps.label,
				"The mode button should be labeled with: " + this.mockModeButtonProps.label);
		});

		test("A button's tab index should match its tabIndex prop", () => {
			HelperFunctions.mountToFixture(this.defaultComponent);

			let modeButton = HelperFunctions.getFixture().firstElementChild as HTMLElement;
			strictEqual(modeButton.tabIndex, this.mockModeButtonProps.tabIndex,
				"The mode button's tab index should be: " + this.mockModeButtonProps.tabIndex);
		});

		test("A button's image src should match its imgSrc prop", () => {
			HelperFunctions.mountToFixture(this.defaultComponent);

			let modeButton = HelperFunctions.getFixture().firstElementChild;
			let label = modeButton.getElementsByClassName(TestConstants.Classes.icon)[0] as HTMLImageElement;
			strictEqual(HelperFunctions.getBaseFileName(label.src), HelperFunctions.getBaseFileName(this.mockModeButtonProps.imgSrc),
				"The mode button's icon src should be: " + this.mockModeButtonProps.imgSrc);
		});

		test("A button's title attribute should match its tooltipText prop", () => {
			HelperFunctions.mountToFixture(this.defaultComponent);

			let modeButton = HelperFunctions.getFixture().firstElementChild as HTMLElement;
			strictEqual(modeButton.title, this.mockModeButtonProps.tooltipText);
		});

		test("A button with undefined tooltipText should have an undefined title attribute", () => {
			let startingState = HelperFunctions.getMockModeButtonProps();
			startingState.tooltipText = undefined;
			HelperFunctions.mountToFixture(<ModeButton
					imgSrc={startingState.imgSrc}
					label={startingState.label}
					myMode={startingState.myMode}
					tabIndex={startingState.tabIndex}
					selected={startingState.selected}
					onModeSelected={startingState.onModeSelected}
					tooltipText={startingState.tooltipText}/>);

			let modeButton = HelperFunctions.getFixture().firstElementChild as HTMLElement;
			strictEqual(modeButton.title, "");
		});
	}
}

(new ModeButtonTests()).runTests();
