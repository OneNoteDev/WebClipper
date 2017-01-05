export enum Feature {
	DummyExperiment
};

export class Experiments {
	protected static featuresToNumberlinesMap = {
		DummyExperiment: "dummy-flight"
	};

	public static updateIntervalForFlights = 60 * 60 * 5 * 1000; // 5 hours

	/**
	 * This functions returns true/false if a particular feature (identified by a feature name set in Experiments.ts)
	 * is enabled for this user
	 * @param nameOfFeature the name of the feature, as described in constants.ts
	 * @returns True/False
	 */
	public static isFeatureEnabled(feature: Feature, flights: string[]): boolean {
		let nameOfFeature = Feature[feature];

		if (!Experiments.featuresToNumberlinesMap || !Experiments.featuresToNumberlinesMap[nameOfFeature]) {
			return false;
		}

		let numberline = Experiments.featuresToNumberlinesMap[nameOfFeature];
		if (!flights || flights.indexOf(numberline) === -1) {
			return false;
		}

		return true;
	}
};
