import {Clipper} from "../../../scripts/clipperUI/frontEndGlobals";

import {ClipperStorageKeys} from "../../../scripts/storage/clipperStorageKeys";

// Overrides
Clipper.getStoredValue = (key: string, callback: (value: string) => void) => {
	callback(SectionPickerUtils.mockStorage[key]);
};
Clipper.storeValue = (key: string, value: string) => {
	SectionPickerUtils.mockStorage[key] = value;
};

export class SectionPickerUtils {
	// Mock out the Clipper.Storage functionality
	public static mockStorage: { [key: string]: string } = {};

	public static initializeClipperStorage(notebooks: string, curSection: string, userInfo?: string) {
		SectionPickerUtils.mockStorage = { };
		Clipper.storeValue(ClipperStorageKeys.cachedNotebooks, notebooks);
		Clipper.storeValue(ClipperStorageKeys.currentSelectedSection, curSection);
		Clipper.storeValue(ClipperStorageKeys.userInformation, userInfo);
	}

	public static createNotebook(id: string, isDefault?: boolean, sectionGroups?: OneNoteApi.SectionGroup[], sections?: OneNoteApi.Section[]): OneNoteApi.Notebook {
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

	public static createSectionGroup(id: string, sectionGroups?: OneNoteApi.SectionGroup[], sections?: OneNoteApi.Section[]): OneNoteApi.SectionGroup {
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

	public static createSection(id: string, isDefault?: boolean): OneNoteApi.Section {
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
}
