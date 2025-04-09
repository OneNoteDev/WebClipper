declare module LogManager {
	export function createExtLogger(sessionId: any, uiCommunicator?: any): any;

	export interface MiscLogEventData {
		label: string;
		category: string;
		properties: { [key: string]: string };
	}

	export function reInitLoggerForDataBoundaryChange(userDataBoundary: string);
}
