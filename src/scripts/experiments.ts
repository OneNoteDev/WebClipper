export module Experiments {
	let featuresToNumberlinesMap = {
		DummyExperiment: "dummy-flight"
	};

	export var updateIntervalForFlights = 60 * 60 * 5 * 1000; // 5 hours

	export enum Feature {
		DummyExperiment
	};

	/**
	 * This functions returns true/false if a particular feature (identified by a feature name set in Experiments.ts)
	 * is enabled for this user
	 * @param nameOfFeature the name of the feature, as described in constants.ts
	 * @returns True/False
	 */
	export function isFeatureEnabled(feature: Experiments.Feature, flights: string[]): boolean {
		let nameOfFeature = Feature[feature];

		if (!featuresToNumberlinesMap || !featuresToNumberlinesMap[nameOfFeature]) {
			return false;
		}

		let numberline = featuresToNumberlinesMap[nameOfFeature];
		if (!flights || flights.indexOf(numberline) === -1) {
			return false;
		}

		return true;
	}
};
