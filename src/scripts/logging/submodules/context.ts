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

export class Context {
	public static Custom = Custom;

	public static contextKeyToStringMap = {
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

	public static toString(key: Custom): string {
		return Context.contextKeyToStringMap[Custom[key]];
	}
}
