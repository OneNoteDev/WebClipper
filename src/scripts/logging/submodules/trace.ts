export module Trace {
	export let category = "Trace";

	export enum Label {
		DefaultingToConsoleLogger,
		DebugMode,
		RequestForClipperInstalledPageUrl
	}

	export enum Level {
		None,
		Error,
		Warning,
		Information,
		Verbose
	}
}
