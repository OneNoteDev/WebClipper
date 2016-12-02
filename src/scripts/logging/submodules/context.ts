export module Context {
	let contextKeyToStringMap = {
		AppInfoId: "AppInfo.Id",
		AppInfoVersion: "AppInfo.Version",
		DeviceInfoId: "DeviceInfo.Id",
		ExtensionLifecycleId: "ExtensionLifecycle.Id",
		SessionId: "Session.Id",
		UserInfoId: "UserInfo.Id",
		UserInfoLanguage: "UserInfo.Language",
		AuthType: "AuthType",
		BrowserLanguage: "BrowserLanguage",
		ClipperType: "ClipperType",
		ContentType: "ContentType",
		FlightInfo: "FlightInfo",
		InPrivateBrowsing: "InPrivateBrowsing",
		InvokeHostname: "InvokeHostname",
		PageLanguage: "PageLanguage"
	};

	export enum Custom {
		AppInfoId,
		AppInfoVersion,
		ExtensionLifecycleId,
		DeviceInfoId,
		SessionId,
		UserInfoId,
		UserInfoLanguage,
		AuthType,
		BrowserLanguage,
		ClipperType,
		ContentType,
		FlightInfo,
		InPrivateBrowsing,
		InvokeHostname,
		PageLanguage
	}

	export function toString(key: Custom): string {
		return contextKeyToStringMap[Custom[key]];
	}
}
