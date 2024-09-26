import { Clipper } from "../clipperUI/frontEndGlobals";
import { Constants } from "../constants";
import { HttpWithRetries } from "../http/httpWithRetries";
import { UrlUtils } from "../urlUtils";
import { UserInfoData, AuthType } from "../userInfo";
import { DataBoundary } from "./dataBoundary";

export class UserDataBoundaryHelper {
	/**
	 * fetch the user data bounday from the emailAddress
	 * @param userInfo 
	 * @returns user data boudary
	 */
	public async getUserDataBoundary(userInfo: UserInfoData): Promise<string | undefined> {
		try {
			if (!userInfo) {
				return undefined;
			}
			if (userInfo.authType === AuthType[AuthType.Msa]) {
				return DataBoundary[DataBoundary.GLOBAL];
			}
			if (!userInfo.emailAddress) {
				return undefined;
			}
			let dataBoundaryString: string = await this.getUserDataBoundaryInternal(userInfo);
			return dataBoundaryString;
		} catch (error) {
			return error.message;
		}
	}

	/**
	 * fetch the user data bounday from the emailAddress
	 * @param userInfo 
	 * @returns user data boudary
	 */
	private async getUserDataBoundaryInternal(userInfo: UserInfoData): Promise<string | undefined> {
		return new Promise<string | undefined>((resolve, reject) => {
			let domainValue = userInfo.emailAddress.substring(
				userInfo.emailAddress.indexOf("@") + 1);
			const urlDataBoundaryDomain: string = UrlUtils.addUrlQueryValue(Constants.Urls.userDataBoundaryDomain, Constants.Urls.QueryParams.domain, domainValue);
			HttpWithRetries.get(urlDataBoundaryDomain).then((response: Response) => {
				let expectedCodes = [200];
				if (expectedCodes.indexOf(response.status) > -1) {
					response.text().then((responseText) => {
						let parsedResponse: any;
						try {
							parsedResponse = JSON.parse(responseText);
						} catch (error) {
							Clipper.logger.logJsonParseUnexpected(responseText);
							reject(error);
						}
						if (parsedResponse && parsedResponse.telemetryRegion) {
							resolve(parsedResponse.telemetryRegion);
						} else {
							resolve(DataBoundary[DataBoundary.UNKNOWN]);
						}
					});
				} else {
					resolve(DataBoundary[DataBoundary.UNKNOWN]);
				}
			}, (error) => {
				reject(error);
			});
		});
	}
}
