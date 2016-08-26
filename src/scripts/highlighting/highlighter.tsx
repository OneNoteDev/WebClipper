declare var TextHighlighter;

/**
 * Ensures that there's only one TextHighlighter in existence. Calls to
 * replaceWithInstance will tear down the previous instance, then constructs
 * a new TextHighlighter.
 */
export class Highlighter {
	private static instance: any;

	/**
	 * Tears down the old TextHighlighter instance and creates a new one
	 */
	public static reconstructInstance(element, options): any {
		Highlighter.tearDownCurrentInstance();
		Highlighter.instance = new TextHighlighter(element, options);
		return Highlighter.instance;
	}

	private static tearDownCurrentInstance(): void {
		if (Highlighter.instance) {
			Highlighter.instance.disable();
		}
	}
}
