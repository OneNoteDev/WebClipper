import * as sinon from "sinon";

import {Clipper} from "../../../scripts/clipperUI/frontEndGlobals";
import {Status} from "../../../scripts/clipperUI/status";
import {OneNoteApiUtils} from "../../../scripts/clipperUI/oneNoteApiUtils";

import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

import {ClipperStorageKeys} from "../../../scripts/storage/clipperStorageKeys";

import {SectionPicker, SectionPickerClass, SectionPickerState} from "../../../scripts/clipperUI/components/sectionPicker";

import { SectionPickerUtils } from "./sectionPickerUtils";

export class SectionPickerSinonTests extends TestModule {
	private defaultComponent;
	private mockClipperState = MockProps.getMockClipperState();

	private server: Sinon.SinonFakeServer;

	private testConstants = {
		Ids: {
			sectionLocationContainer: "sectionLocationContainer",
			sectionPickerContainer: "sectionPickerContainer"
		}
	};

	private defaultUserInfoAsJsonString = JSON.stringify({
		emailAddress: "mockEmail@hotmail.com",
		fullName: "Mock Johnson",
		accessToken: "mockToken",
		accessTokenExpiration: 3000
	});

	protected module() {
		return "sectionPicker-sinon";
	}

	protected beforeEach() {
		this.defaultComponent = <SectionPicker
			onPopupToggle={() => {}}
			clipperState={this.mockClipperState} />;

		this.server = sinon.fakeServer.create();
		this.server.respondImmediately = true;
	}

	protected afterEach() {
		this.server.restore();
	}

	protected tests() {
		test("retrieveAndUpdateNotebookAndSectionSelection should update states correctly when there's notebook and curSection information found in storage," +
			"the user does not make a new selection, and then information is found on the server. Also the notebooks are the same in storage and on the server, " +
			"and the current section in storage is the same as the default section in the server's notebook list", (assert: QUnitAssert) => {
			let done = assert.async();

			let clipperState = MockProps.getMockClipperState();

			// Set up the storage mock
			let mockNotebooks = MockProps.getMockNotebooks();
			let mockSection = {
				section: mockNotebooks[0].sections[0],
				path: "Clipper Test > Full Page",
				parentId: mockNotebooks[0].id
			};
			SectionPickerUtils.initializeClipperStorage(JSON.stringify(mockNotebooks), JSON.stringify(mockSection), this.defaultUserInfoAsJsonString);

			// After retrieving fresh notebooks, the storage should be updated with the fresh notebooks (although it's the same in this case)
			let freshNotebooks = MockProps.getMockNotebooks();
			let responseJson = {
				"@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks",
				"value": freshNotebooks
			};
			this.server.respondWith([200, { "Content-Type": "application/json" }, JSON.stringify(responseJson)]);

			let component = <SectionPicker onPopupToggle={() => {}} clipperState={clipperState} />;
			let controllerInstance = MithrilUtils.mountToFixture(component);

			strictEqual(JSON.stringify(controllerInstance.state), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: mockSection }),
				"After the component is mounted, the state should be updated to reflect the notebooks and section found in storage");

			controllerInstance.retrieveAndUpdateNotebookAndSectionSelection().then((response) => {
				Clipper.getStoredValue(ClipperStorageKeys.cachedNotebooks, (notebooks) => {
					Clipper.getStoredValue(ClipperStorageKeys.currentSelectedSection, (curSection) => {
						strictEqual(notebooks, JSON.stringify(freshNotebooks),
							"After fresh notebooks have been retrieved, the storage should be updated with them. In this case, nothing should have changed.");
						strictEqual(curSection, JSON.stringify(mockSection),
							"The current selected section in storage should not have changed");

						strictEqual(JSON.stringify(controllerInstance.state.notebooks), JSON.stringify(freshNotebooks),
							"The state should always be updated with the fresh notebooks once it has been retrieved");
						strictEqual(JSON.stringify(controllerInstance.state.curSection), JSON.stringify(mockSection),
							"Since curSection was found in storage, and the user did not make an action to select another section, it should remain the same in state");
						strictEqual(controllerInstance.state.status, Status.Succeeded, "The status should be Succeeded");
						done();
					});
				});
			}, (error) => {
				ok(false, "reject should not be called");
			});
		});

		test("retrieveAndUpdateNotebookAndSectionSelection should update states correctly when there's notebook and curSection information found in storage," +
			"the user does not make a new selection, and then information is found on the server. The notebooks on the server is not the same as the ones in storage, " +
			"and the current section in storage is the same as the default section in the server's notebook list", (assert: QUnitAssert) => {
			let done = assert.async();

			let clipperState = MockProps.getMockClipperState();

			// Set up the storage mock
			let mockNotebooks = MockProps.getMockNotebooks();
			let mockSection = {
				section: mockNotebooks[0].sections[0],
				path: "Clipper Test > Full Page",
				parentId: mockNotebooks[0].id
			};
			SectionPickerUtils.initializeClipperStorage(JSON.stringify(mockNotebooks), JSON.stringify(mockSection), this.defaultUserInfoAsJsonString);

			let component = <SectionPicker
				onPopupToggle={() => {}}
				clipperState={clipperState} />;
			let controllerInstance = MithrilUtils.mountToFixture(component);

			strictEqual(JSON.stringify(controllerInstance.state), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: mockSection }),
				"After the component is mounted, the state should be updated to reflect the notebooks and section found in storage");

			// After retrieving fresh notebooks, the storage should be updated with the fresh notebooks
			let freshNotebooks = MockProps.getMockNotebooks();
			freshNotebooks.push(SectionPickerUtils.createNotebook("id", false, [], []));
			let responseJson = {
				"@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks",
				"value": freshNotebooks
			};
			this.server.respondWith([200, { "Content-Type": "application/json" }, JSON.stringify(responseJson)]);

			controllerInstance.retrieveAndUpdateNotebookAndSectionSelection().then((response: SectionPickerState) => {
				Clipper.getStoredValue(ClipperStorageKeys.cachedNotebooks, (notebooks) => {
					Clipper.getStoredValue(ClipperStorageKeys.currentSelectedSection, (curSection) => {
						strictEqual(notebooks, JSON.stringify(freshNotebooks),
							"After fresh notebooks have been retrieved, the storage should be updated with them. In this case, nothing should have changed.");
						strictEqual(curSection, JSON.stringify(mockSection),
							"The current selected section in storage should not have changed");

						strictEqual(JSON.stringify(controllerInstance.state.notebooks), JSON.stringify(freshNotebooks),
							"The state should always be updated with the fresh notebooks once it has been retrieved");
						strictEqual(JSON.stringify(controllerInstance.state.curSection), JSON.stringify(mockSection),
							"Since curSection was found in storage, and the user did not make an action to select another section, it should remain the same in state");
						strictEqual(controllerInstance.state.status, Status.Succeeded,
							"The status should be Succeeded");
						done();
					});
				});
			}, (error) => {
				ok(false, "reject should not be called");
			});
		});

		test("retrieveAndUpdateNotebookAndSectionSelection should update states correctly when there's notebook, but no curSection information found in storage," +
			"the user does not make a selection, and then information is found on the server. The notebooks on the server is the same as the ones in storage, " +
			"and the current section in storage is still undefined by the time the fresh notebooks have been retrieved", (assert: QUnitAssert) => {
			let done = assert.async();

			let clipperState = MockProps.getMockClipperState();

			// Set up the storage mock
			let mockNotebooks = MockProps.getMockNotebooks();
			SectionPickerUtils.initializeClipperStorage(JSON.stringify(mockNotebooks), undefined, this.defaultUserInfoAsJsonString);

			let component = <SectionPicker
				onPopupToggle={() => {}}
				clipperState={clipperState} />;
			let controllerInstance = MithrilUtils.mountToFixture(component);

			strictEqual(JSON.stringify(controllerInstance.state), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: undefined }),
				"After the component is mounted, the state should be updated to reflect the notebooks and section found in storage");

			// After retrieving fresh notebooks, the storage should be updated with the fresh notebooks (although it's the same in this case)
			let freshNotebooks = MockProps.getMockNotebooks();
			freshNotebooks.push(SectionPickerUtils.createNotebook("id", false, [], []));
			let responseJson = {
				"@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks",
				"value": freshNotebooks
			};
			this.server.respondWith([200, { "Content-Type": "application/json" }, JSON.stringify(responseJson)]);

			// This is the default section in the mock notebooks, and this should be found in storage and state after fresh notebooks are retrieved
			let defaultSection = {
				path: "Clipper Test > Full Page",
				section: mockNotebooks[0].sections[0]
			};

			controllerInstance.retrieveAndUpdateNotebookAndSectionSelection().then((response: SectionPickerState) => {
				Clipper.getStoredValue(ClipperStorageKeys.cachedNotebooks, (notebooks) => {
					Clipper.getStoredValue(ClipperStorageKeys.currentSelectedSection, (curSection) => {
						strictEqual(notebooks, JSON.stringify(freshNotebooks),
							"After fresh notebooks have been retrieved, the storage should be updated with them. In this case, nothing should have changed.");
						strictEqual(curSection, JSON.stringify(defaultSection),
							"The current selected section in storage should have been updated with the default section since it was undefined before");

						strictEqual(JSON.stringify(controllerInstance.state.notebooks), JSON.stringify(freshNotebooks),
							"The state should always be updated with the fresh notebooks once it has been retrieved");
						strictEqual(JSON.stringify(controllerInstance.state.curSection), JSON.stringify(defaultSection),
							"Since curSection was not found in storage, and the user did not make an action to select another section, it should be updated in state");
						strictEqual(controllerInstance.state.status, Status.Succeeded,
							"The status should be Succeeded");
						done();
					});
				});
			}, (error) => {
				ok(false, "reject should not be called");
			});
		});

		test("retrieveAndUpdateNotebookAndSectionSelection should update states correctly when there's notebook, but no curSection information found in storage," +
			"the user makes a new section selection, and then information is found on the server. The notebooks on the server is the same as the ones in storage, " +
			"and the current section in storage is still undefined by the time the fresh notebooks have been retrieved", (assert: QUnitAssert) => {
			let done = assert.async();

			let clipperState = MockProps.getMockClipperState();

			// Set up the storage mock
			let mockNotebooks = MockProps.getMockNotebooks();
			SectionPickerUtils.initializeClipperStorage(JSON.stringify(mockNotebooks), undefined, this.defaultUserInfoAsJsonString);

			let component = <SectionPicker
				onPopupToggle={() => {}}
				clipperState={clipperState} />;
			let controllerInstance = MithrilUtils.mountToFixture(component);

			strictEqual(JSON.stringify(controllerInstance.state), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: undefined }),
				"After the component is mounted, the state should be updated to reflect the notebooks and section found in storage");

			// The user now clicks on a section (second section of second notebook)
			MithrilUtils.simulateAction(() => {
				document.getElementById(this.testConstants.Ids.sectionLocationContainer).click();
			});
			let sectionPicker = document.getElementById(this.testConstants.Ids.sectionPickerContainer).firstElementChild;
			let second = sectionPicker.childNodes[1];
			let secondNotebook = second.childNodes[0] as HTMLElement;
			let secondSections = second.childNodes[1] as HTMLElement;
			MithrilUtils.simulateAction(() => {
				secondNotebook.click();
			});
			let newSelectedSection = secondSections.childNodes[1] as HTMLElement;
			MithrilUtils.simulateAction(() => {
				// The clickable element is actually the first childNode
				(newSelectedSection.childNodes[0] as HTMLElement).click();
			});

			// This corresponds to the second section of the second notebook in the mock notebooks
			let selectedSection = {
				section: mockNotebooks[1].sections[1],
				path: "Clipper Test 2 > Section Y",
				parentId: "a-bc!d"
			};

			Clipper.getStoredValue(ClipperStorageKeys.currentSelectedSection, (curSection1) => {
				strictEqual(curSection1, JSON.stringify(selectedSection),
					"The current selected section in storage should have been updated with the selected section");
				strictEqual(JSON.stringify(controllerInstance.state.curSection), JSON.stringify(selectedSection),
					"The current selected section in state should have been updated with the selected section");

				// After retrieving fresh notebooks, the storage should be updated with the fresh notebooks (although it's the same in this case)
				let freshNotebooks = MockProps.getMockNotebooks();
				freshNotebooks.push(SectionPickerUtils.createNotebook("id", false, [], []));
				let responseJson = {
					"@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks",
					"value": freshNotebooks
				};
				this.server.respondWith([200, { "Content-Type": "application/json" }, JSON.stringify(responseJson)]);

				controllerInstance.retrieveAndUpdateNotebookAndSectionSelection().then((response: SectionPickerState) => {
					Clipper.getStoredValue(ClipperStorageKeys.cachedNotebooks, (notebooks) => {
						Clipper.getStoredValue(ClipperStorageKeys.currentSelectedSection, (curSection2) => {
							strictEqual(notebooks, JSON.stringify(freshNotebooks),
								"After fresh notebooks have been retrieved, the storage should be updated with them. In this case, nothing should have changed.");
							strictEqual(curSection2, JSON.stringify(selectedSection),
								"The current selected section in storage should still be the selected section");

							strictEqual(JSON.stringify(controllerInstance.state.notebooks), JSON.stringify(freshNotebooks),
								"The state should always be updated with the fresh notebooks once it has been retrieved");
							strictEqual(JSON.stringify(controllerInstance.state.curSection), JSON.stringify(selectedSection),
								"The current selected section in state should still be the selected section");
							strictEqual(controllerInstance.state.status, Status.Succeeded,
								"The status should be Succeeded");
							done();
						});
					});
				}, (error) => {
					ok(false, "reject should not be called");
				});
			});
		});

		test("retrieveAndUpdateNotebookAndSectionSelection should update states correctly when there's notebook and curSection information found in storage," +
			" and then information is found on the server, but that selected section no longer exists.", (assert: QUnitAssert) => {
			let done = assert.async();

			let clipperState = MockProps.getMockClipperState();

			// Set up the storage mock
			let mockNotebooks = MockProps.getMockNotebooks();
			let mockSection = {
				section: mockNotebooks[0].sections[0],
				path: "Clipper Test > Full Page",
				parentId: mockNotebooks[0].id
			};
			SectionPickerUtils.initializeClipperStorage(JSON.stringify(mockNotebooks), JSON.stringify(mockSection), this.defaultUserInfoAsJsonString);

			let component = <SectionPicker
				onPopupToggle={() => {}}
				clipperState={clipperState} />;
			let controllerInstance = MithrilUtils.mountToFixture(component);

			strictEqual(JSON.stringify(controllerInstance.state), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: mockSection }),
				"After the component is mounted, the state should be updated to reflect the notebooks and section found in storage");

			// After retrieving fresh notebooks, the storage should be updated with the fresh notebooks (we deleted the cached currently selected section)
			let freshNotebooks = MockProps.getMockNotebooks();
			freshNotebooks[0].sections = [];
			let responseJson = {
				"@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks",
				"value": freshNotebooks
			};
			this.server.respondWith([200, { "Content-Type": "application/json" }, JSON.stringify(responseJson)]);

			controllerInstance.retrieveAndUpdateNotebookAndSectionSelection().then((response: SectionPickerState) => {
				Clipper.getStoredValue(ClipperStorageKeys.cachedNotebooks, (notebooks) => {
					Clipper.getStoredValue(ClipperStorageKeys.currentSelectedSection, (curSection2) => {
						strictEqual(notebooks, JSON.stringify(freshNotebooks),
							"After fresh notebooks have been retrieved, the storage should be updated with them.");
						strictEqual(curSection2, undefined,
							"The current selected section in storage should now be undefined as it no longer exists in the fresh notebooks");
						strictEqual(JSON.stringify(controllerInstance.state.notebooks), JSON.stringify(freshNotebooks),
							"The state should always be updated with the fresh notebooks once it has been retrieved");
						strictEqual(controllerInstance.state.curSection, undefined,
							"The current selected section in state should be undefined");
						strictEqual(controllerInstance.state.status, Status.Succeeded,
							"The status should be Succeeded");
						done();
					});
				});
			}, (error) => {
				ok(false, "reject should not be called");
			});
		});

		test("retrieveAndUpdateNotebookAndSectionSelection should update states correctly when there's notebook and curSection information found in storage," +
			"the user does not make a new selection, and then notebooks is incorrectly returned as undefined or null from the server", (assert: QUnitAssert) => {
			let done = assert.async();

			let clipperState = MockProps.getMockClipperState();

			// Set up the storage mock
			let mockNotebooks = MockProps.getMockNotebooks();
			let mockSection = {
				section: mockNotebooks[0].sections[0],
				path: "Clipper Test > Full Page",
				parentId: mockNotebooks[0].id
			};
			SectionPickerUtils.initializeClipperStorage(JSON.stringify(mockNotebooks), JSON.stringify(mockSection), this.defaultUserInfoAsJsonString);

			let component = <SectionPicker
				onPopupToggle={() => {}}
				clipperState={clipperState} />;
			let controllerInstance = MithrilUtils.mountToFixture(component);

			strictEqual(JSON.stringify(controllerInstance.state), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: mockSection }),
				"After the component is mounted, the state should be updated to reflect the notebooks and section found in storage");

			// After retrieving fresh undefined notebooks, the storage should not be updated with the undefined value, but should still keep the old cached information
			let responseJson = {
				"@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks",
				"value": undefined
			};
			this.server.respondWith([200, { "Content-Type": "application/json" }, JSON.stringify(responseJson)]);

			controllerInstance.retrieveAndUpdateNotebookAndSectionSelection().then((response: SectionPickerState) => {
				ok(false, "resolve should not be called");
			}, (error) => {
				Clipper.getStoredValue(ClipperStorageKeys.cachedNotebooks,
				(notebooks) => {
					Clipper.getStoredValue(ClipperStorageKeys.currentSelectedSection,
					(curSection) => {
						strictEqual(notebooks,
							JSON.stringify(mockNotebooks),
							"After undefined notebooks have been retrieved, the storage should not be updated with them.");
						strictEqual(curSection,
							JSON.stringify(mockSection),
							"The current selected section in storage should not have changed");

						strictEqual(JSON.stringify(controllerInstance.state.notebooks),
							JSON.stringify(mockNotebooks),
							"The state should not be updated as retrieving fresh notebooks returned undefined");
						strictEqual(JSON.stringify(controllerInstance.state.curSection),
							JSON.stringify(mockSection),
							"Since curSection was found in storage, and the user did not make an action to select another section, it should remain the same in state");
						strictEqual(controllerInstance.state.status, Status.Failed, "The status should be Failed");
						done();
					});
				});
			});
		});

		test("retrieveAndUpdateNotebookAndSectionSelection should update states correctly when there's notebook and curSection information found in storage," +
			"the user does not make a new selection, and the server returns an error status code", (assert: QUnitAssert) => {
			let done = assert.async();

			let clipperState = MockProps.getMockClipperState();

			// Set up the storage mock
			let mockNotebooks = MockProps.getMockNotebooks();
			let mockSection = {
				section: mockNotebooks[0].sections[0],
				path: "Clipper Test > Full Page",
				parentId: mockNotebooks[0].id
			};
			SectionPickerUtils.initializeClipperStorage(JSON.stringify(mockNotebooks), JSON.stringify(mockSection), this.defaultUserInfoAsJsonString);

			let component = <SectionPicker
				onPopupToggle={() => {}}
				clipperState={clipperState} />;
			let controllerInstance = MithrilUtils.mountToFixture(component);

			strictEqual(JSON.stringify(controllerInstance.state), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: mockSection }),
				"After the component is mounted, the state should be updated to reflect the notebooks and section found in storage");

			// After retrieving fresh undefined notebooks, the storage should not be updated with the undefined value, but should still keep the old cached information
			let responseJson = {};
			this.server.respondWith([404, { "Content-Type": "application/json" }, JSON.stringify(responseJson)]);

			controllerInstance.retrieveAndUpdateNotebookAndSectionSelection().then((response: SectionPickerState) => {
				ok(false, "resolve should not be called");
			}, (error) => {
				Clipper.getStoredValue(ClipperStorageKeys.cachedNotebooks, (notebooks) => {
					Clipper.getStoredValue(ClipperStorageKeys.currentSelectedSection, (curSection) => {
						strictEqual(notebooks, JSON.stringify(mockNotebooks),
							"After undefined notebooks have been retrieved, the storage should not be updated with them.");
						strictEqual(curSection, JSON.stringify(mockSection),
							"The current selected section in storage should not have changed");

						strictEqual(JSON.stringify(controllerInstance.state.notebooks), JSON.stringify(mockNotebooks),
							"The state should not be updated as retrieving fresh notebooks returned undefined");
						strictEqual(JSON.stringify(controllerInstance.state.curSection), JSON.stringify(mockSection),
							"Since curSection was found in storage, and the user did not make an action to select another section, it should remain the same in state");
						strictEqual(controllerInstance.state.status, Status.Succeeded, "The status should be Succeeded since we have a fallback in storage");
						done();
					});
				});
			});
		});

		test("retrieveAndUpdateNotebookAndSectionSelection should update states correctly when there's no notebook and curSection information found in storage," +
			"the user does not make a new selection, and the server returns an error status code, therefore there's no fallback notebooks", (assert: QUnitAssert) => {
			let done = assert.async();

			let clipperState = MockProps.getMockClipperState();

			// Set up the storage mock
			SectionPickerUtils.initializeClipperStorage(undefined, undefined, this.defaultUserInfoAsJsonString);

			let component = <SectionPicker
				onPopupToggle={() => {}}
				clipperState={clipperState} />;
			let controllerInstance = MithrilUtils.mountToFixture(component);

			strictEqual(JSON.stringify(controllerInstance.state), JSON.stringify({ notebooks: undefined, status: Status.NotStarted, curSection: undefined }),
				"After the component is mounted, the state should be updated to reflect that notebooks and current section are not found in storage");

			// After retrieving fresh undefined notebooks, the storage should not be updated with the undefined value, but should still keep the old cached information
			let responseJson = {};
			this.server.respondWith([404, { "Content-Type": "application/json" }, JSON.stringify(responseJson)]);

			controllerInstance.retrieveAndUpdateNotebookAndSectionSelection().then((response: SectionPickerState) => {
				ok(false, "resolve should not be called");
			}, (error) => {
				Clipper.getStoredValue(ClipperStorageKeys.cachedNotebooks, (notebooks) => {
					Clipper.getStoredValue(ClipperStorageKeys.currentSelectedSection, (curSection) => {
						strictEqual(notebooks, undefined,
							"After undefined notebooks have been retrieved, the storage notebook value should still be undefined");
						strictEqual(curSection, undefined,
							"After undefined notebooks have been retrieved, the storage section value should still be undefined as there was no default section present");

						strictEqual(controllerInstance.state.notebooks, undefined,
							"After undefined notebooks have been retrieved, the state notebook value should still be undefined");
						strictEqual(controllerInstance.state.curSection, undefined,
							"After undefined notebooks have been retrieved, the state section value should still be undefined as there was no default section present");
						strictEqual(controllerInstance.state.status, Status.Failed, "The status should be Failed since getting fresh notebooks has failed and we don't have a fallback");
						done();
					});
				});
			});
		});

		test("fetchFreshNotebooks should parse out @odata.context from the raw 200 response and return the notebook object list and XHR in the resolve", (assert: QUnitAssert) => {
			let done = assert.async();

			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let notebooks = MockProps.getMockNotebooks();
			let responseJson = {
				"@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks",
				"value": notebooks
			};
			this.server.respondWith([200, { "Content-Type": "application/json" }, JSON.stringify(responseJson)]);

			controllerInstance.fetchFreshNotebooks("sessionId").then((responsePackage: OneNoteApi.ResponsePackage<OneNoteApi.Notebook[]>) => {
				strictEqual(JSON.stringify(responsePackage.parsedResponse), JSON.stringify(notebooks),
					"The notebook list should be present in the response");
				ok(!!responsePackage.request,
					"The XHR must be present in the response");
			}, (error) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("fetchFreshNotebooks should parse out @odata.context from the raw 201 response and return the notebook object list and XHR in the resolve", (assert: QUnitAssert) => {
			let done = assert.async();

			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let notebooks = MockProps.getMockNotebooks();
			let responseJson = {
				"@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks",
				"value": notebooks
			};
			this.server.respondWith([201, { "Content-Type": "application/json" }, JSON.stringify(responseJson)]);

			controllerInstance.fetchFreshNotebooks("sessionId").then((responsePackage: OneNoteApi.ResponsePackage<OneNoteApi.Notebook[]>) => {
				strictEqual(JSON.stringify(responsePackage.parsedResponse), JSON.stringify(notebooks),
					"The notebook list should be present in the response");
				ok(!!responsePackage.request,
					"The XHR must be present in the response");
			}, (error) => {
				ok(false, "reject should not be called");
			}).then(() => {
				done();
			});
		});

		test("fetchFreshNotebooks should reject with the error object and a copy of the response if the status code is 4XX", (assert: QUnitAssert) => {
			let done = assert.async();

			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let responseJson = {
				error: "Unexpected response status",
				statusCode: 401,
				responseHeaders: { "Content-Type": "application/json" }
			};

			let expected = {
				error: responseJson.error,
				statusCode: responseJson.statusCode,
				responseHeaders: responseJson.responseHeaders,
				response: JSON.stringify(responseJson),
				timeout: 30000
			};

			this.server.respondWith([expected.statusCode, expected.responseHeaders, expected.response]);

			controllerInstance.fetchFreshNotebooks("sessionId").then((responsePackage: OneNoteApi.ResponsePackage<OneNoteApi.Notebook[]>) => {
				ok(false, "resolve should not be called");
			}, (error) => {
				deepEqual(error, expected, "The error object should be rejected");
				strictEqual(controllerInstance.state.apiResponseCode, undefined);
			}).then(() => {
				done();
			});
		});

		test("fetchFreshNotebooks should reject with the error object and an API response code if one is returned by the API", (assert: QUnitAssert) => {
			let done = assert.async();

			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let responseJson = {
				error: {
					"code": "10008",
					"message": "The user's OneDrive, Group or Document Library contains more than 5000 items and cannot be queried using the API.",
					"@api.url": "http://aka.ms/onenote-errors#C10008"
				}
			};

			let expected = {
				error: "Unexpected response status",
				statusCode: 403,
				responseHeaders: { "Content-Type": "application/json" },
				response: JSON.stringify(responseJson),
				timeout: 30000
			};

			this.server.respondWith([expected.statusCode, expected.responseHeaders, expected.response]);

			controllerInstance.fetchFreshNotebooks("sessionId").then((responsePackage: OneNoteApi.ResponsePackage<OneNoteApi.Notebook[]>) => {
				ok(false, "resolve should not be called");
			}, (error: OneNoteApi.RequestError) => {
				deepEqual(error, expected, "The error object should be rejected");
				ok(!OneNoteApiUtils.isRetryable(controllerInstance.state.apiResponseCode));
			}).then(() => {
				done();
			});
		});

		test("fetchFreshNotebooks should reject with the error object and a copy of the response if the status code is 5XX", (assert: QUnitAssert) => {
			let done = assert.async();

			let controllerInstance = MithrilUtils.mountToFixture(this.defaultComponent);

			let responseJson = {
				error: "Unexpected response status",
				statusCode: 501,
				responseHeaders: { "Content-Type": "application/json" }
			};
			this.server.respondWith([501, responseJson.responseHeaders, JSON.stringify(responseJson)]);

			let expected = {
				error: responseJson.error,
				statusCode: responseJson.statusCode,
				responseHeaders: responseJson.responseHeaders,
				response: JSON.stringify(responseJson),
				timeout: 30000
			};

			controllerInstance.fetchFreshNotebooks("sessionId").then((responsePackage: OneNoteApi.ResponsePackage<OneNoteApi.Notebook[]>) => {
				ok(false, "resolve should not be called");
			}, (error) => {
				deepEqual(error, expected, "The error object should be rejected");
			}).then(() => {
				done();
			});
		});
	}
}

(new SectionPickerSinonTests()).runTests();
