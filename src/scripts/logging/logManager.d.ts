declare module LogManager {
	export function createExtLogger(sessionId: any, uiCommunicator?: any): any;

	export function sendMiscLogRequest(data: MiscLogEventData, keysToCamelCase: boolean);

	export interface MiscLogEventData {
		label: string;
		category: string;
		properties: { [key: string]: string };
	}
}
