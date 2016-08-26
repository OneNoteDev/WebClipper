export module Session {
	export let category = "Session";

	export enum EndTrigger {
		SignOut,
		Unload
	}

	export enum State {
		Started = 0,
		Ended = 1
	}
}
