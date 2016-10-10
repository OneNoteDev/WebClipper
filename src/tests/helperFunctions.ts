/// <reference path="../../node_modules/onenoteapi/target/oneNoteApi.d.ts" />

import {ClientType} from "../scripts/clientType";

import {Polyfills} from "../scripts/polyfills";

import {ClipMode} from "../scripts/clipperUI/clipMode";
import {ClipperState} from "../scripts/clipperUI/clipperState";
import {Clipper} from "../scripts/clipperUI/frontEndGlobals";
import {MainControllerProps} from "../scripts/clipperUI/mainController";
import {Status} from "../scripts/clipperUI/status";

import {ModeButtonProps} from "../scripts/clipperUI/components/modeButton";

import {Communicator} from "../scripts/communicator/communicator";
import {SmartValue} from "../scripts/communicator/smartValue";

import {InvokeMode} from "../scripts/extensions/invokeOptions";

import {Localization} from "../scripts/localization/localization";

import * as Log from "../scripts/logging/log";
import {ConsoleLoggerDecorator} from "../scripts/logging/consoleLoggerDecorator";
import {ProductionRequirements} from "../scripts/logging/context";

import {ChangeLog} from "../scripts/versioning/changeLog";

import {Settings} from "../scripts/settings";
import {UpdateReason} from "../scripts/userInfo";

import {MockMessageHandler} from "./communicator/mockMessageHandler";

import {MockConsole} from "./logging/mockConsole";

Polyfills.init();

/**
 * Common functions required across multiple test files
 */
export module HelperFunctions {
	export function getBaseFileName(path: string): string {
		return path.split("/").pop().split(".")[0];
	}

	export function getFixture(): Element {
		return document.getElementById("qunit-fixture");
	}

	export function getMockClipperState(): ClipperState {
		Clipper.setInjectCommunicator(new Communicator(new MockMessageHandler(), "INJECT_MOCK_COMM"));
		Clipper.setExtensionCommunicator(new Communicator(new MockMessageHandler(), "EXTENSION_MOCK_COMM"));
		Clipper.logger = new ConsoleLoggerDecorator(new MockConsole(), {
			contextStrategy: new ProductionRequirements()
		});

		let clipperState: ClipperState = {
			injectOptions: {
				frameUrl: "",
				enableAddANote: true,
				enableEditableTitle: true,
				enableRegionClipping: true
			},
			uiExpanded: true,

			fetchLocStringStatus: Status.Succeeded,

			invokeOptions: {
				invokeMode: InvokeMode.Default
			},

			userResult: {
				status: Status.Succeeded,
				data: {
					user: {
						emailAddress: "mockEmail@hotmail.com",
						fullName: "Mock Johnson",
						accessToken: "mockToken",
						accessTokenExpiration: 3000
					},
					lastUpdated: 10000000,
					updateReason: UpdateReason.InitialRetrieval
				}
			},
			pageInfo: {
				canonicalUrl: "http://www.canonical.xyzabc/",
				contentData: "",
				contentLocale: "en-US",
				contentTitle: "Jello World Website",
				contentType: undefined,
				rawUrl: "http://www.mock.xyzabc/mypage/"
			},
			clientInfo: {
				clipperId: "ON-12345678-12ab-1234-a1b2-1a23bcd45678",
				clipperType: ClientType.ChromeExtension,
				clipperVersion: "3.0.0",
				flightingInfo: []
			},

			currentMode: new SmartValue<ClipMode>(ClipMode.FullPage),
			saveLocation: "",

			fullPageResult: {
				data: undefined,
				status: Status.NotStarted
			},
			pdfResult: {
				data: undefined,
				status: Status.NotStarted
			},
			regionResult: {
				data: undefined,
				status: Status.NotStarted
			},
			augmentationResult: {
				data: undefined,
				status: Status.NotStarted
			},

			previewGlobalInfo: {
				annotation: "",
				fontSize: parseInt(Localization.getLocalizedString("WebClipper.FontSize.Preview.SansSerifDefault"), 10),
				highlighterEnabled: false,
				previewTitleText: "Edited title",
				serif: false
			},
			augmentationPreviewInfo: {
				previewBodyHtml: "Edited body"
			},
			selectionPreviewInfo: {
				previewBodyHtml: "Selected body"
			},

			oneNoteApiResult: {
				data: undefined,
				status: Status.NotStarted
			},

			showRatingsPrompt: new SmartValue<boolean>(),

			setState: (newPartialState: ClipperState) => {
				for (let key in newPartialState) {
					if (newPartialState.hasOwnProperty(key)) {
						clipperState[key] = newPartialState[key];
					}
				}
			},
			reset: () => {
			}
		};
		return clipperState;
	}

	export function getMockNotebooks(): OneNoteApi.Notebook[] {
		return [{
			isDefault: true,
			userRole: "Owner",
			isShared: false,
			sectionsUrl: "https://www.onenote.com/api/v1.0/me/notes/notebooks/0-EB15C30446636CBE!18732/sections",
			sectionGroupsUrl: "https://www.onenote.com/api/v1.0/me/notes/notebooks/0-EB15C30446636CBE!18732/sectionGroups",
			links: {
				oneNoteClientUrl: {
					href: "onenote:https://d.docs.live.net/eb15c30446636cbe/Documents/Clipper%20Test"
				},
				oneNoteWebUrl: {
					href: "https://onedrive.live.com/redir.aspx?cid=eb15c30446636cbe&page=edit&resid=EB15C30446636CBE!18732&parId=EB15C30446636CBE!105"
				}
			},
			name: "Clipper Test",
			createdBy: "Matthew Chiam",
			lastModifiedBy: "Matthew Chiam",
			lastModifiedTime: new Date("Mon Feb 22 2016"),
			id: "0-EB15C30446636CBE!18732",
			self: "https://www.onenote.com/api/v1.0/me/notes/notebooks/0-EB15C30446636CBE!18732",
			createdTime: new Date("Mon Feb 22 2016"),
			sections: [{
				isDefault: true,
				pagesUrl: "https://www.onenote.com/api/v1.0/me/notes/sections/0-EB15C30446636CBE!18742/pages",
				name: "Full Page",
				createdBy: "Matthew Chiam",
				lastModifiedBy: "Matthew Chiam",
				lastModifiedTime: new Date("Tue Feb 23 2016"),
				id: "0-EB15C30446636CBE!18742",
				self: "https://www.onenote.com/api/v1.0/me/notes/sections/0-EB15C30446636CBE!18742",
				createdTime: new Date("Tue Feb 23 2016"),
				pages: []
			}, {
				isDefault: false,
				pagesUrl: "https://www.onenote.com/api/v1.0/me/notes/sections/0-EB15C30446636CBE!18738/pages",
				name: "Pdfs",
				createdBy: "Matthew Chiam",
				lastModifiedBy: "Matthew Chiam",
				lastModifiedTime: new Date("Tue Feb 23 2016"),
				id: "0-EB15C30446636CBE!18738",
				self: "https://www.onenote.com/api/v1.0/me/notes/sections/0-EB15C30446636CBE!18738",
				createdTime: new Date("Tue Feb 23 2016"),
				pages: []
			}],
			sectionGroups: []
		}, {
			isDefault: false,
			userRole: "Owner",
			isShared: false,
			sectionsUrl: "https://www.onenote.com/api/v1.0/me/notes/notebooks/a-bc!d/sections",
			sectionGroupsUrl: "https://www.onenote.com/api/v1.0/me/notes/notebooks/a-bc!d/sectionGroups",
			links: {
				oneNoteClientUrl: {
					href: "onenote:https://d.docs.live.net/bc/Documents/Clipper%20Test%202"
				},
				oneNoteWebUrl: {
					href: "https://onedrive.live.com/redir.aspx?cid=bc&page=edit&resid=bc!d&parId=bc!d"
				}
			},
			name: "Clipper Test 2",
			createdBy: "Matthew Chiam",
			lastModifiedBy: "Matthew Chiam",
			lastModifiedTime: new Date("Mon Feb 22 2016"),
			id: "a-bc!d",
			self: "https://www.onenote.com/api/v1.0/me/notes/notebooks/abcd",
			createdTime: new Date("Mon Feb 22 2016"),
			sections: [{
				isDefault: false,
				pagesUrl: "https://www.onenote.com/api/v1.0/me/notes/sections/1234/pages",
				name: "Section X",
				createdBy: "Matthew Chiam",
				lastModifiedBy: "Matthew Chiam",
				lastModifiedTime: new Date("Tue Feb 23 2016"),
				id: "1234",
				self: "https://www.onenote.com/api/v1.0/me/notes/sections/1234",
				createdTime: new Date("Tue Feb 23 2016"),
				pages: []
			}, {
				isDefault: false,
				pagesUrl: "https://www.onenote.com/api/v1.0/me/notes/sections/5678/pages",
				name: "Section Y",
				createdBy: "Matthew Chiam",
				lastModifiedBy: "Matthew Chiam",
				lastModifiedTime: new Date("Tue Feb 23 2016"),
				id: "5678",
				self: "https://www.onenote.com/api/v1.0/me/notes/sections/5678",
				createdTime: new Date("Tue Feb 23 2016"),
				pages: []
			}],
			sectionGroups: []
		}] as OneNoteApi.Notebook[];
	}

	export function getMockMainControllerProps(): MainControllerProps {
		return {
			clipperState: getMockClipperState(),
			onSignInInvoked: () => {
			},
			onSignOutInvoked: () => {
			},
			updateFrameHeight: (newContainerHeight: number) => {
			},
			onStartClip: () => {
			}
		};
	}

	export function getMockModeButtonProps(): ModeButtonProps {
		return {
			imgSrc: "test.png",
			label: "My Button",
			myMode: ClipMode.FullPage,
			tabIndex: 420,
			selected: false,
			onModeSelected: (modeButton: ClipMode) => {
			},
			tooltipText: "tooltip"
		};
	}

	export function getMockRequiredContextProperties(): any {
		let requiredContextProperties = { };
		requiredContextProperties[Log.Context.toString(Log.Context.Custom.BrowserLanguage)] = "en-US";
		requiredContextProperties[Log.Context.toString(Log.Context.Custom.ClipperType)] = "ChromeExtension";
		requiredContextProperties[Log.Context.toString(Log.Context.Custom.FlightInfo)] = "muidflt60-clprin;premuidflt104-oit1;didfloatie";
		requiredContextProperties[Log.Context.toString(Log.Context.Custom.InvokeHostname)] = "www.onenote.com";
		requiredContextProperties[Log.Context.toString(Log.Context.Custom.PageLanguage)] = "en";
		return requiredContextProperties;
	}

	export function getMockRequiredApplicationProperties(): any {
		let requiredApplicationProperties = { };
		requiredApplicationProperties[Log.Context.toString(Log.Context.Custom.AppInfoId)] = Settings.getSetting("App_Id");
		requiredApplicationProperties[Log.Context.toString(Log.Context.Custom.AppInfoVersion)] = "3.0.0";
		requiredApplicationProperties[Log.Context.toString(Log.Context.Custom.DeviceInfoId)] = "ON-a47884e1-f64c-4dfd-ad49-49508f0ae05f";
		return requiredApplicationProperties;
	}

	export function getMockUpdates(): ChangeLog.Update[] {
		return [{
			"version": "3.1.0",
			"date": "06/03/2016",
			"changes": [{
				"title": "t1",
				"description": "d1",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari", "Bookmarklet"]
			}, {
				"title": "t2",
				"description": "d2",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari"]
			}, {
				"title": "t3",
				"description": "d3",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari"]
			}, {
				"title": "t4",
				"description": "d4",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari", "Bookmarklet"]
			}]
		}];
	}

	export function getMockUpdatesWithSomeImages(): ChangeLog.Update[] {
		return [{
			"version": "3.1.0",
			"date": "06/03/2016",
			"changes": [{
				"title": "t1",
				"description": "d1",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari", "Bookmarklet"]
			}, {
				"title": "t2",
				"imageUrl": "http://www.mywebsite.fake/2.jpeg",
				"description": "d2",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari"]
			}, {
				"title": "t3",
				"description": "d3",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari"]
			}, {
				"title": "t4",
				"description": "d4",
				"imageUrl": "http://www.mywebsite.fake/4.jpeg",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari", "Bookmarklet"]
			}]
		}];
	}

	export function getMockMultipleUpdates(): ChangeLog.Update[] {
		return [{
			"version": "3.1.0",
			"date": "06/03/2016",
			"changes": [{
				"title": "t1",
				"description": "d1",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari", "Bookmarklet"]
			}, {
				"title": "t2",
				"description": "d2",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari"]
			}, {
				"title": "t3",
				"description": "d3",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari"]
			}, {
				"title": "t4",
				"description": "d4",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari", "Bookmarklet"]
			}]
		}, {
			"version": "3.0.0",
			"date": "06/03/2016",
			"changes": [{
				"title": "t5",
				"description": "d5",
				"supportedBrowsers": ["Chrome", "Firefox", "Safari", "Bookmarklet"]
			}, {
				"title": "t6",
				"description": "d6",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari"]
			}, {
				"title": "t7",
				"description": "d7",
				"supportedBrowsers": ["Edge", "Chrome", "Firefox", "Safari"]
			}]
		}];
	}

	export function mountToFixture(component): any {
		let fixture = HelperFunctions.getFixture();
		let controllerInstance = m.mount(fixture, component);
		m.redraw(true);
		return controllerInstance;
	}

	export function simulateAction(action: () => void) {
		action();
		m.redraw(true);
	}

	export function mergeObjects(obj1: {}, obj2: {}): {} {
		let merged = {};
		for (let key in obj1) {
			merged[key] = obj1[key];
		}
		for (let key in obj2) {
			merged[key] = obj2[key];
		}
		return merged;
	}
}
