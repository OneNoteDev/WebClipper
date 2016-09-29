/// <reference path="../../../../typings/main/ambient/qunit/qunit.d.ts" />

import {HelperFunctions} from "../../helperFunctions";
import {Constants} from "../../../scripts/constants";
import {AnnotationInput} from "../../../scripts/clipperUI/components/annotationInput";
import {ClipperState} from "../../../scripts/clipperUI/clipperState";
import {ComponentBase} from "../../../scripts/clipperUI/componentBase";

let defaultComponent;
QUnit.module("annotationInput", {
	beforeEach: () => {
		defaultComponent =
			<AnnotationInput clipperState={ HelperFunctions.getMockClipperState() } />;
	}
});

test("The annotation container should expand to reveal the annotation field when the annotation placeholder is clicked", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let annotationContainer = HelperFunctions.getFixture().firstElementChild as HTMLElement;
	let annotationContainerChildren = annotationContainer.children;
	strictEqual(annotationContainerChildren.length, 1,
		"By default, the annotation container should only contain one child");

	let annotationPlaceholder = annotationContainerChildren[0] as HTMLElement;
	strictEqual(annotationPlaceholder.id, Constants.Ids.annotationPlaceholder,
		"The annotation placeholder should be the only child of the container");

	HelperFunctions.simulateAction(() => {
		annotationPlaceholder.click();
	});

	strictEqual(annotationContainerChildren.length, 2,
		"The annotation container should contain two children");
	strictEqual(annotationContainerChildren[0].id, Constants.Ids.annotationFieldMirror,
		"The first child of the annotation container should be the annotation field mirror");
	strictEqual(annotationContainerChildren[1].id, Constants.Ids.annotationField,
		"The second child of the annotation container should be the annotation field");
});

test("The annotation container should remain open on blur if the annotation field is populated with non whitespace", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let annotationContainer = HelperFunctions.getFixture().firstElementChild as HTMLElement;
	let annotationContainerChildren = annotationContainer.children;
	let annotationPlaceholder = annotationContainerChildren[0] as HTMLElement;

	HelperFunctions.simulateAction(() => {
		annotationPlaceholder.click();
	});

	let annotationField = document.getElementById(Constants.Ids.annotationField) as HTMLTextAreaElement;

	HelperFunctions.simulateAction(() => {
		annotationField.focus();
		annotationField.value = "Non whitespace annotation";
		annotationField.blur();
		window.dispatchEvent(new Event("mouseup"));
	});

	strictEqual(annotationContainerChildren.length, 2,
		"The annotation container should contain two children");
	strictEqual(annotationContainerChildren[0].id, Constants.Ids.annotationFieldMirror,
		"The first child of the annotation container should be the annotation field mirror");
	strictEqual(annotationContainerChildren[1].id, Constants.Ids.annotationField,
		"The second child of the annotation container should be the annotation field");
});

test("The annotation container should close on blur if the annotation field is empty", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let annotationContainer = HelperFunctions.getFixture().firstElementChild as HTMLElement;
	let annotationContainerChildren = annotationContainer.children;
	let annotationPlaceholder = annotationContainerChildren[0] as HTMLElement;

	HelperFunctions.simulateAction(() => {
		annotationPlaceholder.click();
	});

	let annotationField = document.getElementById(Constants.Ids.annotationField) as HTMLTextAreaElement;

	HelperFunctions.simulateAction(() => {
		annotationField.focus();
		annotationField.value = "";
		annotationField.blur();
		window.dispatchEvent(new Event("mouseup"));
	});

	ok(!document.getElementById(Constants.Ids.annotationField),
		"The annotation field should not be displayed on blur if it is empty");
	strictEqual(annotationContainerChildren.length, 1,
		"The annotation container should only contain one child");
	strictEqual(annotationContainerChildren[0].id, Constants.Ids.annotationPlaceholder,
		"The only child of the annotation container should be the annotation placeholder");
});

test("The annotation container should close on blur if the annotation field is whitespace", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let annotationContainer = HelperFunctions.getFixture().firstElementChild as HTMLElement;
	let annotationContainerChildren = annotationContainer.children;
	let annotationPlaceholder = annotationContainerChildren[0] as HTMLElement;

	HelperFunctions.simulateAction(() => {
		annotationPlaceholder.click();
	});

	let annotationField = document.getElementById(Constants.Ids.annotationField) as HTMLTextAreaElement;

	HelperFunctions.simulateAction(() => {
		annotationField.focus();
		annotationField.value = "   \n";
		annotationField.blur();
		window.dispatchEvent(new Event("mouseup"));
	});

	ok(!document.getElementById(Constants.Ids.annotationField),
		"The annotation field should not be displayed on blur if it is filled with whitespace");
	strictEqual(annotationContainerChildren.length, 1,
		"The annotation container should only contain one child");
	strictEqual(annotationContainerChildren[0].id, Constants.Ids.annotationPlaceholder,
		"The only child of the annotation container should be the annotation placeholder");
});

test("The opened state should be false by default", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	strictEqual(controllerInstance.state.opened, false, "The opened state should be false by default");
});

test("The opened state should be true after clicking on the annotation placeholder", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let annotationContainer = HelperFunctions.getFixture().firstElementChild as HTMLElement;
	let annotationContainerChildren = annotationContainer.children;
	let annotationPlaceholder = annotationContainerChildren[0] as HTMLElement;

	HelperFunctions.simulateAction(() => {
		annotationPlaceholder.click();
	});

	strictEqual(controllerInstance.state.opened, true, "The opened state should be false by default");
});

test("The opened state should be true on blur after populating the annotation field with non whitespace", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let annotationContainer = HelperFunctions.getFixture().firstElementChild as HTMLElement;
	let annotationContainerChildren = annotationContainer.children;
	let annotationPlaceholder = annotationContainerChildren[0] as HTMLElement;

	HelperFunctions.simulateAction(() => {
		annotationPlaceholder.click();
	});

	let annotationField = document.getElementById(Constants.Ids.annotationField) as HTMLTextAreaElement;

	HelperFunctions.simulateAction(() => {
		annotationField.focus();
		annotationField.value = "Non whitespace annotation";
		annotationField.blur();
		window.dispatchEvent(new Event("mouseup"));
	});

	strictEqual(controllerInstance.state.opened, true, "The opened state should remain true on blur");
});

test("The opened state should be false on blur after populating the annotation field with whitespace", () => {
	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let annotationContainer = HelperFunctions.getFixture().firstElementChild as HTMLElement;
	let annotationContainerChildren = annotationContainer.children;
	let annotationPlaceholder = annotationContainerChildren[0] as HTMLElement;

	HelperFunctions.simulateAction(() => {
		annotationPlaceholder.click();
	});

	let annotationField = document.getElementById(Constants.Ids.annotationField) as HTMLTextAreaElement;

	HelperFunctions.simulateAction(() => {
		annotationField.focus();
		annotationField.value = "";
		annotationField.blur();
		window.dispatchEvent(new Event("mouseup"));
	});

	strictEqual(controllerInstance.state.opened, false, "The opened state should become false on blur");
});
