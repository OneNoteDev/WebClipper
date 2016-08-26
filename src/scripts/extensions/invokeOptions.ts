export enum InvokeMode {
	ContextImage,
	ContextTextSelection,
	Default
}

export interface InvokeOptions {
	invokeMode: InvokeMode;
	// We are only sending strings at the moment, so may as well type it safely
	invokeDataForMode?: string;
}
