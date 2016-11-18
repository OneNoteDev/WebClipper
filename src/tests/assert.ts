/**
 * A collection of commonly used QUnit assertions
 */
export module Assert {
	export function tabOrderIsIncremental(elementIds: string[]) {
		let elementsInExpectedTabOrder = elementIds.map(id => { return { name: id, elem: document.getElementById(id) }; });

		// Assert non-zero positive tabIndexes
		for (let i = 0; i < elementsInExpectedTabOrder.length; i++) {
			let tabIndex = elementsInExpectedTabOrder[i].elem.tabIndex;
			ok(tabIndex > 0, "Element " + elementsInExpectedTabOrder[i].name + " should have a tabIndex that is greater than 0, but was: " + tabIndex);
		}

		if (elementIds.length < 2) {
			return;
		}

		// Assert tab index ordering
		for (let i = 1; i < elementsInExpectedTabOrder.length; i++) {
			ok(elementsInExpectedTabOrder[i].elem.tabIndex > elementsInExpectedTabOrder[i - 1].elem.tabIndex,
				"Element " + elementsInExpectedTabOrder[i].name + " should have a greater tabIndex than element " + elementsInExpectedTabOrder[i - 1].name);
		}
	}
}
