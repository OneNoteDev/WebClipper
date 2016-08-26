import {ClientType} from "./ClientType";

export interface ClientInfo {
	clipperId: string;
	clipperType: ClientType;
	clipperVersion: string;
	flightingInfo?: string[];
}
