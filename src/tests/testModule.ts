import {Settings} from "../scripts/settings";

import {Localization} from "../scripts/localization/localization";

export abstract class TestModule {
	protected abstract module(): string;
	protected abstract tests(): void;

	public runTests(): void {
		let beforeEach = this.beforeEach.bind(this);
		let afterEach = this.afterEach.bind(this);

		QUnit.module(this.module(), {
			beforeEach: beforeEach,
			afterEach: () => {
				afterEach();

				// Unfortunately, we have some code that makes use of static, which
				// means that we might end up polluting other test modules if we don't
				// reset things. We declare these here so the developer doesn't have
				// to remember to do this in their modules.
				Settings.setSettingsJsonForTesting(undefined);
				Localization.setLocalizedStrings(undefined);
			}
		});

		this.tests();
	}

	// Overridable
	protected beforeEach() { }
	protected afterEach() { }
}
