export interface ChangeLogSchema {
	schemaVersion: string;
	updates: ChangeLogUpdate[];
}

export interface ChangeLogUpdate {
	version: string;
	date: string;
	changes: ChangeLogChange[];
}

export interface ChangeLogChange {
	title: string;
	imageUrl?: string;
	description: string;
	// "EdgeExtension" | "ChromeExtension" | "FirefoxExtension" | "SafariExtension" | "Bookmarklet";
	supportedBrowsers: string[];
}

export class ChangeLog {
	public static schemaVersionSupported = "1";
}
