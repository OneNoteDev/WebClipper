import {ChangeLogUpdate} from "../../scripts/versioning/changeLog";
import {ChangeLogHelper} from "../../scripts/versioning/changeLogHelper";
import {Version} from "../../scripts/versioning/version";
import {TestModule} from "../testModule";

export class ChangeLogHelperTests extends TestModule {
	private generalUpdates: ChangeLogUpdate[] = [{
		version: "3.3.1",
		date: "06/13/2016",
		changes: [{
			title: "3.3.1:title",
			description: "3.3.1:description",
			supportedBrowsers: ["Edge", "Chrome", "Firefox", "Safari", "Bookmarklet"]
		}]
	}];

	protected module() {
		return "changeLogHelper";
	}

	protected tests() {
		test("For the case where there is only one update, getUpdatesSinceVersion returns that update if the version parameter is older", () => {
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(this.generalUpdates, new Version("2.3.0")), this.generalUpdates);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(this.generalUpdates, new Version("3.2.0")), this.generalUpdates);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(this.generalUpdates, new Version("3.3.0")), this.generalUpdates);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(this.generalUpdates, new Version("3.2.99")), this.generalUpdates);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(this.generalUpdates, new Version("0.0.0")), this.generalUpdates);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(this.generalUpdates, new Version("2.99.99")), this.generalUpdates);
		});

		test("For the case where there is only one update. getUpdatesSinceVersion returns an empty list if the version parameter is newer", () => {
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(this.generalUpdates, new Version("3.3.2")), []);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(this.generalUpdates, new Version("99.99.99")), []);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(this.generalUpdates, new Version("3.99.0")), []);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(this.generalUpdates, new Version("3.4.0")), []);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(this.generalUpdates, new Version("4.0.0")), []);
		});

		test("For the case where there is only one update, getUpdatesSinceVersion returns the update if passed an undefined version", () => {
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(this.generalUpdates, undefined), this.generalUpdates);
		});

		test("For the case where there is only one update, getUpdatesSinceVersion returns an empty list if the version parameter is the same", () => {
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(this.generalUpdates, new Version(this.generalUpdates[0].version)), []);
		});

		test("For the case where there is only one update, getUpdatesBetweenVersions returns the update if it is between the lower (exclusive) and upper (inclusive) versions", () => {
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(this.generalUpdates, new Version("3.3.0"), new Version("3.3.2")), this.generalUpdates);
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(this.generalUpdates, new Version("3.3.0"), new Version("3.3.1")), this.generalUpdates);
		});

		test("For the case where there is only one update, getUpdatesBetweenVersions returns an empty list if the lower version parameter is the same", () => {
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(this.generalUpdates, new Version("3.3.1"), new Version("3.3.2")), []);
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(this.generalUpdates, new Version("3.3.1"), new Version("3.3.1")), []);
		});

		test("For the case where there is only one update, getUpdatesBetweenVersions behaves like there is no lower bound if it is undefined", () => {
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(this.generalUpdates, undefined, new Version("3.3.2")), this.generalUpdates);
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(this.generalUpdates, undefined, new Version("3.3.1")), this.generalUpdates);
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(this.generalUpdates, undefined, new Version("3.3.0")), []);
		});

		let multipleUpdates: ChangeLogUpdate[] = [{
			version: "5.3.1",
			date: "06/28/2016",
			changes: [{
				title: "5.3.1:title",
				description: "5.3.1:description",
				supportedBrowsers: ["Edge", "Chrome", "Firefox", "Safari"]
			}]
		}, {
			version: "4.3.1",
			date: "06/15/2016",
			changes: [{
				title: "4.3.1:title",
				description: "4.3.1:description",
				supportedBrowsers: ["Edge", "Chrome", "Firefox", "Safari"]
			}]
		}, {
			version: "3.3.1",
			date: "06/13/2016",
			changes: [{
				title: "3.3.0:title",
				description: "3.3.0:description",
				supportedBrowsers: ["Edge", "Chrome", "Firefox", "Safari", "Bookmarklet"]
			}]
		}];

		test("For the multiple updates case, getUpdatesSinceVersion returns all updates if the version parameter is older than all of them", () => {
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, new Version("2.3.0")), multipleUpdates);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, new Version("3.2.0")), multipleUpdates);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, new Version("3.3.0")), multipleUpdates);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, new Version("3.2.99")), multipleUpdates);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, new Version("0.0.0")), multipleUpdates);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, new Version("2.99.99")), multipleUpdates);
		});

		test("For the multiple updates case, getUpdatesSinceVersion returns an empty list if the version parameter is newer than all of them", () => {
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, new Version("5.3.2")), []);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, new Version("99.99.99")), []);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, new Version("5.99.0")), []);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, new Version("5.4.0")), []);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, new Version("6.0.0")), []);
		});

		test("For the multiple updates case, getUpdatesSinceVersion returns the update if passed an undefined version", () => {
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, undefined), multipleUpdates);
		});

		test("For the multiple updates case, getUpdatesSinceVersion returns the newer versions, non-inclusive of the version parameter", () => {
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, new Version("3.3.1")), multipleUpdates.slice(0, 2));
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, new Version("3.3.2")), multipleUpdates.slice(0, 2));
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, new Version("4.3.0")), multipleUpdates.slice(0, 2));
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, new Version("4.3.1")), multipleUpdates.slice(0, 1));
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(multipleUpdates, new Version("5.3.0")), multipleUpdates.slice(0, 1));
		});

		test("For the multiple updates case, getUpdatesBetweenVersions returns the update if it is between the lower (exclusive) and upper (inclusive) versions", () => {
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(multipleUpdates, new Version("3.2.0"), new Version("3.3.0")), []);
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(multipleUpdates, new Version("3.3.0"), new Version("3.3.2")), multipleUpdates.slice(2));
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(multipleUpdates, new Version("4.3.0"), new Version("4.3.1")), multipleUpdates.slice(1, 2));
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(multipleUpdates, new Version("3.3.0"), new Version("5.3.2")), multipleUpdates);
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(multipleUpdates, new Version("3.3.0"), new Version("5.3.1")), multipleUpdates);
		});

		test("For the multiple updates case, getUpdatesBetweenVersions behaves like there is no lower bound if it is undefined", () => {
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(multipleUpdates, undefined, new Version("3.3.0")), []);
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(multipleUpdates, undefined, new Version("3.3.2")), multipleUpdates.slice(2));
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(multipleUpdates, undefined, new Version("4.3.1")), multipleUpdates.slice(1));
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(multipleUpdates, undefined, new Version("5.3.2")), multipleUpdates);
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(multipleUpdates, undefined, new Version("5.3.1")), multipleUpdates);
		});

		// Empty updates cases

		test("If updates is empty, getUpdatesSinceVersion should return an empty list", () => {
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion([], new Version("3.3.0")), []);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion([], undefined), []);
		});

		test("If updates is empty, getUpdatesBetweenVersions should return an empty list", () => {
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions([], new Version("3.3.0"), new Version("4.0.0")), []);
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions([], undefined, new Version("4.0.0")), []);
		});

		// Undefined updates cases

		test("If updates is undefined, getUpdatesSinceVersion should return an empty list", () => {
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(undefined, new Version("3.3.0")), []);
			deepEqual(ChangeLogHelper.getUpdatesSinceVersion(undefined, undefined), []);
		});

		test("If updates is undefined, getUpdatesBetweenVersions should return an empty list", () => {
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(undefined, new Version("3.3.0"), new Version("4.0.0")), []);
			deepEqual(ChangeLogHelper.getUpdatesBetweenVersions(undefined, undefined, new Version("4.0.0")), []);
		});

		// Test filterUpdatesThatDontApplyToBrowser

		test("Given that there is a single major update with all changes that apply to the browser, it should be returned", () => {
			let browser = "X";
			let updates: ChangeLogUpdate[] = [{
				version: "3.3.1",
				date: "06/13/2016",
				changes: [{
					title: "3.3.1:a:title",
					description: "3.3.1:a:description",
					supportedBrowsers: [browser]
				}, {
					title: "3.3.1:b:title",
					description: "3.3.1:b:description",
					supportedBrowsers: [browser]
				}]
			}];
			deepEqual(ChangeLogHelper.filterUpdatesThatDontApplyToBrowser(updates, browser), updates);
		});

		test("Given that there is a single major update with all changes that don't apply to the browser, filterUpdatesThatDontApplyToBrowser should return an empty list", () => {
			let browser = "X";
			let updates: ChangeLogUpdate[] = [{
				version: "3.3.1",
				date: "06/13/2016",
				changes: [{
					title: "3.3.1:a:title",
					description: "3.3.1:a:description",
					supportedBrowsers: [browser]
				}, {
					title: "3.3.1:b:title",
					description: "3.3.1:b:description",
					supportedBrowsers: [browser]
				}]
			}];
			deepEqual(ChangeLogHelper.filterUpdatesThatDontApplyToBrowser(updates, "Y"), []);
		});

		test("Given that there is a single major update with some changes that don't apply to the browser, filterUpdatesThatDontApplyToBrowser should the update with only the changes that match the browser", () => {
			let getUpdates = () => {
				return [{
					version: "3.3.1",
					date: "06/13/2016",
					changes: [{
						title: "3.3.1:a:title",
						description: "3.3.1:a:description",
						supportedBrowsers: ["X"]
					}]
				}];
			};

			let updatesWithX = getUpdates();

			let updatesWithXY = getUpdates();
			updatesWithXY[0].changes.push({
				title: "3.3.1:b:title",
				description: "3.3.1:b:description",
				supportedBrowsers: ["Y"]
			});

			deepEqual(ChangeLogHelper.filterUpdatesThatDontApplyToBrowser(updatesWithXY, "X"), updatesWithX);
		});

		test("Given that there is two major updates with some changes that don't apply to the browser, filterUpdatesThatDontApplyToBrowser should the updates with only the changes that match the browser", () => {
			let getUpdates = () => {
				return [{
					version: "3.3.1",
					date: "06/13/2016",
					changes: [{
						title: "3.3.1:a:title",
						description: "3.3.1:a:description",
						supportedBrowsers: ["X"]
					}]
				}, {
					version: "3.3.2",
					date: "06/14/2016",
					changes: [{
						title: "3.3.2:a:title",
						description: "3.3.2:a:description",
						supportedBrowsers: ["X"]
					}]
				}];
			};

			let updatesWithX = getUpdates();

			let updatesWithXY = getUpdates();
			updatesWithXY[0].changes.push({
				title: "3.3.1:b:title",
				description: "3.3.1:b:description",
				supportedBrowsers: ["Y"]
			});

			deepEqual(ChangeLogHelper.filterUpdatesThatDontApplyToBrowser(updatesWithXY, "X"), updatesWithX);
		});

		test("If any of the parameters are empty or undefined, filterUpdatesThatDontApplyToBrowser should return the empty list", () => {
			deepEqual(ChangeLogHelper.filterUpdatesThatDontApplyToBrowser([], "X"), []);
			deepEqual(ChangeLogHelper.filterUpdatesThatDontApplyToBrowser(undefined, "X"), []);
			deepEqual(ChangeLogHelper.filterUpdatesThatDontApplyToBrowser([], undefined), []);
			deepEqual(ChangeLogHelper.filterUpdatesThatDontApplyToBrowser(undefined, undefined), []);
			deepEqual(ChangeLogHelper.filterUpdatesThatDontApplyToBrowser(undefined, ""), []);
		});
	}
}

(new ChangeLogHelperTests()).runTests();
