export abstract class TestModule {
	protected abstract module(): string;
	protected abstract tests(): void;

	public runTests(): void {
		QUnit.module(this.module(), {
			beforeEach: this.beforeEach.bind(this),
			afterEach: this.afterEach.bind(this)
		});
		this.tests();
	}

	// Overridable
	protected beforeEach() { }
	protected afterEach() { }
}
