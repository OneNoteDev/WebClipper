/// <reference path="../../typings/main/ambient/qunit/qunit.d.ts" />
import {Experiments} from "../scripts/experiments";

QUnit.module("experiments", {});

// Test empty flights, garbage flights, real flights with empty experiment name, garbage experiment name
test("isFeatureEnabled should return False (OFF) for an undefined Feature", () => {
	let fakeFlights = ["muidflt1-test", "muidflt2-test"];
	ok(!Experiments.isFeatureEnabled(undefined, fakeFlights), "isFeatureEnabled incorrectly returned TRUE For blank setting with blank flights");
});

test("isFeatureEnabled should return False (OFF) for a valid Feature, but an undefined array of flights", () => {
	let fakeFlights;
	ok(!Experiments.isFeatureEnabled(Experiments.Feature.DummyExperiment, fakeFlights), "isFeatureEnabled returned True (ON) for Feature that should be OFF because of blank flights");
});

test("isFeatureEnabled should return False (OFF) for an empty array of flights", () => {
	let fakeFlights = [];
	ok(!Experiments.isFeatureEnabled(Experiments.Feature.DummyExperiment, fakeFlights), "isFeatureEnabled incorrectly returned True (ON) for an empty flights array");
});

test("isFeatureEnabled should return False (OFF) for a valid Feature whose corresponding numberline doesn't exist in the array of flights", () => {
	let fakeFlights = ["muidflt-test1", "muidflt-test2"];
	ok(!Experiments.isFeatureEnabled(Experiments.Feature.DummyExperiment, fakeFlights), "isFeatureEnabled returned True (ON) for Feature that should be OFF because it does not appear in the array of flights");
});

test("isFeatureEnabled should return True (ON) for a valid Feature and when the corresponding numberline exists in the array of flights", () => {
	let fakeFlights = ["muidflt60-clprin", "dummy-flight", "muidflt62-aug"];
	ok(Experiments.isFeatureEnabled(Experiments.Feature.DummyExperiment, fakeFlights), "isFeatureEnabled returned False (OFF) for Feature that should be ON");
});

test("isFeatureEnabled should return False (OFF) for a valid Feature in Experiments, and the corresponding numberline is a substring of an individual flight in the flights passed in", () => {
	let fakeFlights = ["muidflt60-clprin", "premuidflt62-wne", "substringdummy-flight"];
	ok(!Experiments.isFeatureEnabled(Experiments.Feature.DummyExperiment, fakeFlights), "isFeatureEnabled incorrectly returned true when the numberline itself was not in flights, but it was a substring of another numberline");
});
