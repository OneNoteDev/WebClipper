import {ClientType} from "./clientType";

export interface ClientInfo {
	clipperId: string;
	clipperType: ClientType;
	clipperVersion: string;
	flightingInfo?: string[];
}
