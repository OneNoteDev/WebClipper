export module Funnel {
	export let category = "Funnel";

	export enum Label {
		Invoke,
		AuthAlreadySignedIn,
		AuthAttempted,
		AuthSignInCompleted,
		AuthSignInFailed,
		ClipAttempted,
		Interact,
		ViewInWac,
		SignOut
	}
}
