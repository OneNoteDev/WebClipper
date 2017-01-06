import {Clipper} from "../../../scripts/clipperUI/frontEndGlobals";
import {Status} from "../../../scripts/clipperUI/status";
import {OneNoteApiUtils} from "../../../scripts/clipperUI/oneNoteApiUtils";

import {SectionPicker, SectionPickerClass, SectionPickerState} from "../../../scripts/clipperUI/components/sectionPicker";

import {ClipperStorageKeys} from "../../../scripts/storage/clipperStorageKeys";

import {MithrilUtils} from "../../mithrilUtils";
import {MockProps} from "../../mockProps";
import {TestModule} from "../../testModule";

import { SectionPickerUtils } from "./sectionPickerUtils";

type StoredSection = {
	section: OneNoteApi.Section,
	path: string,
	parentId: string
};

export class SectionPickerTests extends TestModule {
	private defaultComponent;
	private mockClipperState = MockProps.getMockClipperState();

	private testConstants = {
		Ids: {
			sectionLocationContainer: "sectionLocationContainer",
			sectionPickerContainer: "sectionPickerContainer"
		}
	};

	protected module() {
		return "sectionPicker";
	}

	protected beforeEach() {
		this.defaultComponent = <SectionPicker
			onPopupToggle={() => {}}
			clipperState={this.mockClipperState} />;
	}

	protected tests() {
		test("fetchCachedNotebookAndSectionInfoAsState should return the cached notebooks, cached current section, and the succeed status if cached information is found", () => {
			let clipperState = MockProps.getMockClipperState();

			let mockNotebooks = MockProps.getMockNotebooks();
			let mockSection = {
				section: mockNotebooks[0].sections[0],
				path: "A > B > C",
				parentId: mockNotebooks[0].id
			};
			SectionPickerUtils.initializeClipperStorage(JSON.stringify(mockNotebooks), JSON.stringify(mockSection));

			let component = <SectionPicker
				onPopupToggle={() => {}}
				clipperState={clipperState} />;
			let controllerInstance = MithrilUtils.mountToFixture(component);

			controllerInstance.fetchCachedNotebookAndSectionInfoAsState((response: SectionPickerState) => {
				strictEqual(JSON.stringify(response), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: mockSection }),
					"The cached information should be returned as SectionPickerState");
			});
		});

		test("fetchCachedNotebookAndSectionInfoAsState should return undefined if no cached information is found", () => {
			let clipperState = MockProps.getMockClipperState();

			SectionPickerUtils.initializeClipperStorage(undefined, undefined);

			let component = <SectionPicker
				onPopupToggle={() => {}}
				clipperState={clipperState} />;
			let controllerInstance = MithrilUtils.mountToFixture(component);

			controllerInstance.fetchCachedNotebookAndSectionInfoAsState((response: SectionPickerState) => {
				strictEqual(response, undefined,
					"The undefined notebooks and section information should be returned as SectionPickerState");
			});
		});

		test("fetchCachedNotebookAndSectionInfoAsState should return the cached notebooks, undefined section, and the succeed status if no cached section is found", () => {
			let clipperState = MockProps.getMockClipperState();

			let mockNotebooks = MockProps.getMockNotebooks();
			SectionPickerUtils.initializeClipperStorage(JSON.stringify(mockNotebooks), undefined);

			let component = <SectionPicker
				onPopupToggle={() => {}}
				clipperState={clipperState} />;
			let controllerInstance = MithrilUtils.mountToFixture(component);

			controllerInstance.fetchCachedNotebookAndSectionInfoAsState((response: SectionPickerState) => {
				strictEqual(JSON.stringify(response), JSON.stringify({ notebooks: mockNotebooks, status: Status.Succeeded, curSection: undefined }),
					"The cached information should be returned as SectionPickerState");
			});
		});

		test("fetchCachedNotebookAndSectionInfoAsState should return undefined when no notebooks are found, even if section information is found", () => {
			let clipperState = MockProps.getMockClipperState();

			let mockSection = {
				section: MockProps.getMockNotebooks()[0].sections[0],
				path: "A > B > C",
				parentId: MockProps.getMockNotebooks()[0].id
			};
			SectionPickerUtils.initializeClipperStorage(undefined, JSON.stringify(mockSection));

			let component = <SectionPicker
				onPopupToggle={() => {}}
				clipperState={clipperState} />;
			let controllerInstance = MithrilUtils.mountToFixture(component);

			controllerInstance.fetchCachedNotebookAndSectionInfoAsState((response: SectionPickerState) => {
				strictEqual(response, undefined,
					"The cached information should be returned as SectionPickerState");
			});
		});

		test("convertNotebookListToState should return the notebook list, success status, and default section in the general case", () => {
			let section = SectionPickerUtils.createSection("S", true);
			let sectionGroup2 = SectionPickerUtils.createSectionGroup("SG2", [], [section]);
			let sectionGroup1 = SectionPickerUtils.createSectionGroup("SG1", [sectionGroup2], []);
			let notebook = SectionPickerUtils.createNotebook("N", true, [sectionGroup1], []);

			let notebooks = [notebook];
			let actual = SectionPickerClass.convertNotebookListToState(notebooks);
			strictEqual(actual.notebooks, notebooks, "The notebooks property is correct");
			strictEqual(actual.status, Status.Succeeded, "The status property is correct");
			deepEqual(actual.curSection, { path: "N > SG1 > SG2 > S", section: section },
				"The curSection property is correct");
		});

		test("convertNotebookListToState should return the notebook list, success status, and undefined default section in case where there is no default section", () => {
			let sectionGroup2 = SectionPickerUtils.createSectionGroup("SG2", [], []);
			let sectionGroup1 = SectionPickerUtils.createSectionGroup("SG1", [sectionGroup2], []);
			let notebook = SectionPickerUtils.createNotebook("N", true, [sectionGroup1], []);

			let notebooks = [notebook];
			let actual = SectionPickerClass.convertNotebookListToState(notebooks);
			strictEqual(actual.notebooks, notebooks, "The notebooks property is correct");
			strictEqual(actual.status, Status.Succeeded, "The status property is correct");
			strictEqual(actual.curSection, undefined, "The curSection property is undefined");
		});

		test("convertNotebookListToState should return the notebook list, success status, and undefined default section in case where there is only one empty notebook", () => {
			let notebook = SectionPickerUtils.createNotebook("N", true, [], []);

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
			let section = SectionPickerUtils.createSection("4");
			let actual = SectionPickerClass.formatSectionInfoForStorage([
				SectionPickerUtils.createNotebook("1"),
				SectionPickerUtils.createSectionGroup("2"),
				SectionPickerUtils.createSectionGroup("3"),
				section
			]);
			deepEqual(actual, { path: "1 > 2 > 3 > 4", section: section },
				"The section info should be formatted correctly");
		});

		test("formatSectionInfoForStorage should return a ' > ' delimited name path and the last element if there are no section groups", () => {
			let section = SectionPickerUtils.createSection("2");
			let actual = SectionPickerClass.formatSectionInfoForStorage([
				SectionPickerUtils.createNotebook("1"),
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
	}
}

(new SectionPickerTests()).runTests();
