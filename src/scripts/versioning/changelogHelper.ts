import {ChangeLogUpdate} from "./changeLog";
import {Version} from "./version";

export class ChangeLogHelper {
	/**
	 * Given a list of updates sorted in descending order, returns the updates that are more recent
	 * than the specified verison. If the version is not specified (i.e., undefined), all updates
	 * are returned.
	 */
	public static getUpdatesSinceVersion(updates: ChangeLogUpdate[], version: Version): ChangeLogUpdate[] {
		if (!updates || updates.length === 0) {
			return [];
		}

		if (!version) {
			return updates;
		}

		for (let i = 0; i < updates.length; i++) {
			let updateVersion = new Version(updates[i].version);
			if (version.isGreaterThanOrEqualTo(updateVersion)) {
				return updates.slice(0, i);
			}
		}
		return updates;
	}

	/**
	 * Given a list of updates sorted in descending order, returns the updates between a lower (exclusive)
	 * and upper (inclusive) bound version. If the lower bound is not specified (i.e., undefined), all updates
	 * before the upper bound are returned.
	 */
	public static getUpdatesBetweenVersions(updates: ChangeLogUpdate[], lowerVersion: Version, higherVersion: Version): ChangeLogUpdate[] {
		if (!updates || updates.length === 0) {
			return [];
		}

		let betweenUpdates = [];
		for (let update of updates) {
			let updateVersion = new Version(update.version);
			if (lowerVersion && updateVersion.isLesserThanOrEqualTo(lowerVersion)) {
				break;
			}
			if (updateVersion.isLesserThanOrEqualTo(higherVersion)) {
				betweenUpdates.push(update);
			}
		}
		return betweenUpdates;
	}

	/**
	 * Given a list of updates, returns the updates that contain at least one change that applies to the given
	 * browser type (i.e., filtering out updates that do not apply to the specified browser).
	 */
	public static filterUpdatesThatDontApplyToBrowser(updates: ChangeLogUpdate[], browser: string): ChangeLogUpdate[] {
		if (!updates || !browser) {
			return [];
		}

		let filteredUpdates: ChangeLogUpdate[] = [];

		for (let update of updates) {
			let filteredChanges = update.changes.filter((change) => change.supportedBrowsers.indexOf(browser) !== -1);

			// We are only interested in an update if it had at least one change relevant to the browser
			if (filteredChanges.length > 0) {
				// Do this to keep the function pure
				filteredUpdates.push({
					version: update.version,
					date: update.date,
					changes: filteredChanges
				});
			}
		}

		return filteredUpdates;
	}
}
