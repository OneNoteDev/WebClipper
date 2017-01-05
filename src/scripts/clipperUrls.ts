import {ClientType} from "./clientType";
import {Constants} from "./constants";
import {UrlUtils} from "./urlUtils";

import {ClipperState} from "./clipperUI/clipperState";

export class ClipperUrls {
	public static generateFeedbackUrl(clipperState: ClipperState, usid: string, logCategory: string): string {
		let generatedFeedbackUrl = UrlUtils.addUrlQueryValue(Constants.Urls.clipperFeedbackUrl,
			"LogCategory", logCategory);
		generatedFeedbackUrl = UrlUtils.addUrlQueryValue(generatedFeedbackUrl,
			"originalUrl", clipperState.pageInfo.rawUrl);
		generatedFeedbackUrl = UrlUtils.addUrlQueryValue(generatedFeedbackUrl,
			"clipperId", clipperState.clientInfo.clipperId);
		generatedFeedbackUrl = UrlUtils.addUrlQueryValue(generatedFeedbackUrl,
			"usid", usid);
		generatedFeedbackUrl = UrlUtils.addUrlQueryValue(generatedFeedbackUrl,
			"type", ClientType[clipperState.clientInfo.clipperType]);
		generatedFeedbackUrl = UrlUtils.addUrlQueryValue(generatedFeedbackUrl,
			"version", clipperState.clientInfo.clipperVersion);

		return generatedFeedbackUrl;
	}

	public static generateSignInUrl(clipperId: string, sessionId: string, authType: string): string {
		return this.addAuthenticationQueryValues(Constants.Urls.Authentication.signInUrl, clipperId, sessionId, authType);
	}

	public static generateSignOutUrl(clipperId: string, sessionId: string, authType: string): string {
		return this.addAuthenticationQueryValues(Constants.Urls.Authentication.signOutUrl, clipperId, sessionId, authType);
	}

	private static addAuthenticationQueryValues(originalUrl: string, clipperId: string, sessionId: string, authType: string): string {
		let authenticationUrl = UrlUtils.addUrlQueryValue(originalUrl, Constants.Urls.QueryParams.authType, authType);
		authenticationUrl = UrlUtils.addUrlQueryValue(authenticationUrl, Constants.Urls.QueryParams.clipperId, clipperId);
		authenticationUrl = UrlUtils.addUrlQueryValue(authenticationUrl, Constants.Urls.QueryParams.userSessionId, sessionId);
		return authenticationUrl;
	}
}
