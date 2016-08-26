export module ChangeLog {
	export let schemaVersionSupported = "1";

	export interface Schema {
		schemaVersion: string;
		updates: Update[];
	}

	export interface Update {
		version: string;
		date: string;
		changes: Change[];
	}

	export interface Change {
		title: string;
		imageUrl?: string;
		description: string;
		// "EdgeExtension" | "ChromeExtension" | "FirefoxExtension" | "SafariExtension" | "Bookmarklet";
		supportedBrowsers: string[];
	}
}
