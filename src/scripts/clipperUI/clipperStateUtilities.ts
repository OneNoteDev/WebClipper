import {ObjectUtils} from "../objectUtils";

import * as Log from "../logging/log";
import {ClipMode} from "./clipMode";
import {ClipperState} from "./clipperState";
import {Status} from "./status";
import { Clipper } from "./frontEndGlobals";
import { SmartValue } from "../communicator/smartValue";
import { Constants } from "../constants";
import { TimeStampedData, CachedHttp } from "../http/cachedHttp";
import { UserInfo, UpdateReason } from "../userInfo";

export module ClipperStateUtilities {
	export function isUserLoggedIn(state: ClipperState, refreshUserInfo?: boolean): boolean {
		if (state.userResult && state.userResult.status && state.userResult.data && !!state.userResult.data.user) {
			return true;
		} else if (!!refreshUserInfo) {
			let userInfoUpdateCb = (updatedUser: UserInfo) => {
				console.log(updatedUser);
				if (updatedUser) {
					let userInfoUpdatedEvent = new Log.Event.BaseEvent(Log.Event.Label.UserInfoUpdated);
					userInfoUpdatedEvent.setCustomProperty(Log.PropertyName.Custom.UserUpdateReason, UpdateReason[updatedUser.updateReason]);
					userInfoUpdatedEvent.setCustomProperty(Log.PropertyName.Custom.LastUpdated, new Date(updatedUser.lastUpdated).toUTCString());
					Clipper.logger.logEvent(userInfoUpdatedEvent);
				}

				if (updatedUser && updatedUser.user) {
					let timeStampedData: TimeStampedData = {
						data: updatedUser.user,
						lastUpdated: updatedUser.lastUpdated
					};

					// The user SV should never be set with expired user information
					let tokenHasExpiredForLoggedInUser = CachedHttp.valueHasExpired(timeStampedData, (updatedUser.user.accessTokenExpiration * 1000) - 180000);
					if (tokenHasExpiredForLoggedInUser) {
						Clipper.logger.logFailure(Log.Failure.Label.UserSetWithInvalidExpiredData, Log.Failure.Type.Unexpected);
					}

					state.setState({ userResult: { status: Status.Succeeded, data: updatedUser } });
					Clipper.logger.setContextProperty(Log.Context.Custom.AuthType, updatedUser.user.authType);
					Clipper.logger.setContextProperty(Log.Context.Custom.UserInfoId, updatedUser.user.cid);
				} else {
					state.setState({ userResult: { status: Status.Failed, data: updatedUser } });
				}
			};

			state.setState({ userResult: { status: Status.InProgress } });
			Clipper.getExtensionCommunicator().callRemoteFunction(Constants.FunctionKeys.getInitialUser, {
				callback: (freshInitialUser: UserInfo) => {
					if (freshInitialUser && freshInitialUser.user) {
						Clipper.logger.logUserFunnel(Log.Funnel.Label.AuthAlreadySignedIn);
					} else if (!freshInitialUser) {
						userInfoUpdateCb(freshInitialUser);
					}
					Clipper.getExtensionCommunicator().subscribeAcrossCommunicator(new SmartValue<UserInfo>(), Constants.SmartValueKeys.user, (updatedUser: UserInfo) => {
						userInfoUpdateCb(updatedUser);
					});
				}
			});
		}
	}

	export function isMsaUser(state: ClipperState): boolean {
		return state.userResult && state.userResult.data && state.userResult.data.user && state.userResult.data.user.authType && (state.userResult.data.user.authType.toLowerCase() === "msa");
	}

	export function clipButtonEnabled(clipperState: ClipperState): boolean {
		let currentMode = clipperState.currentMode.get();
		switch (currentMode) {
			case ClipMode.Pdf:
				if (!clipperState.pdfPreviewInfo.isLocalFileAndNotAllowed) {
					return false;
				} else if (clipperState.pdfResult.status !== Status.Succeeded) {
					return false;
				} else if (clipperState.pdfPreviewInfo.allPages) {
					return true;
				} else if (!clipperState.pdfPreviewInfo.allPages && ObjectUtils.isNullOrUndefined(clipperState.pdfPreviewInfo.selectedPageRange)) {
					return false;
				}

				// If the user has an invalidPageRange, the clipButton is still enabled,
				// but when the user clips, we short circuit it and display a message instead
				return true;
			case ClipMode.FullPage:
				// In the past, we used to allow clips while this is pending, however, we found some pages can't be clipped in full page mode	
				let fullPageScreenshotResult = clipperState.fullPageResult;
				return fullPageScreenshotResult.status === Status.Succeeded;
			case ClipMode.Region:
				let regionResult = clipperState.regionResult;
				return regionResult.status === Status.Succeeded && regionResult.data && regionResult.data.length > 0;
			case ClipMode.Augmentation:
				let augmentationResult = clipperState.augmentationResult;
				return augmentationResult.status === Status.Succeeded && augmentationResult.data && !!augmentationResult.data.ContentInHtml;
			case ClipMode.Bookmark:
				let bookmarkResult = clipperState.bookmarkResult;
				return bookmarkResult.status === Status.Succeeded;
			case ClipMode.Selection:
				// The availability of this mode is passed together with the selected text, so it's always available
				return true;
			default:
				return undefined;
		}
	}
}
