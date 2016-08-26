export enum AuthType {
	Msa,
	OrgId
}

export interface UserInfo {
	user?: UserInfoData;
	lastUpdated?: number;
	updateReason: UpdateReason;
}

export interface UserInfoData {
	accessToken?: string;
	accessTokenExpiration?: number;
	authType?: string;
	cid?: string;
	emailAddress?: string;
	fullName?: string;
}

export enum UpdateReason {
	InitialRetrieval,
	SignInAttempt,
	SignInCancel,
	SignOutAction,
	TokenRefreshForPendingClip
}
