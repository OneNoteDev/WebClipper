import {ObjectUtils} from "../objectUtils";

import * as Log from "./log";

export interface Context {
	requirementsAreMet(requirements: { [key: string]: string | number | boolean }): boolean;
}

export class NoRequirements implements Context {
	requirementsAreMet(requirements: { [key: string]: string | number | boolean }): boolean {
		return true;
	}
}

export class ProductionRequirements implements Context {
	private prodProperties = [
		Log.Context.toString(Log.Custom.AppInfoId),
		Log.Context.toString(Log.Custom.AppInfoVersion),
		Log.Context.toString(Log.Custom.BrowserLanguage),
		Log.Context.toString(Log.Custom.ExtensionLifecycleId),
		Log.Context.toString(Log.Custom.ClipperType),
		Log.Context.toString(Log.Custom.DeviceInfoId),
		Log.Context.toString(Log.Custom.FlightInfo),
		Log.Context.toString(Log.Custom.InPrivateBrowsing)
	];

	private requiredProperties: string[];

	constructor(requiredProperties?: string[]) {
		this.requiredProperties = requiredProperties ? requiredProperties : this.prodProperties;
	}

	requirementsAreMet(contextProps: { [key: string]: string | number | boolean }): boolean {
		if (ObjectUtils.isNullOrUndefined(contextProps)) {
			return false;
		}
		for (let i = 0; i < this.requiredProperties.length; ++i) {
			let prop = this.requiredProperties[i];
			if (!contextProps.hasOwnProperty(prop)) {
				return false;
			}
		}
		return true;
	}
}
