import {OneNoteSaveable} from "./oneNoteSaveable";

export class OneNoteSaveablePage implements OneNoteSaveable {
	private page: OneNoteApi.OneNotePage;

	constructor(page: OneNoteApi.OneNotePage) {
		this.page = page;
	}

	public getPage(): Promise<OneNoteApi.OneNotePage> {
		return Promise.resolve(this.page);
	}

	public getPatch(index: number): Promise<OneNoteApi.Revision[]> {
		return Promise.resolve(undefined);
	}

	public getNumPatches(): number {
		return 0;
	}
}
