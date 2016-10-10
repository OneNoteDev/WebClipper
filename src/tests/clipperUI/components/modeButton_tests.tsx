import {HelperFunctions} from "../../helperFunctions";
import {ModeButton} from "../../../scripts/clipperUI/components/modeButton";

export module TestConstants {
	export module Classes {
		export var icon = "icon";
		export var label = "label";
		export var selected = "selected";
	}
}

let mockModeButtonProps = HelperFunctions.getMockModeButtonProps();
let defaultComponent;
QUnit.module("modeButton", {
	beforeEach: () => {
		defaultComponent = <ModeButton
			imgSrc={mockModeButtonProps.imgSrc}
			label={mockModeButtonProps.label}
			myMode={mockModeButtonProps.myMode}
			tabIndex={mockModeButtonProps.tabIndex}
			selected={mockModeButtonProps.selected}
			onModeSelected={mockModeButtonProps.onModeSelected}
			tooltipText={mockModeButtonProps.tooltipText}/>;
	}
});

test("A non-selected button should not have extra styling applied to it", () => {
	HelperFunctions.mountToFixture(defaultComponent);

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
	HelperFunctions.mountToFixture(defaultComponent);

	let modeButton = HelperFunctions.getFixture().firstElementChild;
	let label = modeButton.getElementsByClassName(TestConstants.Classes.label)[0] as Node;
	strictEqual(label.textContent, mockModeButtonProps.label,
		"The mode button should be labeled with: " + mockModeButtonProps.label);
});

test("A button's tab index should match its tabIndex prop", () => {
	HelperFunctions.mountToFixture(defaultComponent);

	let modeButton = HelperFunctions.getFixture().firstElementChild as HTMLElement;
	strictEqual(modeButton.tabIndex, mockModeButtonProps.tabIndex,
		"The mode button's tab index should be: " + mockModeButtonProps.tabIndex);
});

test("A button's image src should match its imgSrc prop", () => {
	HelperFunctions.mountToFixture(defaultComponent);

	let modeButton = HelperFunctions.getFixture().firstElementChild;
	let label = modeButton.getElementsByClassName(TestConstants.Classes.icon)[0] as HTMLImageElement;
	strictEqual(HelperFunctions.getBaseFileName(label.src), HelperFunctions.getBaseFileName(mockModeButtonProps.imgSrc),
		"The mode button's icon src should be: " + mockModeButtonProps.imgSrc);
});

test("A button's title attribute should match its tooltipText prop", () => {
	HelperFunctions.mountToFixture(defaultComponent);

	let modeButton = HelperFunctions.getFixture().firstElementChild as HTMLElement;
	strictEqual(modeButton.title, mockModeButtonProps.tooltipText);
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
