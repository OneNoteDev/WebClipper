/// <reference path="../../../../typings/main/ambient/qunit/qunit.d.ts" />

import {Constants} from "../../../scripts/constants";

import {TooltipProps} from "../../../scripts/clipperUI/tooltipProps";

import {ChangeLogPanel} from "../../../scripts/clipperUI/panels/changeLogPanel";

import {HelperFunctions} from "../../helperFunctions";

QUnit.module("changeLogPanel", {});

test("For a single update containing multiple changes, those changes should be displayed", () => {
	let updates = HelperFunctions.getMockUpdates();
	let controllerInstance = HelperFunctions.mountToFixture(
		<ChangeLogPanel updates={updates} />);

	let changesElements = document.getElementsByClassName(Constants.Classes.changes);
	strictEqual(changesElements.length, 1);

	// Get all changes from the mock updates
	let mockChanges = updates.map((update) => update.changes);
	let flattenedMockChanges = mockChanges.reduce((prev, cur) => prev.concat(cur));

	let changes = changesElements[0];
	let changeElements = changes.getElementsByClassName(Constants.Classes.change);
	strictEqual(changeElements.length, flattenedMockChanges.length);
});

test("For multiple updates containing multiple changes each, all changes should be displayed", () => {
	let updates = HelperFunctions.getMockMultipleUpdates();
	let controllerInstance = HelperFunctions.mountToFixture(
		<ChangeLogPanel updates={updates} />);

	let changesElements = document.getElementsByClassName(Constants.Classes.changes);
	strictEqual(changesElements.length, 1);

	// Get all changes from the mock updates
	let mockChanges = updates.map((update) => update.changes);
	let flattenedMockChanges = mockChanges.reduce((prev, cur) => prev.concat(cur));

	let changes = changesElements[0];
	let changeElements = changes.getElementsByClassName(Constants.Classes.change);
	strictEqual(changeElements.length, flattenedMockChanges.length);
});

test("For a single update containing multiple changes, check that their titles and descriptions are being displayed in order", () => {
	let updates = HelperFunctions.getMockUpdates();
	let controllerInstance = HelperFunctions.mountToFixture(
		<ChangeLogPanel updates={updates} />);

	let changesElements = document.getElementsByClassName(Constants.Classes.changes);

	// Get all changes from the mock updates
	let mockChanges = updates.map((update) => update.changes);
	let flattenedMockChanges = mockChanges.reduce((prev, cur) => prev.concat(cur));

	let changes = changesElements[0];
	let changeElements = changes.getElementsByClassName(Constants.Classes.change);

	for (let i = 0; i < changeElements.length; i++) {
		// Check title
		let changeTitleElements = changeElements[i].getElementsByClassName(Constants.Classes.changeTitle);
		strictEqual(changeTitleElements.length, 1);
		strictEqual((changeTitleElements[0] as HTMLElement).innerText, flattenedMockChanges[i].title);

		// Check description
		let changeDescriptionElements = changeElements[i].getElementsByClassName(Constants.Classes.changeDescription);
		strictEqual(changeDescriptionElements.length, 1);
		strictEqual((changeDescriptionElements[0] as HTMLElement).innerText, flattenedMockChanges[i].description);
	}
});

test("For an update containing some changes with image urls, check that they get rendered if they have an image, and not rendered if they don't", () => {
	let updates = HelperFunctions.getMockUpdatesWithSomeImages();
	let controllerInstance = HelperFunctions.mountToFixture(
		<ChangeLogPanel updates={updates} />);

	let changesElements = document.getElementsByClassName(Constants.Classes.changes);

	// Get all changes from the mock updates
	let mockChanges = updates.map((update) => update.changes);
	let flattenedMockChanges = mockChanges.reduce((prev, cur) => prev.concat(cur));

	let changes = changesElements[0];
	let changeElements = changes.getElementsByClassName(Constants.Classes.change);

	for (let i = 0; i < changeElements.length; i++) {
		let changeImageElements = changeElements[i].getElementsByClassName(Constants.Classes.changeImage);
		strictEqual(changeImageElements.length, flattenedMockChanges[i].imageUrl ? 1 : 0);
		if (flattenedMockChanges[i].imageUrl) {
			let imgElements = changeImageElements[0].getElementsByTagName("IMG");
			strictEqual(imgElements.length, 1);
			strictEqual((imgElements[0] as HTMLImageElement).src, flattenedMockChanges[i].imageUrl);
		}
	}
});

test("For multiple updates containing multiple changes each, check that their titles and descriptions are being displayed in order", () => {
	let updates = HelperFunctions.getMockMultipleUpdates();
	let controllerInstance = HelperFunctions.mountToFixture(
		<ChangeLogPanel updates={updates} />);

	let changesElements = document.getElementsByClassName(Constants.Classes.changes);

	// Get all changes from the mock updates
	let mockChanges = updates.map((update) => update.changes);
	let flattenedMockChanges = mockChanges.reduce((prev, cur) => prev.concat(cur));

	let changes = changesElements[0];
	let changeElements = changes.getElementsByClassName(Constants.Classes.change);

	for (let i = 0; i < changeElements.length; i++) {
		// Check title
		let changeTitleElements = changeElements[i].getElementsByClassName(Constants.Classes.changeTitle);
		strictEqual(changeTitleElements.length, 1);
		strictEqual((changeTitleElements[0] as HTMLElement).innerText, flattenedMockChanges[i].title);

		// Check description
		let changeDescriptionElements = changeElements[i].getElementsByClassName(Constants.Classes.changeDescription);
		strictEqual(changeDescriptionElements.length, 1);
		strictEqual((changeDescriptionElements[0] as HTMLElement).innerText, flattenedMockChanges[i].description);
	}
});
