import {ChangeLog} from "./changeLog";
import {Version} from "./version";

export module ChangeLogHelper {
	/**
	 * Given a list of updates sorted in descending order, returns the updates that are more recent
	 * than the specified verison. If the version is not specified (i.e., undefined), all updates
	 * are returned.
	 */
	export function getUpdatesSinceVersion(updates: ChangeLog.Update[], version: Version): ChangeLog.Update[] {
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
	export function getUpdatesBetweenVersions(updates: ChangeLog.Update[], lowerVersion: Version, higherVersion: Version): ChangeLog.Update[] {
		if (!updates || updates.length === 0) {
			return [];
		}

		let betweenUpdates = [];
		for (let i = 0; i < updates.length; i++) {
			let updateVersion = new Version(updates[i].version);
			if (lowerVersion && updateVersion.isLesserThanOrEqualTo(lowerVersion)) {
				break;
			}
			if (updateVersion.isLesserThanOrEqualTo(higherVersion)) {
				betweenUpdates.push(updates[i]);
			}
		}
		return betweenUpdates;
	}

	/**
	 * Given a list of updates, returns the updates that contain at least one change that applies to the given
	 * browser type (i.e., filtering out updates that do not apply to the specified browser).
	 */
	export function filterUpdatesThatDontApplyToBrowser(updates: ChangeLog.Update[], browser: string): ChangeLog.Update[] {
		if (!updates || !browser) {
			return [];
		}

		let filteredUpdates: ChangeLog.Update[] = [];

		for (let i = 0; i < updates.length; i++) {
			let update = updates[i];
			let filteredChanges = update.changes.filter(change => change.supportedBrowsers.indexOf(browser) !== -1);

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
