export module Failure {
	export let category = "Failure";

	export enum Type {
		Unexpected, /* ACE */
		Expected /* ICE */
	}

	export function getStackTrace(err?: Error) {
		if (!err) {
			err = new Error();
		}
		return (err as any).stack;
	}

	export enum Label {
		/* unexpected */
		ClickedButtonWithNoId,
		EndSessionWithoutTrigger,
		GetChangeLog,
		GetComputedStyle,
		GetLocalizedString,
		GetSetting,
		IFrameMessageHandlerHasNoOtherWindow,
		InvalidArgument,
		IsFeatureEnabled,
		JsonParse,
		NotImplemented,
		OnLaunchOneNoteButton,
		OrphanedWebClippersDueToExtensionRefresh,
		RegionSelectionProcessing,
		RenderFailurePanel,
		ReservedPropertyOverwriteAttempted,
		SessionAlreadySet,
		SetLoggerNoop,
		SetUndefinedLocalizedStrings,
		TraceLevelErrorWarningMessage,
		UnhandledApiCode,
		UnhandledExceptionThrown,
		UserSetWithInvalidExpiredData,
		WebExtensionWindowCreate,
		/* expected */
		UnclippablePage,
		UnsupportedBrowser
	}
}
