import {ClientType} from "../scripts/clientType";

import {ClipMode} from "../scripts/clipperUI/clipMode";
import {ClipperState} from "../scripts/clipperUI/clipperState";
import {MainControllerProps} from "../scripts/clipperUI/mainController";
import {Status} from "../scripts/clipperUI/status";

import {ModeButtonProps} from "../scripts/clipperUI/components/modeButton";

import {SmartValue} from "../scripts/communicator/smartValue";

import {PdfScreenshotResult} from "../scripts/contentCapture/pdfScreenshotHelper";

import {InvokeMode} from "../scripts/extensions/invokeOptions";

import {Localization} from "../scripts/localization/localization";

import {UpdateReason} from "../scripts/userInfo";

/**
 * Collection of mock props used in our tests. Mostly intended for preventing
 * lots of boilerplate, and can be customized to suit the test's needs.
 */
export module MockProps {
	export function getMockClipperState(): ClipperState {
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
				data: new SmartValue<PdfScreenshotResult>({}),
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
			bookmarkResult: {
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
			pdfPreviewInfo: {
				allPages: true,
				selectedPageRange: "1,3,5",
				shouldAttachPdf: true
			},
			augmentationPreviewInfo: {
				previewBodyHtml: "Edited body"
			},
			selectionPreviewInfo: ["Selected body"],

			oneNoteApiResult: {
				data: undefined,
				status: Status.NotStarted
			},

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
}
