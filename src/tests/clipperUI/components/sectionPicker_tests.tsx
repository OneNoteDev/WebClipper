import * as sinon from "sinon";

import {Clipper} from "../../../scripts/clipperUI/frontEndGlobals";
import {Status} from "../../../scripts/clipperUI/status";
import {OneNoteApiUtils} from "../../../scripts/clipperUI/oneNoteApiUtils";

import {SectionPicker, SectionPickerClass, SectionPickerState} from "../../../scripts/clipperUI/components/sectionPicker";

import {ClipperStorageKeys} from "../../../scripts/storage/clipperStorageKeys";

import {HelperFunctions} from "../../helperFunctions";

export module TestConstants {
	export module Ids {
		export var sectionLocationContainer = "sectionLocationContainer";
		export var sectionPickerContainer = "sectionPickerContainer";
	}
}

type StoredSection = {
	section: OneNoteApi.Section,
	path: string,
	parentId: string
};

let defaultUserInfoAsJsonString = JSON.stringify({
	emailAddress: "mockEmail@hotmail.com",
	fullName: "Mock Johnson",
	accessToken: "mockToken",
	accessTokenExpiration: 3000
});

// Mock out the Clipper.Storage functionality
let mockStorage: { [key: string]: string } = {};
Clipper.getStoredValue = (key: string, callback: (value: string) => void) => {
	callback(mockStorage[key]);
};
Clipper.storeValue = (key: string, value: string) => {
	mockStorage[key] = value;
};

function initializeClipperStorage(notebooks: string, curSection: string, userInfo?: string) {
	mockStorage = { };
	Clipper.storeValue(ClipperStorageKeys.cachedNotebooks, notebooks);
	Clipper.storeValue(ClipperStorageKeys.currentSelectedSection, curSection);
	Clipper.storeValue(ClipperStorageKeys.userInformation, userInfo);
}

let createNotebook = (id: string, isDefault?: boolean, sectionGroups?: OneNoteApi.SectionGroup[], sections?: OneNoteApi.Section[]): OneNoteApi.Notebook => {
	return {
		name: id.toUpperCase(),
		isDefault: isDefault,
		userRole: undefined,
		isShared: true,
		links: undefined,
		id: id.toLowerCase(),
		self: undefined,
		createdTime: undefined,
		lastModifiedTime: undefined,
		createdBy: undefined,
		lastModifiedBy: undefined,
		sectionsUrl: undefined,
		sectionGroupsUrl: undefined,
		sections: sections,
		sectionGroups: sectionGroups
	};
};

let createSectionGroup = (id: string, sectionGroups?: OneNoteApi.SectionGroup[], sections?: OneNoteApi.Section[]): OneNoteApi.SectionGroup => {
	return {
		name: id.toUpperCase(),
		id: id.toLowerCase(),
		self: undefined,
		createdTime: undefined,
		lastModifiedTime: undefined,
		createdBy: undefined,
		lastModifiedBy: undefined,
		sectionsUrl: undefined,
		sectionGroupsUrl: undefined,
		sections: sections,
		sectionGroups: sectionGroups
	};
};

let createSection = (id: string, isDefault?: boolean): OneNoteApi.Section => {
	return {
		name: id.toUpperCase(),
		isDefault: isDefault,
		parentNotebook: undefined,
		id: id.toLowerCase(),
		self: undefined,
		createdTime: undefined,
		lastModifiedTime: undefined,
		createdBy: undefined,
		lastModifiedBy: undefined,
		pagesUrl: undefined,
		pages: undefined
	};
};

let mockClipperState = HelperFunctions.getMockClipperState();
let defaultComponent;
let xhr: Sinon.SinonFakeXMLHttpRequest;
let server: Sinon.SinonFakeServer;

QUnit.module("sectionPicker", {
	beforeEach: () => {
		defaultComponent = <SectionPicker
			onPopupToggle={() => {}}
			clipperState={mockClipperState} />;
	}
});

test("fetchCachedNotebookAndSectionInfoAsState should return the cached notebooks, cached current section, and the succeed status if cached information is found", () => {
	let clipperState = HelperFunctions.getMockClipperState();

	let mockNotebooks = HelperFunctions.getMockNotebooks();
	let mockSection = {
		section: mockNotebooks[0].sections[0],
		path: "A > B > C",
		parentId: mockNotebooks[0].id
	};
	initializeClipperStorage(JSON.stringify(mockNotebooks), JSON.stringify(mockSection));

	let component = <SectionPicker
		onPopupToggle={() => {}}
		clipperState={clipperState} />;
	let controllerInstance = HelperFunctions.mountToFixture(component);

	controllerInstance.fetchCachedNotebookAndSectionInfoAsState((response: SectionPickerState) => {
		strictEqual(JSON.stringify(response), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: mockSection }),
			"The cached information should be returned as SectionPickerState");
	});
});

test("fetchCachedNotebookAndSectionInfoAsState should return undefined if no cached information is found", () => {
	let clipperState = HelperFunctions.getMockClipperState();

	initializeClipperStorage(undefined, undefined);

	let component = <SectionPicker
		onPopupToggle={() => {}}
		clipperState={clipperState} />;
	let controllerInstance = HelperFunctions.mountToFixture(component);

	controllerInstance.fetchCachedNotebookAndSectionInfoAsState((response: SectionPickerState) => {
		strictEqual(response, undefined,
			"The undefined notebooks and section information should be returned as SectionPickerState");
	});
});

test("fetchCachedNotebookAndSectionInfoAsState should return the cached notebooks, undefined section, and the succeed status if no cached section is found", () => {
	let clipperState = HelperFunctions.getMockClipperState();

	let mockNotebooks = HelperFunctions.getMockNotebooks();
	initializeClipperStorage(JSON.stringify(mockNotebooks), undefined);

	let component = <SectionPicker
		onPopupToggle={() => {}}
		clipperState={clipperState} />;
	let controllerInstance = HelperFunctions.mountToFixture(component);

	controllerInstance.fetchCachedNotebookAndSectionInfoAsState((response: SectionPickerState) => {
		strictEqual(JSON.stringify(response), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: undefined }),
			"The cached information should be returned as SectionPickerState");
	});
});

test("fetchCachedNotebookAndSectionInfoAsState should return undefined when no notebooks are found, even if section information is found", () => {
	let clipperState = HelperFunctions.getMockClipperState();

	let mockSection = {
		section: HelperFunctions.getMockNotebooks()[0].sections[0],
		path: "A > B > C",
		parentId: HelperFunctions.getMockNotebooks()[0].id
	};
	initializeClipperStorage(undefined, JSON.stringify(mockSection));

	let component = <SectionPicker
		onPopupToggle={() => {}}
		clipperState={clipperState} />;
	let controllerInstance = HelperFunctions.mountToFixture(component);

	controllerInstance.fetchCachedNotebookAndSectionInfoAsState((response: SectionPickerState) => {
		strictEqual(response, undefined,
			"The cached information should be returned as SectionPickerState");
	});
});

QUnit.module("sectionPicker-sinon", {
	beforeEach: () => {
		defaultComponent = <SectionPicker
			onPopupToggle={() => {}}
			clipperState={mockClipperState} />;

		xhr = sinon.useFakeXMLHttpRequest();
		let requests = this.requests = [];
		xhr.onCreate = req => {
			requests.push(req);
		};

		server = sinon.fakeServer.create();
		server.respondImmediately = true;
	},
	afterEach: () => {
		xhr.restore();
		server.restore();
	}
});

test("retrieveAndUpdateNotebookAndSectionSelection should update states correctly when there's notebook and curSection information found in storage," +
	"the user does not make a new selection, and then information is found on the server. Also the notebooks are the same in storage and on the server, " +
	"and the current section in storage is the same as the default section in the server's notebook list", (assert: QUnitAssert) => {
	let done = assert.async();

	let clipperState = HelperFunctions.getMockClipperState();

	// Set up the storage mock
	let mockNotebooks = HelperFunctions.getMockNotebooks();
	let mockSection = {
		section: mockNotebooks[0].sections[0],
		path: "Clipper Test > Full Page",
		parentId: mockNotebooks[0].id
	};
	initializeClipperStorage(JSON.stringify(mockNotebooks), JSON.stringify(mockSection), defaultUserInfoAsJsonString);

	// After retrieving fresh notebooks, the storage should be updated with the fresh notebooks (although it's the same in this case)
	let freshNotebooks = HelperFunctions.getMockNotebooks();
	let responseJson = {
		"@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks",
		value: freshNotebooks
	};
	server.respondWith([200, {}, JSON.stringify(responseJson)]);

	let component = <SectionPicker onPopupToggle={() => {}} clipperState={clipperState} />;
	let controllerInstance = HelperFunctions.mountToFixture(component);

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

	let clipperState = HelperFunctions.getMockClipperState();

	// Set up the storage mock
	let mockNotebooks = HelperFunctions.getMockNotebooks();
	let mockSection = {
		section: mockNotebooks[0].sections[0],
		path: "Clipper Test > Full Page",
		parentId: mockNotebooks[0].id
	};
	initializeClipperStorage(JSON.stringify(mockNotebooks), JSON.stringify(mockSection), defaultUserInfoAsJsonString);

	let component = <SectionPicker
		onPopupToggle={() => {}}
		clipperState={clipperState} />;
	let controllerInstance = HelperFunctions.mountToFixture(component);

	strictEqual(JSON.stringify(controllerInstance.state), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: mockSection }),
		"After the component is mounted, the state should be updated to reflect the notebooks and section found in storage");

	// After retrieving fresh notebooks, the storage should be updated with the fresh notebooks
	let freshNotebooks = HelperFunctions.getMockNotebooks();
	freshNotebooks.push(createNotebook("id", false, [], []));
	let responseJson = {
		"@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks",
		value: freshNotebooks
	};
	server.respondWith([200, {}, JSON.stringify(responseJson)]);

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

	let clipperState = HelperFunctions.getMockClipperState();

	// Set up the storage mock
	let mockNotebooks = HelperFunctions.getMockNotebooks();
	initializeClipperStorage(JSON.stringify(mockNotebooks), undefined, defaultUserInfoAsJsonString);

	let component = <SectionPicker
		onPopupToggle={() => {}}
		clipperState={clipperState} />;
	let controllerInstance = HelperFunctions.mountToFixture(component);

	strictEqual(JSON.stringify(controllerInstance.state), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: undefined }),
		"After the component is mounted, the state should be updated to reflect the notebooks and section found in storage");

	// After retrieving fresh notebooks, the storage should be updated with the fresh notebooks (although it's the same in this case)
	let freshNotebooks = HelperFunctions.getMockNotebooks();
	freshNotebooks.push(createNotebook("id", false, [], []));
	let responseJson = {
		"@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks",
		value: freshNotebooks
	};
	server.respondWith([200, {}, JSON.stringify(responseJson)]);

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

	let clipperState = HelperFunctions.getMockClipperState();

	// Set up the storage mock
	let mockNotebooks = HelperFunctions.getMockNotebooks();
	initializeClipperStorage(JSON.stringify(mockNotebooks), undefined, defaultUserInfoAsJsonString);

	let component = <SectionPicker
		onPopupToggle={() => {}}
		clipperState={clipperState} />;
	let controllerInstance = HelperFunctions.mountToFixture(component);

	strictEqual(JSON.stringify(controllerInstance.state), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: undefined }),
		"After the component is mounted, the state should be updated to reflect the notebooks and section found in storage");

	// The user now clicks on a section (second section of second notebook)
	HelperFunctions.simulateAction(() => {
		document.getElementById(TestConstants.Ids.sectionLocationContainer).click();
	});
	let sectionPicker = document.getElementById(TestConstants.Ids.sectionPickerContainer).firstElementChild;
	let second = sectionPicker.childNodes[1];
	let secondNotebook = second.childNodes[0] as HTMLElement;
	let secondSections = second.childNodes[1] as HTMLElement;
	HelperFunctions.simulateAction(() => {
		secondNotebook.click();
	});
	let newSelectedSection = secondSections.childNodes[1] as HTMLElement;
	HelperFunctions.simulateAction(() => {
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
		let freshNotebooks = HelperFunctions.getMockNotebooks();
		freshNotebooks.push(createNotebook("id", false, [], []));
		let responseJson = {
			"@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks",
			value: freshNotebooks
		};
		server.respondWith([200, {}, JSON.stringify(responseJson)]);

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

	let clipperState = HelperFunctions.getMockClipperState();

	// Set up the storage mock
	let mockNotebooks = HelperFunctions.getMockNotebooks();
	let mockSection = {
		section: mockNotebooks[0].sections[0],
		path: "Clipper Test > Full Page",
		parentId: mockNotebooks[0].id
	};
	initializeClipperStorage(JSON.stringify(mockNotebooks), JSON.stringify(mockSection), defaultUserInfoAsJsonString);

	let component = <SectionPicker
		onPopupToggle={() => {}}
		clipperState={clipperState} />;
	let controllerInstance = HelperFunctions.mountToFixture(component);

	strictEqual(JSON.stringify(controllerInstance.state), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: mockSection }),
		"After the component is mounted, the state should be updated to reflect the notebooks and section found in storage");

	// After retrieving fresh notebooks, the storage should be updated with the fresh notebooks (we deleted the cached currently selected section)
	let freshNotebooks = HelperFunctions.getMockNotebooks();
	freshNotebooks[0].sections = [];
	let responseJson = {
		"@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks",
		value: freshNotebooks
	};
	server.respondWith([200, {}, JSON.stringify(responseJson)]);

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

	let clipperState = HelperFunctions.getMockClipperState();

	// Set up the storage mock
	let mockNotebooks = HelperFunctions.getMockNotebooks();
	let mockSection = {
		section: mockNotebooks[0].sections[0],
		path: "Clipper Test > Full Page",
		parentId: mockNotebooks[0].id
	};
	initializeClipperStorage(JSON.stringify(mockNotebooks), JSON.stringify(mockSection), defaultUserInfoAsJsonString);

	let component = <SectionPicker
		onPopupToggle={() => {}}
		clipperState={clipperState} />;
	let controllerInstance = HelperFunctions.mountToFixture(component);

	strictEqual(JSON.stringify(controllerInstance.state), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: mockSection }),
		"After the component is mounted, the state should be updated to reflect the notebooks and section found in storage");

	// After retrieving fresh undefined notebooks, the storage should not be updated with the undefined value, but should still keep the old cached information
	let responseJson = {
		"@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks",
		value: undefined
	};
	server.respondWith([200, {}, JSON.stringify(responseJson)]);

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

	let clipperState = HelperFunctions.getMockClipperState();

	// Set up the storage mock
	let mockNotebooks = HelperFunctions.getMockNotebooks();
	let mockSection = {
		section: mockNotebooks[0].sections[0],
		path: "Clipper Test > Full Page",
		parentId: mockNotebooks[0].id
	};
	initializeClipperStorage(JSON.stringify(mockNotebooks), JSON.stringify(mockSection), defaultUserInfoAsJsonString);

	let component = <SectionPicker
		onPopupToggle={() => {}}
		clipperState={clipperState} />;
	let controllerInstance = HelperFunctions.mountToFixture(component);

	strictEqual(JSON.stringify(controllerInstance.state), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: mockSection }),
		"After the component is mounted, the state should be updated to reflect the notebooks and section found in storage");

	// After retrieving fresh undefined notebooks, the storage should not be updated with the undefined value, but should still keep the old cached information
	let responseJson = {};
	server.respondWith([404, {}, JSON.stringify(responseJson)]);

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

	let clipperState = HelperFunctions.getMockClipperState();

	// Set up the storage mock
	initializeClipperStorage(undefined, undefined, defaultUserInfoAsJsonString);

	let component = <SectionPicker
		onPopupToggle={() => {}}
		clipperState={clipperState} />;
	let controllerInstance = HelperFunctions.mountToFixture(component);

	strictEqual(JSON.stringify(controllerInstance.state), JSON.stringify({ notebooks: undefined, status: Status.NotStarted, curSection: undefined }),
		"After the component is mounted, the state should be updated to reflect that notebooks and current section are not found in storage");

	// After retrieving fresh undefined notebooks, the storage should not be updated with the undefined value, but should still keep the old cached information
	let responseJson = {};
	server.respondWith([404, {}, JSON.stringify(responseJson)]);

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

	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let notebooks = HelperFunctions.getMockNotebooks();
	let responseJson = {
		"@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks",
		value: notebooks
	};
	server.respondWith([200, {}, JSON.stringify(responseJson)]);

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

	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let notebooks = HelperFunctions.getMockNotebooks();
	let responseJson = {
		"@odata.context": "https://www.onenote.com/api/v1.0/$metadata#me/notes/notebooks",
		value: notebooks
	};
	server.respondWith([201, {}, JSON.stringify(responseJson)]);

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

	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let responseJson = {
		error: "Unexpected response status",
		statusCode: 401,
		responseHeaders: {}
	};

	let expected = {
		error: responseJson.error,
		statusCode: responseJson.statusCode,
		responseHeaders: responseJson.responseHeaders,
		response: JSON.stringify(responseJson),
		timeout: 30000
	};

	server.respondWith([expected.statusCode, expected.responseHeaders, expected.response]);

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

	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let responseJson = {
		error: {
			code: "10008",
			message: "The user's OneDrive, Group or Document Library contains more than 5000 items and cannot be queried using the API.",
			"@api.url": "http://aka.ms/onenote-errors#C10008"
		}
	};

	let expected = {
		error: "Unexpected response status",
		statusCode: 403,
		responseHeaders: {},
		response: JSON.stringify(responseJson),
		timeout: 30000
	};

	server.respondWith([expected.statusCode, expected.responseHeaders, expected.response]);

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

	let controllerInstance = HelperFunctions.mountToFixture(defaultComponent);

	let responseJson = {
		error: "Unexpected response status",
		statusCode: 501,
		responseHeaders: {}
	};
	server.respondWith([501, {}, JSON.stringify(responseJson)]);

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

QUnit.module("sectionPicker-static", {});

test("convertNotebookListToState should return the notebook list, success status, and default section in the general case", () => {
	let section = createSection("S", true);
	let sectionGroup2 = createSectionGroup("SG2", [], [section]);
	let sectionGroup1 = createSectionGroup("SG1", [sectionGroup2], []);
	let notebook = createNotebook("N", true, [sectionGroup1], []);

	let notebooks = [notebook];
	let actual = SectionPickerClass.convertNotebookListToState(notebooks);
	strictEqual(actual.notebooks, notebooks, "The notebooks property is correct");
	strictEqual(actual.status, Status.Succeeded, "The status property is correct");
	deepEqual(actual.curSection, { path: "N > SG1 > SG2 > S", section: section },
		"The curSection property is correct");
});

test("convertNotebookListToState should return the notebook list, success status, and undefined default section in case where there is no default section", () => {
	let sectionGroup2 = createSectionGroup("SG2", [], []);
	let sectionGroup1 = createSectionGroup("SG1", [sectionGroup2], []);
	let notebook = createNotebook("N", true, [sectionGroup1], []);

	let notebooks = [notebook];
	let actual = SectionPickerClass.convertNotebookListToState(notebooks);
	strictEqual(actual.notebooks, notebooks, "The notebooks property is correct");
	strictEqual(actual.status, Status.Succeeded, "The status property is correct");
	strictEqual(actual.curSection, undefined, "The curSection property is undefined");
});

test("convertNotebookListToState should return the notebook list, success status, and undefined default section in case where there is only one empty notebook", () => {
	let notebook = createNotebook("N", true, [], []);

	let notebooks = [notebook];
	let actual = SectionPickerClass.convertNotebookListToState(notebooks);
	strictEqual(actual.notebooks, notebooks, "The notebooks property is correct");
	strictEqual(actual.status, Status.Succeeded, "The status property is correct");
	strictEqual(actual.curSection, undefined, "The curSection property is undefined");
});

test("convertNotebookListToState should return the undefined notebook list, success status, and undefined default section if the input is undefined", () => {
	let actual = SectionPickerClass.convertNotebookListToState(undefined);
	strictEqual(actual.notebooks, undefined, "The notebooks property is undefined");
	strictEqual(actual.status, Status.Succeeded, "The status property is correct");
	strictEqual(actual.curSection, undefined, "The curSection property is undefined");
});

test("convertNotebookListToState should return the empty notebook list, success status, and undefined default section if the input is undefined", () => {
	let actual = SectionPickerClass.convertNotebookListToState([]);
	strictEqual(actual.notebooks.length, 0, "The notebooks property is the empty list");
	strictEqual(actual.status, Status.Succeeded, "The status property is correct");
	strictEqual(actual.curSection, undefined, "The curSection property is undefined");
});

test("formatSectionInfoForStorage should return a ' > ' delimited name path and the last element in the general case", () => {
	let section = createSection("4");
	let actual = SectionPickerClass.formatSectionInfoForStorage([
		createNotebook("1"),
		createSectionGroup("2"),
		createSectionGroup("3"),
		section
	]);
	deepEqual(actual, { path: "1 > 2 > 3 > 4", section: section },
		"The section info should be formatted correctly");
});

test("formatSectionInfoForStorage should return a ' > ' delimited name path and the last element if there are no section groups", () => {
	let section = createSection("2");
	let actual = SectionPickerClass.formatSectionInfoForStorage([
		createNotebook("1"),
		section
	]);
	deepEqual(actual, { path: "1 > 2", section: section },
		"The section info should be formatted correctly");
});

test("formatSectionInfoForStorage should return undefined if the list that is passed in is undefined", () => {
	let actual = SectionPickerClass.formatSectionInfoForStorage(undefined);
	strictEqual(actual, undefined, "The section info should be formatted correctly");
});

test("formatSectionInfoForStorage should return undefined if the list that is passed in is empty", () => {
	let actual = SectionPickerClass.formatSectionInfoForStorage([]);
	strictEqual(actual, undefined, "The section info should be formatted correctly");
});
