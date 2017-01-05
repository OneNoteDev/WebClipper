/**
 * A collection of commonly used QUnit assertions
 */
export class Assert {
	public static tabOrderIsIncremental(elementIds: string[]) {
		let elementsInExpectedTabOrder = elementIds.map(id => { return { name: id, elem: document.getElementById(id) }; });
		Assert.tabOrderIsIncrementalForElements(elementsInExpectedTabOrder);
	}

	public static tabOrderIsIncrementalForElements(elements: { name: string, elem: HTMLElement }[]) {
		// Assert positive tabIndexes
		for (let element of elements) {
			let tabIndex = element.elem.tabIndex;
			ok(tabIndex >= 0, "Element " + element.name + " should have a positive tabIndex, but was: " + tabIndex);
		}

		if (elements.length < 2) {
			return;
		}

		// Assert tab index ordering
		for (let i = 1; i < elements.length; i++) {
			ok(elements[i].elem.tabIndex > elements[i - 1].elem.tabIndex,
				"Element " + elements[i].name + " should have a greater tabIndex than element " + elements[i - 1].name);
		}
	}

	public static equalTabIndexes(elements: HTMLElement[] | HTMLCollectionOf<Element> | NodeListOf<HTMLElement>) {
		// Buttons should have equal tab indexes
		let expectedTabIndex: number = undefined;
		for (let i = 0; i < elements.length; i++) {
			let element = elements[i] as HTMLElement;
			if (!expectedTabIndex) {
				expectedTabIndex = element.tabIndex;
			} else {
				strictEqual(element.tabIndex, expectedTabIndex, "Dialog button tabs should have the same tab indexes");
			}
			ok(element.tabIndex >= 0);
		}
	}
}
