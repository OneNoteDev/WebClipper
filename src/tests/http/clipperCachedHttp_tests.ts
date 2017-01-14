import * as sinon from "sinon";

import {ClipperCachedHttp} from "../../scripts/http/clipperCachedHttp";
import {TimeStampedData} from "../../scripts/http/cachedHttp";

import * as Log from "../../scripts/logging/log";

import {MockLogger} from "../logging/mockLogger";

import {MockStorage} from "../storage/mockStorage";

import {TestModule} from "../testModule";

export class ClipperCachedHttpTests extends TestModule {
	private mockStorage: MockStorage;
	private stubLogger: MockLogger;

	protected module() {
		return "clipperCachedHttp";
	}

	protected beforeEach() {
		this.mockStorage = new MockStorage();
		this.stubLogger = sinon.createStubInstance(MockLogger) as any;
	}

	protected tests() {
		test("When getFreshValue is called with an undefined key, a failure should be logged", () => {
			let clipperCachedHttp = new ClipperCachedHttp(this.mockStorage, this.stubLogger);

			clipperCachedHttp.getFreshValue(undefined, MockStorage.fetchNonLocalData);

			let logFailureSpy = this.stubLogger.logFailure as sinon.SinonSpy;
			ok(logFailureSpy.calledOnce, "logFailure should be called");
			ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
				"logFailure should be called as an unexpected failure caused by an invalid argument");
		});

		test("When getFreshValue is called with an empty key, a failure should be logged", () => {
			let clipperCachedHttp = new ClipperCachedHttp(this.mockStorage, this.stubLogger);

			clipperCachedHttp.getFreshValue("", MockStorage.fetchNonLocalData);

			let logFailureSpy = this.stubLogger.logFailure as sinon.SinonSpy;
			ok(logFailureSpy.calledOnce, "logFailure should be called");
			ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
				"logFailure should be called as an unexpected failure caused by an invalid argument");
		});

		test("When getFreshValue is called with an undefined fetchNonLocalData parameter, a failure should be logged", () => {
			let clipperCachedHttp = new ClipperCachedHttp(this.mockStorage, this.stubLogger);

			clipperCachedHttp.getFreshValue("k", undefined);

			let logFailureSpy = this.stubLogger.logFailure as sinon.SinonSpy;
			ok(logFailureSpy.calledOnce, "logFailure should be called");
			ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
				"logFailure should be called as an unexpected failure caused by an invalid argument");
		});

		test("When getFreshValue is called with an updateInterval of less than 0, a failure should be logged", () => {
			let clipperCachedHttp = new ClipperCachedHttp(this.mockStorage, this.stubLogger);

			clipperCachedHttp.getFreshValue("k", MockStorage.fetchNonLocalData, -1);

			let logFailureSpy = this.stubLogger.logFailure as sinon.SinonSpy;
			ok(logFailureSpy.calledOnce, "logFailure should be called");
			ok(logFailureSpy.calledWith(Log.Failure.Label.InvalidArgument, Log.Failure.Type.Unexpected),
				"logFailure should be called as an unexpected failure caused by an invalid argument");
		});

		test("When getFreshValue is called with valid parameters (assuming when nothing is in storage), logEvent should be called once", (assert: QUnitAssert) => {
			let done = assert.async();

			let clipperCachedHttp = new ClipperCachedHttp(this.mockStorage, this.stubLogger);

			clipperCachedHttp.getFreshValue("k", MockStorage.fetchNonLocalData, 0).then((timeStampedData) => {
				let logEventSpy = this.stubLogger.logEvent as sinon.SinonSpy;
				ok(logEventSpy.calledOnce,
					"logEvent should be called when the fetchNonLocalData function is executed");
			}, (error) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("When getFreshValue is called with valid parameters (assuming something fresh is in storage), logEvent should not be called, as the remote function is not executed", (assert: QUnitAssert) => {
			let done = assert.async();

			let expiry = 99999999;
			let key = "k";
			let value = {
				lastUpdated: Date.now(),
				data: "{}"
			} as TimeStampedData;
			this.mockStorage.setValue(key, JSON.stringify(value));

			let clipperCachedHttp = new ClipperCachedHttp(this.mockStorage, this.stubLogger);

			clipperCachedHttp.getFreshValue(key, MockStorage.fetchNonLocalData, expiry).then((timeStampedData) => {
				let logEventSpy = this.stubLogger.logEvent as sinon.SinonSpy;
				ok(logEventSpy.notCalled,
					"logEvent should not be called as the fetchNonLocalData function was not executed");
			}, (error) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});
	}
}

(new ClipperCachedHttpTests()).runTests();
